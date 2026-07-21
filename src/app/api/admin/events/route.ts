import { getRecentEvents } from "@/features/admin/data/adapters"

/**
 * Recent events as JSON, for polling or debugging the ingest pipeline.
 *
 * force-dynamic is required: this reads mutable module state and touches no
 * other request-time API, so Next would otherwise prerender it at build and
 * serve a frozen empty array forever.
 */
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const limitParam = new URL(request.url).searchParams.get("limit")
  const parsed = Number(limitParam)
  const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 200) : 50

  const events = await getRecentEvents(limit)

  return Response.json({ events, count: events.length })
}
