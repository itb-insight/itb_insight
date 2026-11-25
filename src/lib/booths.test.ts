import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, eqValue, writesTo, type FakeDb } from '../../tests/support/fake-supabase'

const state = vi.hoisted(() => ({ db: undefined as unknown as FakeDb }))

vi.mock('@/lib/supabase/server', async () => {
  const { createFakeClient } = await import('../../tests/support/fake-supabase')
  return { createServiceClient: () => createFakeClient(state.db) }
})

const { awardBoothPoints, MAX_ADMIN_POINTS } = await import('./booths')

const QR = 'itbi:v1:q3Jx9_aZ-0bC1dE2fG3hI4'
const BOOTH = { id: 'booth-1', slug: 'b1', name: 'Booth 1', is_active: true, points: 10, max_bonus_points: 5, category: 'general' }

let world: {
  staffBooths: string[]
  ticket: { id: string; user_id: string; checked_in: boolean; profiles: { full_name: string; institution: null } } | null
  alreadyVisited: boolean
}

beforeEach(() => {
  world = {
    staffBooths: ['booth-1'],
    ticket: { id: 'ticket-1', user_id: 'visitor-1', checked_in: true, profiles: { full_name: 'Visitor', institution: null } },
    alreadyVisited: false,
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
        if (call.mode === 'maybeSingle') return { data: world.alreadyVisited ? { id: 'scan-0' } : null, error: null }
        return { data: [], error: null }
      default:
        return { data: { id: 'row' }, error: null }
    }
  })
})

const award = (overrides: Partial<Parameters<typeof awardBoothPoints>[0]> = {}) =>
  awardBoothPoints({ staffUserId: 'staff-1', staffRole: 'booth_staff', visitorQr: QR, ...overrides })

describe('awardBoothPoints (point inflation guards)', () => {
  it('awards the booth base points plus an in-range bonus, once', async () => {
    const result = await award({ bonusPoints: 5 })
    expect(result).toMatchObject({ ok: true, pointsAwarded: 15, bonusPoints: 5 })
    const [insert] = writesTo(state.db, 'booth_scan_events')
    expect(insert.payload).toMatchObject({ user_id: 'visitor-1', booth_id: 'booth-1', points_awarded: 15, awarded_by: 'staff-1' })
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

  it('a second scan at the same booth awards nothing', async () => {
    world.alreadyVisited = true
    expect(await award()).toMatchObject({ ok: true, alreadyVisited: true, pointsAwarded: 0 })
    expect(writesTo(state.db, 'booth_scan_events')).toEqual([])
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
    expect(await award({ staffRole: 'admin', points: 50 })).toMatchObject({ ok: true, pointsAwarded: 50 })
    expect(await award({ staffRole: 'admin', boothId: undefined, points: -25 })).toMatchObject({ ok: true, pointsAwarded: -25 })
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

  it('flags wireframe warnings (high_points priority over non_booth_staff)', async () => {
    const res = await award({ staffRole: 'admin', points: 250 })
    expect(res).toMatchObject({
      ok: true,
      pointsAwarded: 250,
      warnings: {
        highPoints: true,
        nonBoothStaff: true,
        primaryWarning: 'high_points',
      },
    })
  })
})
