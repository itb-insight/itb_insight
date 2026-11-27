import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, type FakeDb } from '../../../../tests/support/fake-supabase'
import type { HogQLResult } from '@/lib/analytics/posthog-query'

const state = vi.hoisted(() => ({
  db: undefined as unknown as FakeDb,
  // name -> result; a missing name answers null (query failed).
  answers: {} as Record<string, HogQLResult | null>,
  queries: {} as Record<string, string>,
}))

vi.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))
vi.mock('@/lib/supabase/server', async () => {
  const { createFakeClient } = await import('../../../../tests/support/fake-supabase')
  return { createServiceClient: () => createFakeClient(state.db) }
})
vi.mock('@/lib/analytics/posthog-query', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/analytics/posthog-query')>()
  return {
    ...original,
    hogql: async (name: string, query: string) => {
      state.queries[name] = query
      return state.answers[name] ?? null
    },
  }
})

const adapters = await import('./adapters')
const { MOCK_KPIS } = await import('./mockData')

const rows = (...results: unknown[][]): HogQLResult => ({ columns: [], results })
const RANGE = { from: '2026-11-17T10:00:00.000Z', to: '2026-11-24T10:00:00.000Z' }

beforeEach(() => {
  vi.stubEnv('POSTHOG_PROJECT_ID', '42')
  vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phx_test')
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_REGION', 'us')
  vi.stubEnv('VERCEL_ENV', '')
  vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', '')
  state.db = createFakeDb(() => ({ data: null, error: null, count: 0 }))
  state.answers = {}
  state.queries = {}
})

afterEach(() => vi.unstubAllEnvs())

