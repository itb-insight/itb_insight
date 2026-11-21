"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FilePlus,
  Megaphone,
  PartyPopper,
  Trophy,
  Users,
} from "lucide-react"

import cardStyles from "./HomeCard.module.css"
import styles from "./CalendarCard.module.css"
import type { AgendaItem, AgendaKind } from "./agendaData"
import { MONTH_NAMES, isoDate, jakartaToday, monthIndex, monthRange, type CalendarDate } from "./agendaSchedule"
import { useServerClock } from "./serverClock"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const AGENDA_ICONS: Record<AgendaKind, typeof FilePlus> = {
  dday: PartyPopper,
  event: CalendarDays,
  stage: Trophy,
  announcement: Megaphone,
  meeting: Users,
  registration: FilePlus,
}

interface CalendarCardProps {
  serverNow?: number
  /** Every significant date for this user (src/lib/dashboard-agenda.ts), sorted. */
  agenda: AgendaItem[]
}

export default function CalendarCard({ serverNow, agenda }: CalendarCardProps) {
  const clock = useServerClock(serverNow)
  // serverNow is the same prop on the server and in the browser, so starting from it cannot
  // cause a hydration mismatch; the effect below re-reads it from the corrected clock.
  const [today, setToday] = useState<CalendarDate | null>(() => (serverNow ? jakartaToday(new Date(serverNow)) : null))
  const range = useMemo(() => monthRange(agenda, today), [agenda, today])
  const [index, setIndex] = useState(() => (today ? monthIndex(today.year, today.month) : range.min))
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const now = jakartaToday(new Date(clock()))
    setToday(now)
    setIndex(monthIndex(now.year, now.month))
  }, [clock, serverNow])

  const todayIso = today ? isoDate(today.year, today.month, today.day) : null
  const shown = Math.min(range.max, Math.max(range.min, index))
  const year = Math.floor(shown / 12)
  const month = shown % 12

  const byDate = useMemo(() => {
    const map = new Map<string, AgendaItem[]>()
    for (const item of agenda) map.set(item.date, [...(map.get(item.date) ?? []), item])
    return map
  }, [agenda])

  // Open the list at the next thing coming up rather than at the first (long past) item.
  useEffect(() => {
    const list = listRef.current
    if (!list || !todayIso) return
    const next = list.querySelector<HTMLElement>(`[data-upcoming="true"]`)
    if (next) list.scrollTop = next.offsetTop
  }, [todayIso, agenda])

  const lead = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const rows = Math.ceil((lead + daysInMonth) / 7)
  const cells = Array.from({ length: rows * 7 }, (_, i) => {
    const day = i - lead + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })

  const firstUpcoming = todayIso ? agenda.find((item) => item.date >= todayIso)?.id : undefined

  return (
    <section className={`${cardStyles.surface} ${styles.card}`}>
      <header className={styles.header}>
        <h2 className={styles.month}>
          {MONTH_NAMES[month]} <span className={styles.year}>{year}</span>
        </h2>

        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => setIndex(Math.max(range.min, shown - 1))}
            disabled={shown <= range.min}
            aria-label="Bulan sebelumnya"
          >
            <ArrowLeft size={24} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => setIndex(Math.min(range.max, shown + 1))}
            disabled={shown >= range.max}
            aria-label="Bulan berikutnya"
          >
            <ArrowRight size={24} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className={styles.weekday}>
            {weekday}
          </span>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <span key={i} className={styles.cell} />
          const iso = isoDate(year, month, day)
          const items = byDate.get(iso)
          const isToday = iso === todayIso
          const label = items?.map((item) => item.title).join(", ")
          return (
            <span key={i} className={styles.cell} title={label}>
              <span className={`${styles.dayWrap} ${isToday ? styles.today : ""} ${items ? styles.marked : ""}`}>
                <span className={styles.day}>{day}</span>
                {label && <span className={styles.srOnly}>: {label}</span>}
              </span>
            </span>
          )
        })}
      </div>

      <div className={styles.week}>
        <h3 className={styles.weekTitle}>Agenda</h3>

        <div ref={listRef} className={styles.agendaList}>
          {agenda.map((item) => {
            const Icon = AGENDA_ICONS[item.kind]
            const past = todayIso !== null && item.date < todayIso
            const isToday = item.date === todayIso
            return (
              <div
                key={item.id}
                data-upcoming={item.id === firstUpcoming}
                className={`${styles.agendaRow} ${item.kind === "dday" ? styles.agendaDDay : ""} ${past ? styles.agendaPast : ""}`}
              >
                <Icon size={24} className={styles.agendaIcon} aria-hidden="true" />
                <div className={styles.agendaText}>
                  <span className={styles.agendaTitle}>
                    {item.title}
                    {isToday && <span className={styles.todayChip}>Hari ini</span>}
                  </span>
                  <span className={styles.agendaMeta}>
                    {item.dateLabel} · {item.source}
                  </span>
                  {item.detail && <span className={styles.agendaDetail}>{item.detail}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
