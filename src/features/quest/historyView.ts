import type { PointsEvent } from "@/lib/arcade"

import type { HistoryEntry } from "./PointsHistoryMobile"

/*
  /arcade/history rows from the player's points events (arcade_player_history, migration 0039):
  one row for every time the points went up or down. Pure, tested in historyView.test.ts.
*/

export type PointsEventInput = PointsEvent

export const HISTORY_FILTERS = [
  { id: "all", label: "Semua" },
  { id: "up", label: "Naik" },
  { id: "down", label: "Turun" },
  { id: "check", label: "Dicek" },
] as const
export type HistoryFilterId = (typeof HISTORY_FILTERS)[number]["id"]

export function parseHistoryFilter(value: string | string[] | undefined): HistoryFilterId {
  return HISTORY_FILTERS.find((f) => f.id === value)?.id ?? "all"
}

export function matchesFilter(e: Pick<PointsEventInput, "points" | "status">, filter: HistoryFilterId): boolean {
  if (filter === "up") return e.points > 0 && e.status !== "pending"
  if (filter === "down") return e.points < 0 || e.status === "voided"
  if (filter === "check") return e.status === "pending" || e.status === "review"
  return true
}

function detail(e: PointsEventInput, categoryLabel: (id: string) => string): string {
  const area = e.category ? categoryLabel(e.category) : null
  switch (e.kind) {
    case "visit":
      return area ? `Booth · ${area}` : "Booth"
    case "bonus":
      return area ? `Bonus booth · ${area}` : "Bonus booth"
    case "manual":
      return "Koreksi oleh panitia"
    case "collection":
      return "Bonus koleksi lengkap"
    case "quest":
      if (e.status === "pending") return "Bukti ulang menunggu review, belum dihitung"
      if (e.status === "review") return "Side quest · bukti sedang dicek"
      if (e.status === "voided") return e.points < 0 ? "Bukti ditolak, poin dibatalkan" : "Bukti ulang ditolak"
      return "Side quest"
  }
}

const SOURCE: Record<PointsEventInput["kind"], string> = {
  visit: "Booth",
  bonus: "Booth",
  manual: "Panitia",
  quest: "Quest",
  collection: "Koleksi",
}

export function toHistoryEntry(
  e: PointsEventInput,
  clock: (iso: string) => string,
  categoryLabel: (id: string) => string,
): HistoryEntry {
  return {
    time: clock(e.at),
    name: e.title,
    detail: detail(e, categoryLabel),
    status: e.status,
    amount: e.points > 0 ? `+${e.points}` : String(e.points),
    source: SOURCE[e.kind],
  }
}

/** Short code for the help desk: the start of the user id. */
export function historyReference(userId: string): string {
  return `REF · U-${userId.replace(/-/g, "").slice(0, 8)}`
}
