// Browser storage for small per-device UI memory (a dismissed card, a prompt already shown).
// Storage can be missing or throw (private mode, blocked site data): every access is guarded and
// losing it only means a card may show once more.

export function readStorage(kind: "local" | "session", key: string): string | null {
  try {
    return (kind === "local" ? window.localStorage : window.sessionStorage).getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(kind: "local" | "session", key: string, value: string): void {
  try {
    ;(kind === "local" ? window.localStorage : window.sessionStorage).setItem(key, value)
  } catch {
    // ignore
  }
}

/** Today's date in Jakarta, "YYYY-MM-DD". */
export const jakartaToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
