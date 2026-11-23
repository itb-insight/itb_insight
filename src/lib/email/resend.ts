// Resend transport (server-only). Uses the REST batch endpoint (up to 100 emails per request),
// so a campaign of thousands costs a handful of requests and stays under Resend's rate limit.
// https://resend.com/docs/api-reference/emails/send-batch-emails

import 'server-only'

export const BATCH_SIZE = 100

export type OutgoingEmail = { to: string; subject: string; html: string; text: string }

export type BatchResult =
  | { ok: true; ids: Array<string | null> }
  // permanent: the request itself is invalid (bad address/payload); retrying it unchanged cannot work.
  | { ok: false; permanent: boolean; message: string; retryAfterSeconds?: number }

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

export async function sendBatch(emails: OutgoingEmail[], idempotencyKey: string): Promise<BatchResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    return { ok: false, permanent: false, message: 'Layanan email belum dikonfigurasi.' }
  }
  if (emails.length === 0 || emails.length > BATCH_SIZE) {
    return { ok: false, permanent: true, message: `Batch harus berisi 1-${BATCH_SIZE} email.` }
  }

  const replyTo = process.env.EMAIL_REPLY_TO?.trim()
  const payload = emails.map((email) => ({
    from,
    to: [email.to],
    subject: email.subject,
    html: email.html,
    text: email.text,
    ...(replyTo ? { reply_to: replyTo } : {}),
  }))

  let response: Response
  try {
    response = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    })
  } catch {
    return { ok: false, permanent: false, message: 'Tidak dapat menghubungi layanan email.' }
  }

  if (response.ok) {
    const json = (await response.json().catch(() => null)) as { data?: Array<{ id?: string }> } | null
    const ids = emails.map((_, index) => json?.data?.[index]?.id ?? null)
    return { ok: true, ids }
  }

  const retryAfter = Number(response.headers.get('retry-after'))
  const detail = (await response.json().catch(() => null)) as { message?: string; name?: string } | null
  const message = `Resend ${response.status}: ${detail?.message ?? detail?.name ?? 'error'}`.slice(0, 300)

  // 400/422 = invalid address or payload. 401/403 (bad key), 409, 429 and 5xx are retryable:
  // fixing the config or waiting is enough, and the rows must not be marked failed for good early.
  const permanent = response.status === 400 || response.status === 422
  return {
    ok: false,
    permanent,
    message,
    retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
  }
}
