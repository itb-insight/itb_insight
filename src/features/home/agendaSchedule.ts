/**
 * Date helpers for the Home calendar: month names, today in Jakarta, and which months the
 * calendar can page through (every month that has an agenda item, plus the current one).
 */

import type { AgendaItem } from "./agendaData"

export const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

// The countdown is pinned to WIB, so dates are reckoned the same way throughout —
// a visitor abroad sees the event's dates, not the ones their laptop is on.
const TIME_ZONE = "Asia/Jakarta"

export interface CalendarDate {
  year: number
  /** 0-based */
  month: number
  day: number
}

const pad2 = (value: number) => String(value).padStart(2, "0")

/** "YYYY-MM-DD" for a calendar cell. */
export const isoDate = (year: number, month: number, day: number) => `${year}-${pad2(month + 1)}-${pad2(day)}`

/** Today's date as WIB sees it, whatever timezone the viewer is in. */
export function jakartaToday(now: Date = new Date()): CalendarDate {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number)
  return { year, month: month - 1, day }
}

/** Month as a single number (year * 12 + month) so ranges are plain comparisons. */
export const monthIndex = (year: number, month: number) => year * 12 + month

const indexOfIso = (iso: string) => {
  const [year, month] = iso.split("-").map(Number)
  return monthIndex(year, month - 1)
}

/** First and last month the calendar can show: the agenda's span, widened to include today. */
export function monthRange(agenda: AgendaItem[], today: CalendarDate | null) {
  const indexes = agenda.map((item) => indexOfIso(item.date))
  if (today) indexes.push(monthIndex(today.year, today.month))
  if (!indexes.length) {
    const now = jakartaToday()
    indexes.push(monthIndex(now.year, now.month))
  }
  return { min: Math.min(...indexes), max: Math.max(...indexes) }
}
