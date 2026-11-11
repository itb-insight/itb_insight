// Cloudflare Turnstile server-side verification.
// Enabled when TURNSTILE_SECRET_KEY is set; the page renders the widget when
// NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. Set both together, or neither (local dev).
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export function isTurnstileEnabled() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY)
}

export async function verifyTurnstile(token: string | undefined, remoteIp: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false

  const body = new URLSearchParams({ secret, response: token })
  if (remoteIp) body.set('remoteip', remoteIp)

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    })
    const result = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (!result.success) {
      console.warn('[feedback] Turnstile rejected token:', result['error-codes'])
    }
    return result.success === true
  } catch (err) {
    // Fail closed: if verification cannot run, the submission is not accepted.
    console.error('[feedback] Turnstile verification failed', err)
    return false
  }
}
