import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, eqValue, writesTo, type FakeDb } from '../../tests/support/fake-supabase'

const state = vi.hoisted(() => ({ db: undefined as unknown as FakeDb }))

vi.mock('@/lib/supabase/server', async () => {
  const { createFakeClient } = await import('../../tests/support/fake-supabase')
  return { createServiceClient: () => createFakeClient(state.db) }
})

const { awardBoothPoints, previewBoothAward, MAX_ADMIN_POINTS } = await import('./booths')

const QR = 'itbi:v1:q3Jx9_aZ-0bC1dE2fG3hI4'
const BOOTH = { id: 'booth-1', slug: 'b1', name: 'Booth 1', is_active: true, points: 10, max_bonus_points: 5, category: 'general' }

let world: {
  staffBooths: string[]
  ticket: { id: string; user_id: string; checked_in: boolean; profiles: { full_name: string; institution: null } } | null
  /** booth_scan_events rows this visitor already has at the booth. */
  prior: Array<{ kind: string; bonus_points: number; scanned_at: string }>
  /** award_booth_bonus() result: the new row id, or null when the cap was hit. */
  bonusRpc: string | null
}

beforeEach(() => {
  world = {
    staffBooths: ['booth-1'],
    ticket: { id: 'ticket-1', user_id: 'visitor-1', checked_in: true, profiles: { full_name: 'Visitor', institution: null } },
    prior: [],
    bonusRpc: 'bonus-row-1',
  }
  state.db = createFakeDb((call) => {
    switch (call.table) {
      case 'booth_staff':
        return { data: world.staffBooths.map((booth_id) => ({ booth_id })), error: null }
      case 'booths':
        if (eqValue(call, 'exhibitor_user_id') !== undefined) return { data: [], error: null }
        return { data: eqValue(call, 'id') === BOOTH.id ? BOOTH : null, error: null }
      case 'visitor_tickets':
        return { data: world.ticket, error: null }
      case 'booth_scan_events':
        if (call.op === 'insert') return { data: null, error: null }
        if (eqValue(call, 'booth_id') !== undefined) return { data: world.prior, error: null }
        return { data: [], error: null }
      case 'rpc:award_booth_bonus':
        return { data: world.bonusRpc, error: null }
      default:
        return { data: { id: 'row' }, error: null }
    }
  })
})

type Params = Parameters<typeof awardBoothPoints>[0]
const award = (overrides: Partial<Params> = {}) =>
  awardBoothPoints({ staffUserId: 'staff-1', staffRole: 'booth_staff', visitorQr: QR, ...overrides })
const preview = (overrides: Partial<Params> = {}) =>
  previewBoothAward({ staffUserId: 'staff-1', staffRole: 'booth_staff', visitorQr: QR, ...overrides })
const VISITED = { kind: 'visit', bonus_points: 0, scanned_at: '2026-12-01T03:00:00Z' }