describe('admin adapters', () => {
  it('fall back to mock figures without PostHog query credentials', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', '')
    expect(adapters.dataSource()).toBe('mock')
    expect(await adapters.getKpis(RANGE)).toBe(MOCK_KPIS)
    expect(state.queries).toEqual({})
    expect(state.db.calls).toEqual([])
  })

  it('round the default range up to 5 minutes, so requests share a cache entry', () => {
    const a = adapters.defaultRange(new Date('2026-11-24T10:01:00Z'))
    const b = adapters.defaultRange(new Date('2026-11-24T10:04:59Z'))
    expect(a).toEqual(b)
    expect(a).toEqual({ from: '2026-11-17T10:05:00.000Z', to: '2026-11-24T10:05:00.000Z' })
  })

  it('scale sampled events back up and fold unknown divisions into MISC', async () => {
    state.answers['division-activity'] = rows(['SP', 30], ['CPT', 60], ['nonsense', 10])

    const activity = await adapters.getDivisionActivity(RANGE)

    expect(state.queries['division-activity']).toContain(
      "sum(multiIf(event = 'scroll_depth', 10, event = 'section_impression', 2, 1))",
    )
    expect(activity?.[0]).toEqual({ division: 'CPT', events: 60, share_pct: 60 })
    expect(activity?.find((row) => row.division === 'MISC')).toEqual({ division: 'MISC', events: 10, share_pct: 10 })
    expect(activity).toHaveLength(6)
  })

  it('count only production traffic on production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    await adapters.getDivisionActivity(RANGE)
    expect(state.queries['division-activity']).toContain("properties.app_env = 'production'")
  })

  it('share marquee impressions across partners and keep clicks on unknown ids', async () => {
    state.answers.sponsors = rows(
      ['sponsor_impression', null, 200],
      ['sponsor_click', 'tec-itb', 10],
      ['sponsor_click', 'aiesec-in-bandung', 4],
      ['sponsor_click', 'old-partner', 1],
    )

    const sponsors = (await adapters.getSponsorStats(RANGE))!

    expect(sponsors[0]).toMatchObject({ sponsor_id: 'tec-itb', name: 'TEC ITB', impressions: 200, clicks: 10, ctr_percent: 5 })
    expect(sponsors[1]).toMatchObject({ sponsor_id: 'aiesec-in-bandung', clicks: 4, ctr_percent: 2 })
    expect(sponsors.find((row) => row.sponsor_id === 'old-partner')).toMatchObject({ name: 'old-partner', clicks: 1 })
    expect(sponsors.every((row) => row.impressions === 200)).toBe(true)
  })

  it('return null when PostHog fails, so the page shows the panel as unavailable', async () => {
    expect(await adapters.getTraffic(RANGE)).toBeNull()
    expect(await adapters.getSponsorStats(RANGE)).toBeNull()
    expect(await adapters.getRecentEvents(40)).toBeNull()
  })

  it('fill days without page views with zeros', async () => {
    state.answers['traffic-daily'] = rows(['2026-11-24', 12], ['2026-11-20', 3])
    state.answers['traffic-pages'] = rows(['/', 10], ['/competition', 5])

    const traffic = (await adapters.getTraffic(RANGE))!

    expect(traffic.series).toHaveLength(7)
    expect(traffic.series.at(-1)).toEqual({ day: 'Nov 24', views: 12 })
    expect(traffic.series.find((point) => point.day === 'Nov 20')?.views).toBe(3)
    expect(traffic.series.filter((point) => point.views === 0)).toHaveLength(5)
    expect(traffic.top_pages).toEqual([
      { page_path: '/', views: 10 },
      { page_path: '/competition', views: 5 },
    ])
  })

  it('combine PostHog visitors with Supabase counts in the KPI strip', async () => {
    state.answers['kpi-visitors'] = rows([120, 100])
    state.answers['kpi-sessions'] = rows([95, 0.4])
    state.db = createFakeDb((call) => {
      const filtered = call.filters.some((filter) => filter.method === 'eq')
      const counts: Record<string, number> = {
        competition_registrations: filtered ? 30 : 40,
        visitor_tickets: filtered ? 50 : 200,
        booth_scan_events: 321,
        gate_check_ins: 45,
      }
      return { data: null, error: null, count: counts[call.table] ?? 0 }
    })

    const kpis = await adapters.getKpis(RANGE)

    expect(kpis.map((kpi) => [kpi.id, kpi.value, kpi.delta])).toEqual([
      ['visitors', '120', '20% vs previous 7 days'],
      ['session', '1m 35s', '40% single-page visits'],
      ['registrations', '40', '30 verified'],
      ['checkin', '50', '25% of 200 tickets'],
      ['booth-scans', '321', 'QR scans, all time'],
    ])
    expect(kpis[0].direction).toBe('up')
  })

  it('show only our own event properties in the live feed', async () => {
    state.answers['recent-events'] = rows([
      'uuid-1',
      'sponsor_click',
      'SP',
      '/',
      JSON.stringify({ $browser: 'Chrome', app_env: 'production', division: 'SP', sponsorId: 'tec-itb', tier: 'M', nested: { a: 1 } }),
      '2026-11-24T10:00:00Z',
    ])

    const [event] = (await adapters.getRecentEvents(40))!

    expect(event).toEqual({
      id: 'uuid-1',
      event_type: 'sponsor_click',
      division: 'SP',
      page_path: '/',
      metadata: { sponsorId: 'tec-itb', tier: 'M' },
      created_at: '2026-11-24T10:00:00Z',
    })
  })

  it('build the live on-site picture: Jakarta day, filled 15-minute slots, unmeasured venue time', async () => {
    const onsite = {
      checked_in: 5,
      active_now: 2,
      presence_users: 3,
      represented_now: 4,
      unique_visitors: 12,
      represented_total: 6,
      slots: [
        { slot: '2026-11-28T01:00:00+00:00', count: 2 },
        { slot: '2026-11-28T01:30:00+00:00', count: 1 },
      ],
      booths: [{ booth_id: 'b1', name: 'Robotics', scans: 4, visits: 2, visitors: 2, median_dwell_s: 420, avg_dwell_s: null }],
      venue: { measured: 3, median_s: 3600, under_30m: 1, from_30m_to_1h: 0, from_1h_to_2h: 2, over_2h: 0 },
    }
    state.db = createFakeDb((call) =>
      call.table === 'rpc:admin_live_onsite' ? { data: onsite, error: null } : { data: null, error: null },
    )

    const live = await adapters.getLive(new Date('2026-11-28T02:05:00Z')) // 09:05 WIB

    const rpc = state.db.calls.find((call) => call.table === 'rpc:admin_live_onsite')!
    expect(rpc.payload).toEqual({ p_since: '2026-11-27T17:00:00.000Z', p_visit_seconds: 300 })
    expect(live.onsite!.slots.map((slot) => [slot.slot.slice(11, 16), slot.count])).toEqual([
      ['01:00', 2],
      ['01:15', 0],
      ['01:30', 1],
      ['01:45', 0],
      ['02:00', 0],
    ])
    expect(live.onsite!).toMatchObject({ in_area_now: 6, unique_visitors: 12, represented_total: 6 })
    expect(live.onsite!.booths[0]).toMatchObject({ name: 'Robotics', median_dwell_s: 420, avg_dwell_s: null })
    expect(live.onsite!.venue).toMatchObject({ measured: 3, unmeasured: 2, median_s: 3600 })
    expect(live.onsite!.venue.buckets.map((bucket) => bucket.count)).toEqual([1, 0, 2, 0])
  })

  it('report the on-site panel unavailable when the RPC fails, and web figures only with PostHog', async () => {
    state.db = createFakeDb(() => ({ data: null, error: { message: 'boom' } }))
    state.answers['live-active'] = rows([7])
    state.answers['live-pages'] = rows(['/', 12], ['/events', 3])
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})

    const live = await adapters.getLive()
    expect(live.onsite).toBeNull()
    expect(live.web).toEqual({
      active_visitors: 7,
      top_pages: [
        { page_path: '/', views: 12 },
        { page_path: '/events', views: 3 },
      ],
    })

    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', '')
    expect(await adapters.getLive()).toMatchObject({ web: null, web_configured: false })
    quiet.mockRestore()
  })

  it('build the D-day page: 5-hour window, booth positions, after-close flag', async () => {
    const raw = {
      live: { accounts: 3, represented: 2, oldest_at: '2026-11-28T03:00:00+00:00', newest_at: '2026-11-28T09:00:00+00:00', left: 1, timed_out: 4, tracked_now: 1 },
      summary: { check_ins: 5, skipped_gate: 1, booth_scans: 4, points_given: 35, booths_active: 3, booth_visits: 3 },
      funnel: { visitors: 5, scanned_1: 2, scanned_5: 0, reached_target: 0, claimed: 1 },
      medians: { checkin_to_first_scan_s: 3750, between_scans_s: null },
      gates: [{ slot: '2026-11-28T02:00:00+00:00', gate: 'main_gate', count: 2 }],
      booths: [
        { id: 'b1', name: 'Real', lat: -6.89, lng: 107.61, x: 1, y: 2, scans: 3, points: 25, m30: 1, h1: 2, h2: 3, h5: 3, h12: 3 },
        { id: 'b2', name: 'Swapped', lat: null, lng: null, x: -6.891, y: 107.611, scans: 1, points: 10, m30: 0, h1: 1, h2: 1, h5: 1, h12: 1 },
        { id: 'b3', name: 'Nowhere', lat: null, lng: null, x: null, y: null, scans: 0, points: 0 },
      ],
      staff: [{ kind: 'booth', location: 'b1', user_id: 's1', name: 'Bo', role_a: 'staff', role_b: 'booth', scans: 3, points: 25, last_at: null }],
    }
    state.db = createFakeDb((call) => (call.table === 'rpc:admin_dday' ? { data: raw, error: null } : { data: null, error: null }))

    const evening = await adapters.getDDay(new Date('2026-11-28T11:30:00Z')) // 18:30 WIB
    const rpc = state.db.calls.find((call) => call.table === 'rpc:admin_dday')!
    expect(rpc.payload).toEqual({ p_since: '2026-11-27T17:00:00.000Z', p_assume_seconds: 18000, p_booth_target: 15 })
    expect(evening.after_close).toBe(true)
    expect(evening.data!.live).toMatchObject({ in_area_now: 5, accounts: 3, represented: 2, left: 1, timed_out: 4 })
    expect(evening.data!.medians).toEqual({ checkin_to_first_scan_s: 3750, between_scans_s: null })
    expect(evening.data!.booths.map((b) => [b.name, b.lng, b.lat])).toEqual([
      ['Real', 107.61, -6.89],
      ['Swapped', 107.611, -6.891],
      ['Nowhere', null, null],
    ])
    expect(evening.data!.booths[0].windows).toEqual({ '30m': 1, '1h': 2, '2h': 3, '5h': 3, '12h': 3 })

    expect((await adapters.getDDay(new Date('2026-11-28T03:00:00Z'))).after_close).toBe(false) // 10:00 WIB
  })

  it('report the D-day page unavailable when its RPC fails', async () => {
    state.db = createFakeDb(() => ({ data: null, error: { message: 'boom' } }))
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await adapters.getDDay()).data).toBeNull()
    quiet.mockRestore()
  })
})
