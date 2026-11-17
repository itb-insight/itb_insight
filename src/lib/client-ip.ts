// Client IP for rate limiting (server side; no secrets, no node imports).
//
// On Vercel, `x-real-ip` / `x-forwarded-for` are set by the platform from the TCP connection and
// cannot be spoofed by the client. When Cloudflare proxies in front of Vercel, that connection
// comes from a Cloudflare edge, so the real visitor is in `cf-connecting-ip`. That header is only
// trustworthy when the connection really came from Cloudflare: anyone can send it straight to the
// *.vercel.app URL. So it is used only when the connecting address is in Cloudflare's ranges.

/** https://www.cloudflare.com/ips-v4 and /ips-v6. Rarely changes; re-check yearly. */
const CLOUDFLARE_V4 = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
]
const CLOUDFLARE_V6 = [
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
]

function ipv4ToBigInt(ip: string): bigint | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let value = BigInt(0)
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part) || Number(part) > 255) return null
    value = (value << BigInt(8)) + BigInt(Number(part))
  }
  return value
}

function ipv6ToBigInt(ip: string): bigint | null {
  if (!ip.includes(':') || ip.includes('.')) return null
  const halves = ip.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const missing = 8 - head.length - tail.length
  if (missing < 0 || (halves.length === 1 && missing !== 0)) return null
  const groups = [...head, ...Array<string>(missing).fill('0'), ...tail]
  let value = BigInt(0)
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(group)) return null
    value = (value << BigInt(16)) + BigInt(parseInt(group, 16))
  }
  return value
}

function inCidr(ip: string, cidr: string): boolean {
  const [base, bitsText] = cidr.split('/')
  const v6 = base.includes(':')
  const toInt = v6 ? ipv6ToBigInt : ipv4ToBigInt
  const width = v6 ? 128 : 32
  const a = toInt(ip)
  const b = toInt(base)
  if (a === null || b === null) return false
  const shift = BigInt(width - Number(bitsText))
  return a >> shift === b >> shift
}

export function isCloudflareIp(ip: string): boolean {
  const ranges = ip.includes(':') ? CLOUDFLARE_V6 : CLOUDFLARE_V4
  return ranges.some((cidr) => inCidr(ip, cidr))
}

type HeaderSource = { get(name: string): string | null }

/** The visitor's IP, or null when unknown. Accepts `request.headers` or `headers()`. */
export function clientIpFromHeaders(headers: HeaderSource): string | null {
  const connecting = headers.get('x-real-ip')?.trim() || headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const cfIp = headers.get('cf-connecting-ip')?.trim() || null
  if (cfIp && connecting && isCloudflareIp(connecting)) return cfIp
  return connecting
}
