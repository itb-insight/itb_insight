import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, type FakeDb } from '../../../../tests/support/fake-supabase'
import type { HogQLResult } from '@/lib/analytics/posthog-query'
import type { FeedbackForm } from '@/lib/feedback/forms'

const state = vi.hoisted(() => ({
  db: undefined as unknown as FakeDb,
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

const web = await import('./web')
const registrations = await import('./registrations')
const feedback = await import('./feedback')
const sponsor = await import('./sponsor')

const rows = (...results: unknown[][]): HogQLResult => ({ columns: [], results })
const NOW = new Date('2026-11-28T05:00:00Z')

beforeEach(() => {
  vi.stubEnv('POSTHOG_PROJECT_ID', '42')
  vi.stubEnv('POSTHOG_PERSONAL_API_KEY', 'phx_test')
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_REGION', 'us')
  vi.stubEnv('VERCEL_ENV', '')
  vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', '')
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://itbinsight.example')
  state.db = createFakeDb(() => ({ data: [], error: null, count: 0 }))
  state.answers = {}
  state.queries = {}
})

afterEach(() => vi.unstubAllEnvs())

describe('traffic sources', () => {
  it.each([
    [null, '$direct', 'direct'],
    [null, '', 'direct'],
    [null, 'itbinsight.example', 'direct'],
    [null, 'www.itbinsight.example', 'direct'],
    ['instagram', 'itbinsight.example', 'instagram'],
    [null, 'l.instagram.com', 'instagram'],
    ['ig', null, 'instagram'],
    [null, 'web.whatsapp.com', 'whatsapp'],
    ['wa', null, 'whatsapp'],
    [null, 'www.google.com', 'search'],
    [null, 'google.co.id', 'search'],
    [null, 'bing.com', 'search'],
    [null, 't.co', 'x'],
    [null, 'twitter.com', 'x'],
    [null, 'www.tiktok.com', 'tiktok'],
    [null, 'facebook.com', 'other'],
  ])('utm %s, referrer %s -> %s', (utm, ref, expected) => {
    expect(web.classifySource(utm, ref, 'itbinsight.example')).toBe(expected)
  })

  it('fold sessions into the fixed source list, in its order', async () => {
    state.answers['web-sources'] = rows([null, 'l.instagram.com', 5], ['instagram', '$direct', 3], [null, '$direct', 4], [null, 'facebook.com', 1])
    const result = await web.getWebInsights(NOW)
    expect(result.sources).toEqual([
      { source: 'instagram', sessions: 8 },
      { source: 'whatsapp', sessions: 0 },
      { source: 'search', sessions: 0 },
      { source: 'direct', sessions: 4 },
      { source: 'tiktok', sessions: 0 },
      { source: 'x', sessions: 0 },
      { source: 'other', sessions: 1 },
    ])
  })
})

describe('web insights', () => {
  it('return the mock without PostHog query credentials', async () => {
    vi.stubEnv('POSTHOG_PERSONAL_API_KEY', '')
    const { MOCK_WEB } = await import('./mockData')
    expect(await web.getWebInsights(NOW)).toBe(MOCK_WEB)
    expect(state.queries).toEqual({})
  })

  it('mark each failed part null instead of zero', async () => {
    const result = await web.getWebInsights(NOW)
    expect(result).toEqual({ summary: null, daily: null, sources: null, funnel: null })
  })

  it('fill missing days with zero and drop the empty days before the first visit', async () => {
    state.answers['web-daily'] = rows(['2026-11-01', 10, 4], ['2026-11-28', 30, 9])
    const result = await web.getWebInsights(NOW)
    expect(result.daily?.[0]).toEqual({ day: '2026-11-01', pageviews: 10, visitors: 4 })
    expect(result.daily?.at(-1)).toEqual({ day: '2026-11-28', pageviews: 30, visitors: 9 })
    expect(result.daily).toHaveLength(28)
  })

  it('end the funnel with Midtrans payments settled in the window', async () => {
    state.answers['web-funnel'] = rows([200, 40, 20])
    state.db = createFakeDb(() => ({ data: null, error: null, count: 7 }))
    const result = await web.getWebInsights(NOW)
    expect(result.funnel).toEqual([
      { step: 'Landing page', count: 200 },
      { step: 'Sign up', count: 40 },
      { step: 'Daftar lomba', count: 20 },
      { step: 'Bayar', count: 7 },
    ])
    const payments = state.db.calls.find((call) => call.table === 'payments')
    expect(payments?.filters).toContainEqual({ method: 'eq', args: ['provider', 'midtrans'] })
    expect(web.funnelShares(result.funnel ?? []).map((step) => step.share)).toEqual([100, 20, 10, 4])
  })

  it('count only production traffic on production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    await web.getWebInsights(NOW)
    for (const name of ['web-summary-visits', 'web-daily', 'web-sources', 'web-funnel']) {
      expect(state.queries[name]).toContain("properties.app_env = 'production'")
    }
  })
})

describe('registration status', () => {
  it.each([
    [{ status: 'verified', payments: ['paid'], teamStatus: 'withdrawn' }, 'withdrawn'],
    [{ status: 'submitted', payments: [], teamWithdrawnAt: '2026-11-01' }, 'withdrawn'],
    [{ status: 'submitted', payments: ['failed', 'paid'] }, 'registered'],
    [{ status: 'verified', payments: [] }, 'registered'],
    [{ status: 'submitted', payments: ['failed', 'pending'] }, 'awaiting_payment'],
    [{ status: 'submitted', payments: [] }, 'awaiting_payment'],
    [{ status: 'submitted', payments: ['failed', 'expired'] }, 'expired'],
  ])('%o -> %s', (input, expected) => {
    expect(registrations.registrationStatus(input)).toBe(expected)
  })

  it('list team members (leader first, withdrawn left out) and individuals by name', async () => {
    state.db = createFakeDb(() => ({
      data: [
        {
          id: 'reg-team-0001',
          registration_kind: 'team',
          status: 'verified',
          submitted_at: '2026-11-02T00:00:00Z',
          competitions: { slug: 'oe', name: 'Olimpiade Engineering' },
          profiles: null,
          competition_teams: {
            team_uid: 'OE-001',
            team_name: 'Tim A',
            status: 'verified',
            withdrawn_at: null,
            competition_team_members: [
              { name: 'Budi', status: 'active', member_role: 'member' },
              { name: 'Ani', status: 'active', member_role: 'leader' },
              { name: 'Caca', status: 'withdrawn', member_role: 'member' },
            ],
          },
          payments: [{ status: 'paid' }],
        },
        {
          id: 'reg-solo-0002',
          registration_kind: 'individual',
          status: 'submitted',
          submitted_at: '2026-11-01T00:00:00Z',
          competitions: [{ slug: 'paper', name: 'Paper Competition' }],
          profiles: { full_name: 'Dewi' },
          competition_teams: null,
          payments: [{ status: 'pending' }],
        },
      ],
      error: null,
    }))

    const result = await registrations.getRegistrations()

    expect(result?.rows).toEqual([
      expect.objectContaining({ id: 'OE-001', name: 'Tim A', members: ['Ani', 'Budi'], status: 'registered' }),
      expect.objectContaining({ id: 'reg-solo', name: 'Dewi', members: ['Dewi'], status: 'awaiting_payment' }),
    ])
    expect(result?.counts).toEqual({ registered: 1, withdrawn: 0, awaiting_payment: 1, expired: 0 })
    expect(result?.competitions).toEqual([
      { value: 'oe', label: 'Olimpiade Engineering' },
      { value: 'paper', label: 'Paper Competition' },
    ])
  })

  it('return null when the query fails', async () => {
    state.db = createFakeDb(() => ({ data: null, error: { message: 'boom' } }))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await registrations.getRegistrations()).toBeNull()
  })
})

describe('feedback', () => {
  const form: FeedbackForm = {
    id: 'form-1',
    slug: 'inspirates-2026',
    title: 'Feedback Inspirates ITB Insight 2026',
    description: null,
    context: 'inspirates',
    questions: [
      { id: 'fun', type: 'stars', label: 'Seru?', required: true, overall: true },
      { id: 'clarity', type: 'scale', label: 'Jelas?', required: true, min: 1, max: 9 },
      { id: 'note', type: 'short', label: 'Catatan', required: false },
    ],
    opensAt: null,
    closesAt: null,
    isActive: true,
    piiRetentionDays: 180,
  } as FeedbackForm

  const submission = (overall: number | null, clarity: number | null) => ({
    id: 'x',
    form_id: 'form-1',
    user_id: null,
    name: 'A',
    overall_rating: overall,
    answers: (clarity === null ? {} : { clarity }) as Record<string, number>,
    created_at: '2026-11-17T00:00:00Z',
  })

  it('shorten form titles to the event name', () => {
    expect(feedback.shortFormTitle('Feedback Inspirates ITB Insight 2026')).toBe('Inspirates')
    expect(feedback.shortFormTitle('Kesan & Pesan ITB INSIGHT 2026')).toBe('Kesan & Pesan')
    expect(feedback.shortFormTitle('Feedback')).toBe('Feedback')
  })

  it('map form contexts onto the three badge categories', () => {
    expect(feedback.feedbackCategory('booth')).toBe('booth')
    expect(feedback.feedbackCategory('competition')).toBe('competition')
    expect(feedback.feedbackCategory('inspirates')).toBe('event')
    expect(feedback.feedbackCategory('pre_event')).toBe('event')
  })

  it('average the overall rating and rescale other scales to 0–5', () => {
    const ratings = feedback.formRatings(form, [submission(5, 9), submission(4, 1), submission(null, 5)])
    expect(ratings).toEqual([
      { label: 'Inspirates', category: 'event', value: 4.5, n: 2 },
      // mean 5 on 1..9 -> halfway -> 2.5
      { label: 'Inspirates: Jelas?', category: 'event', value: 2.5, n: 3 },
    ])
  })

  it('count response rate only among checked-in visitors', async () => {
    state.db = createFakeDb((call) => {
      if (call.table === 'feedback_forms') {
        return {
          data: [{ id: 'form-1', slug: 'inspirates-2026', title: form.title, description: null, context: 'inspirates', questions: form.questions, opens_at: null, closes_at: null, is_active: true, pii_retention_days: 180 }],
          error: null,
        }
      }
      if (call.table === 'feedback_submissions') {
        return {
          data: [
            { ...submission(5, null), id: 'aaaaaaaa-1', user_id: 'u1', answers: { note: 'Seru!', other: '-' } },
            { ...submission(3, null), id: 'bbbbbbbb-2', user_id: 'u9', name: null },
          ],
          error: null,
        }
      }
      if (call.table === 'gate_check_ins') return { data: [{ user_id: 'u1' }, { user_id: 'u2' }, { user_id: 'u1' }], error: null }
      return { data: [], error: null }
    })

    const result = await feedback.getFeedbackInsights()

    expect(result).toMatchObject({ average: 4, total: 2, responded_attendees: 1, checked_in: 2, by_category: { event: 2, booth: 0, competition: 0 } })
    expect(result?.rows).toEqual([
      expect.objectContaining({ id: 'aaaaaa', subject: 'Inspirates', stars: 5, comment: 'Seru!', name: 'A' }),
      expect.objectContaining({ id: 'bbbbbb', name: 'Anonim', comment: '' }),
    ])
  })
})

describe('sponsor', () => {
  it('refuse an id that is not on the partner list before querying', async () => {
    expect(await sponsor.getSponsorWeb("x' or 1=1 --", NOW)).toBeNull()
    expect(await sponsor.getSponsorWeb('not-a-partner', NOW)).toBeNull()
    expect(state.queries).toEqual({})
  })

  it('sum a partner’s daily clicks against the shared section impressions', async () => {
    const id = sponsor.sponsorOptions()[0].id
    state.answers[`sponsor-daily-${id}`] = rows(['2026-11-27', 100, 3], ['2026-11-28', 50, 2])
    state.answers['sponsor-site'] = rows([999])
    const result = await sponsor.getSponsorWeb(id, NOW)
    expect(result).toMatchObject({ impressions: 150, clicks: 5, site_pageviews: 999 })
    expect(result?.daily).toHaveLength(sponsor.SPONSOR_DAYS)
    expect(state.queries[`sponsor-daily-${id}`]).toContain(`properties.sponsorId = '${id}'`)
  })

  it('count distinct visitors per Jakarta hour, per event day', () => {
    const days = sponsor.boothDays([
      // 09:10 and 09:40 WIB, same visitor: one in that hour.
      { user_id: 'a', captured_at: '2026-11-28T02:10:00Z', points_awarded: 10, bonus_points: 0 },
      { user_id: 'a', captured_at: '2026-11-28T02:40:00Z', points_awarded: 0, bonus_points: 5 },
      { user_id: 'b', captured_at: '2026-11-28T02:50:00Z', points_awarded: 10, bonus_points: null },
      // 20:30 WIB widens the chart past 19.00.
      { user_id: 'c', captured_at: '2026-11-28T13:30:00Z', points_awarded: 10, bonus_points: 0 },
      // 23:30 UTC on the 28th is 06:30 WIB on the 29th.
      { user_id: 'a', captured_at: '2026-11-28T23:30:00Z', points_awarded: 10, bonus_points: 0 },
    ])

    expect(days.map((d) => d.day)).toEqual(['2026-11-28', '2026-11-29'])
    const [first, second] = days
    expect(first.visitors).toBe(3)
    expect(first.points).toBe(35)
    expect(first.hours[0].hour).toBe(8)
    expect(first.hours.at(-1)?.hour).toBe(20)
    expect(first.hours.find((h) => h.hour === 9)?.visitors).toBe(2)
    expect(second.hours[0]).toEqual({ hour: 6, visitors: 1 })
  })
})
