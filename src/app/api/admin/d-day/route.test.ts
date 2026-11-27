import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  scoped: null as null | { ok: true; user: { id: string }; role: string },
  signedIn: true,
  staff: false,
  roles: [] as unknown[],
}))

vi.mock('@/lib/admin', () => ({
  getScopedUser: async (_request: unknown, roles: unknown) => {
    state.roles = roles as unknown[]
    if (state.scoped) return state.scoped
    return state.signedIn
      ? { ok: false, code: 'FORBIDDEN', message: 'no', status: 403 }
      : { ok: false, code: 'UNAUTHORIZED', message: 'no', status: 401 }
  },
}))
vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: async () =>
    state.signedIn ? { ok: true, user: { id: 'u-1' } } : { ok: false, code: 'UNAUTHORIZED', message: 'no', status: 401 },
}))
vi.mock('@/lib/admin-access', () => ({ getAdminAccess: async () => ({ staff: state.staff }) }))
vi.mock('@/features/admin/data/adapters', () => ({
  getDDay: async () => ({ generated_at: 'now', since: 'today', after_close: false, data: null }),
}))

const { GET } = await import('./route')
const get = () => GET(new NextRequest('https://insight.test/api/admin/d-day'))

beforeEach(() => {
  state.scoped = null
  state.signedIn = true
  state.staff = false
})

describe('GET /api/admin/d-day', () => {
  it('is 401 signed out and 403 for non-staff', async () => {
    state.signedIn = false
    expect((await get()).status).toBe(401)

    state.signedIn = true
    expect((await get()).status).toBe(403)
    expect(state.roles).toEqual(['field_staff', 'gate_staff', 'booth_staff'])
  })

  it('opens to admins and admin_roles staff, and to committee profiles (staffAccessFor)', async () => {
    state.scoped = { ok: true, user: { id: 'a' }, role: 'admin' }
    expect((await get()).status).toBe(200)

    state.scoped = null
    state.staff = true
    const res = await get()
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect((await res.json()).data).toMatchObject({ since: 'today', after_close: false })
  })
})
