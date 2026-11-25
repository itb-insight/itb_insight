import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ allowed: false, roles: [] as unknown[] }))

vi.mock('@/lib/admin', () => ({
  getScopedUser: async (_request: unknown, roles: unknown) => {
    state.roles = roles as unknown[]
    return state.allowed
      ? { ok: true, user: { id: 'admin-1' }, role: 'admin' }
      : { ok: false, code: 'ADMIN_ONLY', message: 'no', status: 403 }
  },
}))
vi.mock('@/features/admin/data/adapters', () => ({
  getLive: async () => ({ generated_at: 'now', since: 'today', onsite: null, web: null, web_configured: false }),
}))

const { GET } = await import('./route')

describe('GET /api/admin/live', () => {
  it('is admin-only and never cached by the browser or a CDN', async () => {
    const denied = await GET(new NextRequest('https://insight.test/api/admin/live'))
    expect(denied.status).toBe(403)
    expect(state.roles).toEqual(['admin'])

    state.allowed = true
    const res = await GET(new NextRequest('https://insight.test/api/admin/live'))
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect((await res.json()).data).toMatchObject({ since: 'today' })
  })
})
