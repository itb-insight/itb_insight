// Sanitizes a post-login `next` target to a same-origin path. Prefix checks alone are not
// enough: URL parsing treats `\` as `/`, so "/\evil.com" resolves to https://evil.com.
// Parsing against a placeholder origin works identically on server and client.
const PLACEHOLDER_ORIGIN = 'http://same-origin.invalid'

export function safeNext(raw: string | null | undefined, fallback = '/dashboard') {
  if (!raw) return fallback

  try {
    const target = new URL(raw, PLACEHOLDER_ORIGIN)
    if (target.origin !== PLACEHOLDER_ORIGIN) return fallback
    return target.pathname + target.search + target.hash
  } catch {
    return fallback
  }
}
