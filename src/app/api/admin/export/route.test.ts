import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, writesTo, type FakeDb } from '../../../../../tests/support/fake-supabase'

const state = vi.hoisted(() => ({
  db: undefined as unknown as FakeDb,
  auth: { ok: true } as Record<string, unknown>,
}))

vi.mock('@/lib/supabase/server', async () => {
  const { createFakeClient } = await import('../../../../../tests/support/fake-supabase')
  return { createServiceClient: () => createFakeClient(state.db) }
})
vi.mock('@/lib/admin', () => ({ getScopedUser: async () => state.auth }))
vi.mock('@/lib/feedback/export', () => ({ buildFeedbackExport: async () => null }))

const { GET } = await import('./route')

const exportRequest = (query: string) => new NextRequest(`https://insight.test/api/admin/export?${query}`)

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fake.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fake')
  state.auth = { ok: true, user: { id: 'admin-1', email: 'admin@insight.id' }, role: 'admin' }
  state.db = createFakeDb((call) => {
    if (call.table === 'competition_registrations') {
      return {
        data: [
          {
            id: 'reg-1',
            registration_kind: 'individual',
            status: 'submitted',
            submitted_at: '2026-10-01',
            competitions: { name: 'Olimpiade Engineering', slug: 'olimpiade-engineering' },
            profiles: { full_name: '=HYPERLINK("http://evil.example","klik")', email: '@SUM(1)', phone: '+62812', institution: 'ITB' },
            competition_teams: null,
          },
        ],
        error: null,
      }
    }
    return { data: { id: 'audit-1' }, error: null }
  })
})

describe('GET /api/admin/export', () => {
  it('refuses non-admins before reading any data', async () => {
    state.auth = { ok: false, code: 'ADMIN_ONLY', message: 'no', status: 403 }
    const res = await GET(exportRequest('type=registrations'))
    expect(res.status).toBe(403)
    expect(state.db.calls).toEqual([])
  })

  it('neutralizes spreadsheet formulas in exported cells', async () => {
    const res = await GET(exportRequest('type=registrations'))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/csv')
    const csv = await res.text()
    expect(csv).toContain(`"'=HYPERLINK(""http://evil.example"",""klik"")"`)
    expect(csv).toContain(`"'@SUM(1)"`)
    expect(csv).not.toMatch(/(^|,)"=/m)
  })

  it('records who exported what', async () => {
    await GET(exportRequest('type=registrations'))
    const [audit] = writesTo(state.db, 'audit_logs')
    expect(audit.payload).toMatchObject({ user_id: 'admin-1', action: 'DATA_EXPORT_REGISTRATIONS' })
  })

  it('rejects unknown export types', async () => {
    expect((await GET(exportRequest('type=profiles'))).status).toBe(400)
  })
})