describe('awardBoothPoints (point inflation guards)', () => {
  it('awards the booth base points plus an in-range bonus, once', async () => {
    const result = await award({ bonusPoints: 5 })
    expect(result).toMatchObject({ ok: true, pointsAwarded: 15, bonusPoints: 5 })
    const [insert] = writesTo(state.db, 'booth_scan_events')
    expect(insert.payload).toMatchObject({
      user_id: 'visitor-1',
      booth_id: 'booth-1',
      kind: 'visit',
      points_awarded: 15,
      bonus_points: 5,
      awarded_by: 'staff-1',
    })
  })

  it('booth staff cannot choose an arbitrary amount', async () => {
    expect(await award({ points: 500 })).toMatchObject({ ok: false, code: 'INVALID_POINTS' })
    expect(writesTo(state.db, 'booth_scan_events')).toEqual([])
  })

  it.each([6, -1, 2.5, Number.NaN])('rejects bonus %s outside 0..max_bonus_points', async (bonusPoints) => {
    expect(await award({ bonusPoints })).toMatchObject({ ok: false, code: 'INVALID_BONUS' })
  })

  it('staff can only award at booths they are assigned to', async () => {
    expect(await award({ boothId: 'booth-2' })).toMatchObject({ ok: false, code: 'BOOTH_NOT_ASSIGNED' })
    world.staffBooths = []
    expect(await award()).toMatchObject({ ok: false, code: 'BOOTH_NOT_ASSIGNED' })
  })

  it('staff cannot award themselves', async () => {
    world.ticket = { ...world.ticket!, user_id: 'staff-1' }
    expect(await award()).toMatchObject({ ok: false, code: 'SELF_AWARD' })
  })

  it('a second scan at the same booth without a bonus awards nothing', async () => {
    world.prior = [VISITED]
    expect(await award()).toMatchObject({ ok: true, mode: 'bonus', alreadyVisited: true, pointsAwarded: 0 })
    expect(writesTo(state.db, 'booth_scan_events')).toEqual([])
    expect(state.db.calls.some((call) => call.table === 'rpc:award_booth_bonus')).toBe(false)
  })

  it('base points are never given twice: a repeat visit is bonus-only, no matter how long ago', async () => {
    world.prior = [{ ...VISITED, scanned_at: '2020-01-01T00:00:00Z' }]
    const p = await preview({ bonusPoints: 3 })
    expect(p).toMatchObject({ ok: true, mode: 'bonus', basePoints: 0, pointsToAward: 3, bonusRemaining: 2 })
    expect(p).toMatchObject({ warnings: { repeatVisit: true, primaryWarning: 'repeat_visit' } })
  })

  it('a repeat-visit bonus needs the "Berikan Bonus?" confirmation, then goes through award_booth_bonus', async () => {
    world.prior = [VISITED]
    expect(await award({ bonusPoints: 3 })).toMatchObject({ ok: false, code: 'CONFIRMATION_REQUIRED' })
    expect(state.db.calls.some((call) => call.table === 'rpc:award_booth_bonus')).toBe(false)

    expect(await award({ bonusPoints: 3, confirmWarnings: true })).toMatchObject({
      ok: true,
      mode: 'bonus',
      pointsAwarded: 3,
      bonusRemaining: 2,
    })
    const rpc = state.db.calls.find((call) => call.table === 'rpc:award_booth_bonus')
    expect(rpc?.payload).toEqual({ p_user: 'visitor-1', p_booth: 'booth-1', p_bonus: 3, p_awarded_by: 'staff-1' })
    expect(writesTo(state.db, 'booth_scan_events')).toEqual([])
  })

  it('caps the bonus per visitor per booth across all visits', async () => {
    world.prior = [{ ...VISITED, bonus_points: 2 }, { kind: 'bonus', bonus_points: 2, scanned_at: '2026-12-01T04:00:00Z' }]
    expect(await award({ bonusPoints: 2, confirmWarnings: true })).toMatchObject({ ok: false, code: 'INVALID_BONUS' })
    expect(await award({ bonusPoints: 1, confirmWarnings: true })).toMatchObject({ ok: true, pointsAwarded: 1, bonusRemaining: 0 })
  })

  it('reports nothing written when another device spent the bonus first', async () => {
    world.prior = [VISITED]
    world.bonusRpc = null
    expect(await award({ bonusPoints: 3, confirmWarnings: true })).toMatchObject({ ok: true, alreadyVisited: true, pointsAwarded: 0 })
  })

  it('admins cannot override the amount on a repeat visit', async () => {
    world.prior = [VISITED]
    expect(await award({ staffRole: 'admin', boothId: 'booth-1', points: 50 })).toMatchObject({ ok: false, code: 'INVALID_POINTS' })
  })

  it('asks for confirmation before awarding a visitor who skipped the gate', async () => {
    world.ticket = { ...world.ticket!, checked_in: false }
    expect(await award()).toMatchObject({ ok: false, code: 'GATE_CHECKIN_REQUIRED' })
    expect(writesTo(state.db, 'booth_scan_events')).toEqual([])
  })

  it('rejects QR codes that are not visitor QRs', async () => {
    expect(await award({ visitorQr: 'https://evil.example/?x=1' })).toMatchObject({ ok: false, code: 'INVALID_QR' })
    expect(await award({ visitorQr: { token: 'x' } })).toMatchObject({ ok: false, code: 'INVALID_QR' })
  })

  it(`admins may set points directly, including negative manual corrections when no booth is chosen`, async () => {
    expect(await award({ staffRole: 'admin', points: MAX_ADMIN_POINTS + 1 })).toMatchObject({ ok: false, code: 'INVALID_POINTS' })
    expect(await award({ staffRole: 'admin', points: 50 })).toMatchObject({ ok: true, mode: 'manual', pointsAwarded: 50 })
    expect(await award({ staffRole: 'admin', boothId: undefined, points: -25 })).toMatchObject({ ok: true, pointsAwarded: -25 })
    const inserts = writesTo(state.db, 'booth_scan_events')
    expect(inserts.map((call) => (call.payload as { kind: string; booth_id: unknown }).kind)).toEqual(['manual', 'manual'])
    expect(inserts.every((call) => (call.payload as { booth_id: unknown }).booth_id === null)).toBe(true)
  })

  it('field_staff helpers may award at a booth they are not on, after the "Yakin?" confirmation', async () => {
    world.staffBooths = []
    expect(await award({ staffRole: 'field_staff' })).toMatchObject({ ok: false, code: 'BOOTH_AMBIGUOUS' })
    expect(await award({ staffRole: 'field_staff', boothId: 'booth-1' })).toMatchObject({
      ok: false,
      code: 'CONFIRMATION_REQUIRED',
      preview: { warnings: { nonBoothStaff: true, primaryWarning: 'non_booth_staff' } },
    })
    expect(await award({ staffRole: 'field_staff', boothId: 'booth-1', confirmWarnings: true })).toMatchObject({
      ok: true,
      pointsAwarded: 10,
    })
  })

  it('field_staff cannot set amounts or award without a booth', async () => {
    world.staffBooths = []
    expect(await award({ staffRole: 'field_staff', boothId: 'booth-1', points: 50 })).toMatchObject({
      ok: false,
      code: 'INVALID_POINTS',
    })
  })

  it('rejects committee / stakeholder / sponsor accounts with COMMITTEE_ACCOUNT ("Ini Akun Panitia!")', async () => {
    world.ticket = {
      ...world.ticket!,
      profiles: { full_name: 'Panitia Acara', institution: 'ITB', role_a: 'staff' } as unknown as {
        full_name: string
        institution: null
      },
    }
    expect(await award()).toMatchObject({ ok: false, code: 'COMMITTEE_ACCOUNT' })
    expect(writesTo(state.db, 'booth_scan_events')).toEqual([])
  })

  it('flags wireframe warnings (high_points priority over non_booth_staff) and requires confirmation', async () => {
    world.staffBooths = []
    const res = await award({ staffRole: 'admin', boothId: 'booth-1', points: 250 })
    expect(res).toMatchObject({
      ok: false,
      code: 'CONFIRMATION_REQUIRED',
      preview: { warnings: { highPoints: true, nonBoothStaff: true, repeatVisit: false, primaryWarning: 'high_points' } },
    })
    expect(writesTo(state.db, 'booth_scan_events')).toEqual([])
    expect(await award({ staffRole: 'admin', boothId: 'booth-1', points: 250, confirmWarnings: true })).toMatchObject({
      ok: true,
      pointsAwarded: 250,
    })
  })

  it('a large manual deduction is also "BANYAK BANGET!", but a manual award has no roster warning', async () => {
    const p = await preview({ staffRole: 'admin', points: -500 })
    expect(p).toMatchObject({ ok: true, mode: 'manual', warnings: { highPoints: true, nonBoothStaff: false } })
  })
})
