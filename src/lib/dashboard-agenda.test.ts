import { describe, expect, it } from 'vitest'

import { remaining } from '@/features/home/CountdownCard'
import { COUNTDOWN_TARGET } from '@/features/home/homeConfig'

import { buildAgenda, D_DAY } from './dashboard-agenda'

describe('buildAgenda', () => {
  it('always has D-Day, with the events held that day', async () => {
    const agenda = await buildAgenda([])
    const dday = agenda.find((item) => item.kind === 'dday')!

    expect(D_DAY).toBe('2026-11-28')
    expect(dday).toMatchObject({ date: '2026-11-28', title: 'D-Day ITB Insight 2026' })
    expect(dday.detail).toContain('Insight Festival')
    expect(dday.detail).toContain('Tech-Xhibition')
    // Events on D-Day are folded into it, not repeated.
    expect(agenda.filter((item) => item.kind === 'event').map((item) => item.date)).not.toContain('2026-11-28')
  })

  it('lists other dated events, and no competition without a registration', async () => {
    const agenda = await buildAgenda([])
    expect(agenda.map((item) => item.title)).toContain('Inspirates')
    expect(agenda.every((item) => item.source === 'ITB Insight 2026')).toBe(true)
  })

  it('adds every timeline stage of the competitions the user is in, only those', async () => {
    const agenda = await buildAgenda(['olimpiade-engineering'])
    const oe = agenda.filter((item) => item.source === 'Olimpiade Engineering')

    expect(oe.map((item) => [item.title, item.date, item.kind])).toEqual([
      ['Registration', '2026-08-22', 'registration'],
      ['Semifinal', '2026-11-27', 'stage'],
      ['Final & Awarding', '2026-11-28', 'stage'],
    ])
    expect(agenda.some((item) => item.source === 'Business Plan Competition')).toBe(false)
  })

  it('tells announcements and technical meetings apart', async () => {
    const agenda = await buildAgenda(['business-plan-competition', 'microdrone-obstacle-race'])
    const kind = (title: string) => agenda.find((item) => item.title === title)?.kind

    expect(kind('Pengumuman Pre-Elim')).toBe('announcement')
    expect(kind('Technical Meeting')).toBe('meeting')
    expect(kind('Pitching & Awarding')).toBe('stage')
  })

  it('is in date order, D-Day first on its own day, and lists a shared competition once', async () => {
    const agenda = await buildAgenda(['olimpiade-engineering', 'olimpiade-engineering'])
    const dates = agenda.map((item) => item.date)

    expect(dates).toEqual([...dates].sort())
    expect(agenda.find((item) => item.date === '2026-11-28')?.kind).toBe('dday')
    expect(agenda.filter((item) => item.title === 'Semifinal')).toHaveLength(1)
  })
})

describe('countdown to D-Day', () => {
  const target = Date.parse(COUNTDOWN_TARGET) // 2026-11-28 08:00 WIB

  it('splits the time left into days, hours and minutes', () => {
    const now = target - (6 * 1440 + 3 * 60 + 7) * 60_000
    expect(remaining(target, now)).toEqual({ days: '06', hours: '03', minutes: '07' })
  })

  it('says D-Day for the rest of that day in Jakarta, then that it is over', () => {
    expect(remaining(target, target + 10 * 3_600_000)).toBe('today') // 18:00 WIB
    expect(remaining(target, Date.parse('2026-11-28T17:00:00Z'))).toBe('over') // 00:00 WIB on the 29th
  })
})
