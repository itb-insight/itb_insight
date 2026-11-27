/** Formatting shared by the /admin insight pages (web, registrations, feedback, sponsor). */

const DAY_LABEL = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short" })
const LONG_DAY = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" })
const STAMP = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

/** "2026-11-28" (a Jakarta calendar day) -> "28 Nov". */
export const dayLabel = (day: string) => DAY_LABEL.format(new Date(`${day}T00:00:00Z`))

/** "2026-11-28" -> "Sabtu, 28 November". */
export const longDayLabel = (day: string) => LONG_DAY.format(new Date(`${day}T00:00:00Z`))

/** An instant as "28 Nov 14.10", Jakarta time. */
export const stampLabel = (iso: string) => STAMP.format(new Date(iso)).replace(",", "").replace(":", ".")

/** 61500 -> "61.500". */
export const count = (n: number) => n.toLocaleString("id-ID")

/** 0.024 -> "2,4%". */
export const percent = (ratio: number, digits = 1) =>
  `${(ratio * 100).toLocaleString("id-ID", { maximumFractionDigits: digits })}%`

/**
 * A duration short enough for a summary card: 41 -> "41d", 161 -> "2m 41d", 1781 -> "29m",
 * 4500 -> "1j 15m" (jam, menit, detik).
 */
export const minutesSeconds = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds))
  if (s < 60) return `${s}d`
  if (s < 600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}d`
  if (s < 3600) return `${Math.round(s / 60)}m`
  return `${Math.floor(s / 3600)}j ${Math.round((s % 3600) / 60)}m`
}

/** 9 -> "09.00". */
export const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}.00`
