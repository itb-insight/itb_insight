import 'server-only'

import { getCompetition } from '@/features/competition/data'
import type { TimelineItem } from '@/features/competition/types'
import { getEvents } from '@/features/events/data'
import type { AgendaItem, AgendaKind } from '@/features/home/agendaData'
import { COUNTDOWN_TARGET } from '@/features/home/homeConfig'

/*
  The Home calendar's agenda: everything significant for this user, not just this week.
    - D-Day (COUNTDOWN_TARGET, the same moment the landing countdown uses) with the events held on it
    - other dated ITB Insight events (e.g. Inspirates)
    - every timeline stage of each competition the user is registered for
*/

const EVENT_SOURCE = 'ITB Insight 2026'

/** "YYYY-MM-DD" of an instant, in Jakarta. */
export function jakartaDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

export const D_DAY = jakartaDate(COUNTDOWN_TARGET)

function stageKind(item: TimelineItem): AgendaKind {
  const text = `${item.id} ${item.title}`.toLowerCase()
  if (/pengumuman|announcement|finalis/.test(text)) return 'announcement'
  if (/technical|meeting/.test(text)) return 'meeting'
  if (/pendaftaran|registration/.test(text)) return 'registration'
  return 'stage'
}

const singleLine = (title: string) => title.replace(/-\n/g, '-').replace(/\n/g, ' ')

/** Sorted by date; on the same day D-Day comes first, then events, then competition items. */
export async function buildAgenda(competitionSlugs: string[]): Promise<AgendaItem[]> {
  const [events, competitions] = await Promise.all([
    getEvents(),
    Promise.all([...new Set(competitionSlugs)].map((slug) => getCompetition(slug))),
  ])

  const items: AgendaItem[] = []

  const onDDay = events.filter((event) => event.date === D_DAY).map((event) => singleLine(event.title))
  items.push({
    id: 'd-day',
    title: 'D-Day ITB Insight 2026',
    date: D_DAY,
    dateLabel: new Date(COUNTDOWN_TARGET).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }),
    kind: 'dday',
    source: EVENT_SOURCE,
    ...(onDDay.length ? { detail: onDDay.join(', ') } : {}),
  })

  for (const event of events) {
    if (!event.date || event.date === D_DAY) continue
    items.push({
      id: `event-${event.slug}`,
      title: singleLine(event.title),
      date: event.date,
      dateLabel: event.dateLabel,
      kind: 'event',
      source: EVENT_SOURCE,
    })
  }

  for (const competition of competitions) {
    if (!competition) continue
    for (const stage of competition.timeline) {
      items.push({
        id: `${competition.slug}-${stage.id}`,
        title: stage.title,
        date: stage.date,
        dateLabel: stage.dateLabel,
        kind: stageKind(stage),
        source: competition.title,
      })
    }
  }

  const rank = (item: AgendaItem) => (item.kind === 'dday' ? 0 : item.kind === 'event' ? 1 : 2)
  return items.sort((a, b) => a.date.localeCompare(b.date) || rank(a) - rank(b))
}
