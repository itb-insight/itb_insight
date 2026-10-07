"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, FilePlus, Megaphone } from "lucide-react"

import cardStyles from "./HomeCard.module.css"
import styles from "./CalendarCard.module.css"
import type { AgendaIcon } from "./agendaData"
import {
  MONTH_NAMES,
  jakartaToday,
  useWeekAgenda,
  type CalendarDate,
} from "./agendaSchedule"
import { CALENDAR_RANGE } from "./homeConfig"
import { useServerClock } from "./serverClock"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const AGENDA_ICONS: Record<AgendaIcon, typeof FilePlus> = {
  page: FilePlus,
  announcement: Megaphone,
}

const toIndex = (year: number, month: number) => year * 12 + month

const parseMonth = (value: string) => {
  const [year, month] = value.split("-").map(Number)
  return toIndex(year, month - 1)
}

const MIN_INDEX = parseMonth(CALENDAR_RANGE.from)
const MAX_INDEX = parseMonth(CALENDAR_RANGE.to)

interface CalendarCardProps {
  serverNow?: number
}

export default function CalendarCard({ serverNow }: CalendarCardProps) {
  const clock = useServerClock(serverNow)

  const [index, setIndex] = useState(MIN_INDEX)
  const [today, setToday] = useState<CalendarDate | null>(null)
  const agenda = useWeekAgenda(clock)

  useEffect(() => {
    const now = jakartaToday(new Date(clock()))
    setToday(now)
    setIndex(Math.min(MAX_INDEX, Math.max(MIN_INDEX, toIndex(now.year, now.month))))
  }, [clock, serverNow])

  const year = Math.floor(index / 12)
  const month = index % 12

  const lead = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const rows = Math.ceil((lead + daysInMonth) / 7)
  const cells = Array.from({ length: rows * 7 }, (_, i) => {
    const day = i - lead + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })

  const isToday = (day: number) =>
    today !== null && today.year === year && today.month === month && today.day === day

  return (
    <section className={`${cardStyles.surface} ${styles.card}`}>
      <header className={styles.header}>
        <h2 className={styles.month}>{MONTH_NAMES[month]}</h2>

        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => setIndex((i) => Math.max(MIN_INDEX, i - 1))}
            disabled={index <= MIN_INDEX}
            aria-label="Bulan sebelumnya"
          >
            <ArrowLeft size={24} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => setIndex((i) => Math.min(MAX_INDEX, i + 1))}
            disabled={index >= MAX_INDEX}
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

        {cells.map((day, i) => (
          <span key={i} className={styles.cell}>
            {day !== null &&
              (isToday(day) ? (
                <span className={styles.today}>
                  <span className={styles.day}>{day}</span>
                </span>
              ) : (
                <span className={styles.day}>{day}</span>
              ))}
          </span>
        ))}
      </div>

      <div className={styles.week}>
        <h3 className={styles.weekTitle}>This Week</h3>

        {/* `null` is "the client clock has not resolved yet", which is why it renders
            nothing rather than the empty-week message. */}
        {agenda?.map(({ name, date, icon }) => {
          const Icon = AGENDA_ICONS[icon]
          return (
            <div key={`${name}-${date}`} className={styles.agendaRow}>
              <Icon size={24} className={styles.agendaIcon} aria-hidden="true" />
              <div className={styles.agendaText}>
                <span className={styles.agendaTitle}>{name}</span>
                <span className={styles.agendaMeta}>{date}</span>
              </div>
            </div>
          )
        })}

        {agenda?.length === 0 && (
          <p className={styles.agendaEmpty}>Tidak ada agenda minggu ini.</p>
        )}
      </div>
    </section>
  )
}
