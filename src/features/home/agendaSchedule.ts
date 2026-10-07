/**
 * Connects `agendaData.ts` to the Home calendar: owns how dates are named, where a
 * week starts and ends, and which agenda items belong to the current one.
 *
 * Kept apart from CalendarCard so the card stays presentational — this file holds the
 * logic and is the only place that needs changing if "this week" ever means something
 * different (e.g. a Monday-start week).
 */

import { useEffect, useState } from "react"

import { AGENDA, type AgendaIcon } from "./agendaData"

export const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

// The countdown is pinned to WIB, so dates are reckoned the same way throughout —
// a visitor abroad sees the event's dates, not the ones their laptop is on.
const TIME_ZONE = "Asia/Jakarta"

export interface CalendarDate {
  year: number
  month: number
  day: number
}

export interface AgendaRow {
  name: string
  icon: AgendaIcon
  date: string
}

const pad2 = (value: number) => String(value).padStart(2, "0")

/** Local calendar date as "YYYY-MM-DD". Not toISOString(), which shifts to UTC. */
const toIso = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`

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

export function formatAgendaDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`
}

/**
 * The Sunday-to-Saturday week containing `today` — the same span the calendar grid
 * lays out as a row, so "This Week" matches the row the highlighted day sits in.
 */
export function weekRange(today: CalendarDate): { start: string; end: string } {
  const date = new Date(today.year, today.month, today.day)

  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())

  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return { start: toIso(start), end: toIso(end) }
}

export function selectWeekAgenda(today: CalendarDate): AgendaRow[] {
  const { start, end } = weekRange(today)

  return AGENDA.filter((item) => item.date >= start && item.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      name: item.name,
      icon: item.icon ?? "page",
      date: formatAgendaDate(item.date),
    }))
}

/**
 * Resolved on mount rather than during render: the server has no clock the client
 * agrees with, and guessing would risk a hydration mismatch. `null` means "not known
 * yet", which is distinct from "no agenda this week".
 *
 * `now` defaults to the device clock. Pass the server-corrected one from
 * `useServerClock` so a badly-set device cannot land the visitor on the wrong week.
 */
export function useWeekAgenda(now: () => number = Date.now): AgendaRow[] | null {
  const [rows, setRows] = useState<AgendaRow[] | null>(null)

  useEffect(() => {
    setRows(selectWeekAgenda(jakartaToday(new Date(now()))))
  }, [now])

  return rows
}
