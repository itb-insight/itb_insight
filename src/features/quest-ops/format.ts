const WIB_OFFSET_MS = 7 * 60 * 60_000

export const formatCount = (n: number) => n.toLocaleString("en-US")

export function publicName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "Anonim"
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1][0].toUpperCase()}.`
}

export function clockWib(iso: string): string {
  const d = new Date(new Date(iso).getTime() + WIB_OFFSET_MS)
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
}

export function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 }
}

const pad = (n: number) => String(n).padStart(2, "0")

export function formatHms(ms: number): string {
  const { h, m, s } = splitDuration(ms)
  return `${pad(h)} : ${pad(m)} : ${pad(s)}`
}

export function formatMs(ms: number): string {
  const { h, m, s } = splitDuration(ms)
  return `${pad(h * 60 + m)}:${pad(s)}`
}
