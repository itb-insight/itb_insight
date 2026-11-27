import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, type FakeDb } from '../../tests/support/fake-supabase'

const state = vi.hoisted(() => ({
  db: undefined as unknown as FakeDb,
  user: null as null | { id: string; email: string; email_confirmed_at?: string | null },
  adminRole: null as null | string,
  profileRole: null as null | string,
  profileRoleC: null as null | string,
}))

vi.mock('@/lib/supabase/server', async () => {
  const { createFakeClient } = await import('../../tests/support/fake-supabase')
  return { createServiceClient: () => createFakeClient(state.db) }
})

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: async () =>
    state.user
      ? { ok: true, user: state.user }
      : { ok: false, code: 'UNAUTHORIZED', message: 'Silakan masuk terlebih dahulu.', status: 401 },
}))

const { getScopedUser, isAdminEmail } = await import('./admin')

const request = () => new NextRequest('https://insight.test/api/x')

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fake.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fake')
  vi.stubEnv('ADMIN_EMAILS', '')
  state.user = { id: 'user-1', email: 'someone@example.com' }
  state.adminRole = null
  state.profileRole = null
  state.profileRoleC = null
  state.db = createFakeDb((call) => {
    if (call.table === 'admin_roles') return { data: state.adminRole ? { role: state.adminRole } : null, error: null }
    if (call.table === 'profiles') return { data: { role_a: state.profileRole, role_c: state.profileRoleC }, error: null }
    return { data: null, error: null }
  })
})

afterEach(() => vi.unstubAllEnvs())

describe('getScopedUser (role checks for staff/admin routes)', () => {
  it('401 when signed out', async () => {
    state.user = null
    expect(await getScopedUser(request(), ['admin'])).toMatchObject({ ok: false, status: 401 })
  })

  it('403 for a signed-in user without a role', async () => {
    expect(await getScopedUser(request(), ['admin'])).toMatchObject({ ok: false, code: 'ADMIN_ONLY', status: 403 })
    expect(await getScopedUser(request(), ['gate_staff', 'admin'])).toMatchObject({ ok: false, code: 'FORBIDDEN', status: 403 })
  })

  it('a staff role only opens the routes that allow it', async () => {
    state.adminRole = 'gate_staff'
    expect(await getScopedUser(request(), ['gate_staff', 'admin'])).toMatchObject({ ok: true, role: 'gate_staff' })
    expect(await getScopedUser(request(), ['booth_staff', 'exhibitor', 'admin'])).toMatchObject({ ok: false, status: 403 })
    expect(await getScopedUser(request(), ['admin'])).toMatchObject({ ok: false, status: 403 })
  })

  it('admins (admin_roles or profiles.role_a) pass every scope', async () => {
    state.adminRole = 'admin'
    expect(await getScopedUser(request(), ['booth_staff'])).toMatchObject({ ok: true, role: 'admin' })
    state.adminRole = null
    state.profileRole = 'admin'
    expect(await getScopedUser(request(), ['gate_staff'])).toMatchObject({ ok: true, role: 'admin' })
  })

  it('non-admin profile roles grant nothing', async () => {
    state.profileRole = 'staff'
    expect(await getScopedUser(request(), ['gate_staff', 'admin'])).toMatchObject({ ok: false, status: 403 })
  })

  it('a staff duty in profiles.role_c grants that scoped role only', async () => {
    state.profileRole = 'staff'
    state.profileRoleC = 'gate_staff'
    expect(await getScopedUser(request(), ['gate_staff', 'admin'])).toMatchObject({ ok: true, role: 'gate_staff' })
    expect(await getScopedUser(request(), ['booth_staff', 'exhibitor', 'admin'])).toMatchObject({ ok: false, status: 403 })
    expect(await getScopedUser(request(), ['admin'])).toMatchObject({ ok: false, status: 403 })
  })

  it('role_c grants nothing outside staff or outside the duty list', async () => {
    state.profileRole = 'sponsor_partner'
    state.profileRoleC = 'gate_staff' // a company named "gate_staff" is still a company
    expect(await getScopedUser(request(), ['gate_staff', 'admin'])).toMatchObject({ ok: false, status: 403 })
    state.profileRole = 'staff'
    state.profileRoleC = 'admin'
    expect(await getScopedUser(request(), ['admin'])).toMatchObject({ ok: false, status: 403 })
    state.profileRoleC = 'field_staff'
    expect(await getScopedUser(request(), ['field_staff', 'admin'])).toMatchObject({ ok: false, status: 403 })
  })

  it('an admin_roles row takes precedence over a staff duty', async () => {
    state.adminRole = 'booth_staff'
    state.profileRole = 'staff'
    state.profileRoleC = 'gate_staff'
    expect(await getScopedUser(request(), ['booth_staff', 'admin'])).toMatchObject({ ok: true, role: 'booth_staff' })
  })

  it('fails closed when the role lookup cannot run', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
    state.adminRole = 'admin'
    expect(await getScopedUser(request(), ['admin'])).toMatchObject({ ok: false, status: 403 })
  })
})

describe('ADMIN_EMAILS fallback in getScopedUser', () => {
  it('grants admin to a confirmed allowlisted email', async () => {
    vi.stubEnv('ADMIN_EMAILS', 'someone@example.com')
    state.user = { id: 'user-1', email: 'someone@example.com', email_confirmed_at: '2026-11-01T00:00:00Z' }
    expect(await getScopedUser(request(), ['admin'])).toMatchObject({ ok: true, role: 'admin' })
  })

  it('ignores an unconfirmed email (anyone can sign up with any address via the public key)', async () => {
    vi.stubEnv('ADMIN_EMAILS', 'someone@example.com')
    state.user = { id: 'user-1', email: 'someone@example.com', email_confirmed_at: null }
    expect(await getScopedUser(request(), ['admin'])).toMatchObject({ ok: false, status: 403 })
  })
})

describe('isAdminEmail (ADMIN_EMAILS fallback)', () => {
  it('matches case-insensitively and ignores spaces', () => {
    vi.stubEnv('ADMIN_EMAILS', ' Panitia@Insight.id , other@x.id')
    expect(isAdminEmail('panitia@insight.id')).toBe(true)
    expect(isAdminEmail('other@x.id')).toBe(true)
    expect(isAdminEmail('panitia@insight.id.evil.com')).toBe(false)
  })

  it('never matches an empty email, even with a trailing comma in the list', () => {
    vi.stubEnv('ADMIN_EMAILS', 'a@x.id,')
    expect(isAdminEmail('')).toBe(false)
    expect(isAdminEmail(null)).toBe(false)
    vi.stubEnv('ADMIN_EMAILS', '')
    expect(isAdminEmail('a@x.id')).toBe(false)
  })
})
