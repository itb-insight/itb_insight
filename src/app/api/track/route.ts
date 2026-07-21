import { headers } from "next/headers"
import { MAX_BODY_BYTES } from "@/lib/analytics/config"
import { appendBatch } from "@/lib/analytics/server/eventStore"
import checkRateLimit, { clientKey } from "@/lib/analytics/server/rateLimit"
import validateBatch from "@/lib/analytics/server/validate"

/**
 * The single event ingest endpoint. Build once, use everywhere.
 *
 * POST is never cached by Next, so no route config is needed here.
 */
export async function POST(request: Request) {
  const headerList = await headers()

  // Rate limit before parsing — no point spending CPU on a body we will reject.
  const limit = checkRateLimit(clientKey(headerList))
  if (!limit.allowed) {
    return new Response(JSON.stringify({ error: "rate limit exceeded" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(limit.retryAfterSeconds),
      },
    })
  }

  // Body cap. A batching client makes few requests, so batch size is the real
  // attack lever — content-length is a cheap first gate.
  const declaredLength = Number(headerList.get("content-length") ?? 0)
  if (declaredLength > MAX_BODY_BYTES) {
    return Response.json({ error: "payload too large" }, { status: 413 })
  }

  let raw: unknown
  try {
    const text = await request.text()
    if (text.length > MAX_BODY_BYTES) {
      return Response.json({ error: "payload too large" }, { status: 413 })
    }
    raw = JSON.parse(text)
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 })
  }

  const result = validateBatch(raw)
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  const accepted = appendBatch(result.batch)

  if (process.env.NODE_ENV !== "production") {
    const names = result.batch.events.map((event) => event.name).join(", ")
    console.info(`[analytics] accepted ${accepted} event(s): ${names}`)
  }

  return Response.json({ accepted }, { status: 202 })
}
