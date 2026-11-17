import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ user: null as null | { id: string }, clientsCreated: 0 }))

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => {
    auth.clientsCreated += 1
    return {
      auth: {
        getClaims: async () => ({ data: auth.user ? { claims: { sub: auth.user.id } } : null, error: null }),
      },
    }
  },
}))

const { proxy } = await import('./proxy')

const ORIGIN = 'https://insight.test'
const request = (path: string, init: { method?: string; headers?: Record<string, string> } = {}) =>
  new NextRequest(new URL(path, ORIGIN), init)

const rewriteTarget = (res: Response) => res.headers.get('x-middleware-rewrite')
const passedThrough = (res: Response) => res.headers.get('x-middleware-next') === '1'

const SESSION_COOKIE = { cookie: 'sb-otdy-auth-token=base64-session' }

afterEach(() => {
  vi.unstubAllEnvs()
  auth.user = null
  auth.clientsCreated = 0
})

describe('proxy: countdown-only mode', () => {
  beforeEach(() => vi.stubEnv('COUNTDOWN_ONLY', 'true'))

  it('blocks API routes and writes with 503', async () => {
    expect((await proxy(request('/api/teams', { method: 'POST' }))).status).toBe(503)
    expect((await proxy(request('/api/booths'))).status).toBe(503)
    expect((await proxy(request('/login', { method: 'POST' }))).status).toBe(503)
  })

  it('keeps the public feedback API open, but not the staff summary', async () => {
    expect(passedThrough(await proxy(request('/api/feedback/inspirates-2026', { method: 'POST' })))).toBe(true)
    expect((await proxy(request('/api/feedback?form=x'))).status).toBe(503)
  })

  it('rewrites every other page, including /admin and /dashboard, to the countdown', async () => {
    for (const path of ['/', '/admin', '/dashboard', '/competition/business-plan-competition']) {
      expect(rewriteTarget(await proxy(request(path)))).toContain('/countdown.html')
    }
  })

  it('still serves login and the feedback page', async () => {
    expect(passedThrough(await proxy(request('/login')))).toBe(true)
    expect(passedThrough(await proxy(request('/feedback/inspirates-2026')))).toBe(true)
  })
})

describe('proxy: maintenance mode', () => {
  beforeEach(() => {
    vi.stubEnv('MAINTENANCE_PAGES', '/competition')
    vi.stubEnv('MAINTENANCE_BYPASS_SECRET', 'let-me-in')
  })

  it('rewrites matching pages (and their children only) to the maintenance page with 503', async () => {
    const blocked = await proxy(request('/competition/olimpiade-engineering'))
    expect(blocked.status).toBe(503)
    expect(rewriteTarget(blocked)).toContain('/maintenance/page')
    expect(rewriteTarget(await proxy(request('/competitions-archive')))).toBeNull()
  })

  it('takes the whole site down with MAINTENANCE_SITE', async () => {
    vi.stubEnv('MAINTENANCE_SITE', 'true')
    expect(rewriteTarget(await proxy(request('/')))).toContain('/maintenance/site')
  })

  it('closes the map when NEXT_PUBLIC_MAPS_DISABLED=true', async () => {
    vi.stubEnv('NEXT_PUBLIC_MAPS_DISABLED', 'true')
    expect((await proxy(request('/event-map'))).status).toBe(503)
  })

  it('bypass link sets an httpOnly cookie and strips the secret from the URL', async () => {
    const res = await proxy(request('/competition?bypass=let-me-in'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(`${ORIGIN}/competition`)
    expect(res.headers.get('set-cookie')).toMatch(/maintenance-bypass=.*HttpOnly/i)
  })

  it('a wrong bypass value or cookie does not get through', async () => {
    expect((await proxy(request('/competition?bypass=guess'))).status).toBe(503)
    const withCookie = request('/competition', { headers: { cookie: 'maintenance-bypass=guess' } })
    expect((await proxy(withCookie)).status).toBe(503)
    const valid = request('/competition', { headers: { cookie: 'maintenance-bypass=let-me-in' } })
    expect((await proxy(valid)).status).not.toBe(503)
  })
})

describe('proxy: session guard for /dashboard and /admin', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fake.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
  })

  it('sends signed-out visitors to /login with a same-site next', async () => {
    const res = await proxy(request('/dashboard/profile?tab=qr'))
    expect(res.status).toBe(307)
    const location = new URL(res.headers.get('location')!)
    expect(location.pathname).toBe('/login')
    expect(location.searchParams.get('next')).toBe('/dashboard/profile?tab=qr')
  })

  it('protects /admin the same way (the admin role is checked in the layout)', async () => {
    const res = await proxy(request('/admin/qr-points'))
    expect(res.status).toBe(307)
    expect(new URL(res.headers.get('location')!).searchParams.get('next')).toBe('/admin/qr-points')
  })

  it('a stale cookie without a valid session still redirects', async () => {
    const res = await proxy(request('/admin', { headers: SESSION_COOKIE }))
    expect(res.status).toBe(307)
  })

  it('lets signed-in users through', async () => {
    auth.user = { id: 'user-1' }
    expect(passedThrough(await proxy(request('/dashboard', { headers: SESSION_COOKIE })))).toBe(true)
  })

  it('does not touch Supabase for visitors without a session cookie on public pages', async () => {
    expect(passedThrough(await proxy(request('/competition/olimpiade-engineering')))).toBe(true)
    expect(passedThrough(await proxy(request('/administrator-guide')))).toBe(true)
    expect(auth.clientsCreated).toBe(0)
  })
})
