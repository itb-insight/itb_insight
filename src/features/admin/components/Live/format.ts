const TIME = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })

/** "14:15" in WIB. */
export const wibTime = (iso: string) => TIME.format(new Date(iso))

/** 372 → "6m 12s"; 4000 → "1h 06m". */
export function dwell(seconds: number | null): string {
  if (seconds === null) return "—"
  const s = Math.max(0, Math.round(seconds))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`
  return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`
}
