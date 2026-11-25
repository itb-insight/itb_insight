import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, writesTo, type FakeDb } from '../../../../../tests/support/fake-supabase'

const state = vi.hoisted(() => ({
  db: undefined as unknown as FakeDb,
  admin: true,
  configured: true,
  afterCallbacks: [] as Array<() => Promise<unknown> | unknown>,
}))

vi.mock('next/server', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    after: (cb: () => Promise<unknown> | unknown) => {
      state.afterCallbacks.push(cb)
    },
  }
})

vi.mock('@/lib/supabase/server', async () => {
  const { createFakeClient } = await import('../../../../../tests/support/fake-supabase')
  return {
    createServiceClient: () => createFakeClient(state.db),
    createClient: async () => createFakeClient(state.db),
  }
})

vi.mock('@/lib/admin', () => ({
  getScopedUser: async () =>
    state.admin
      ? { ok: true, role: 'admin', user: { id: 'admin-1', email: 'admin@insight.id', email_confirmed_at: '2026-01-01' } }
      : { ok: false, code: 'ADMIN_ONLY', message: 'Akses ditolak.', status: 403 },
}))

vi.mock('@/lib/email/resend', () => ({
  BATCH_SIZE: 100,
  isEmailConfigured: () => state.configured,
  sendBatch: vi.fn().mockResolvedValue({ ok: true, ids: ['msg-1', 'msg-2'] }),
}))

const { GET, POST } = await import('./route')

const postRequest = (body: unknown) =>
  POST(
    new NextRequest('https://insight.test/api/admin/email', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  )

const getRequest = (query = '') =>
  GET(new NextRequest(`https://insight.test/api/admin/email${query ? `?${query}` : ''}`))

beforeEach(() => {
  state.admin = true
  state.configured = true
  state.afterCallbacks = []

  state.db = createFakeDb((call) => {
    if (call.table === 'email_campaigns') {
      if (call.op === 'insert') return { data: { id: '11111111-1111-1111-1111-111111111111' }, error: null }
      if (call.mode === 'maybeSingle') {
        return {
          data: {
            id: '11111111-1111-1111-1111-111111111111',
            subject: 'Subjek',
            body: 'Isi',
            status: 'completed',
            recipient_count: 2,
            sent_count: 2,
            failed_count: 0,
          },
          error: null,
        }
      }
      return { data: [{ id: '11111111-1111-1111-1111-111111111111', subject: 'Subjek', status: 'completed' }], error: null }
    }
    if (call.table === 'email_outbox') {
      return { data: [], error: null, count: 0 }
    }
    if (call.table === 'audit_logs') {
      return { data: { id: 'audit-1' }, error: null }
    }
    return { data: [], error: null }
  })
})

describe('/api/admin/email', () => {
  it('blocks non-admin callers on GET and POST', async () => {
    state.admin = false
    expect((await getRequest()).status).toBe(403)
    expect((await postRequest({ dryRun: true, subject: 'Hi', body: 'Hello', filter: { allUsers: true } })).status).toBe(403)
    expect(state.db.calls).toEqual([])
  })

  it('previews formatted-string winners / shadow account emails on dryRun without writing to DB', async () => {
    const res = await postRequest({
      dryRun: true,
      subject: 'Pengumuman {{juara}} - {{nama}}',
      body: 'Halo {{nama}}, link sertifikat: {{gdrive_link}} | pass: {{password}}',
      filter: {
        customRecipients: [
          {
            email: 'juara1@example.com',
            name: 'Tim Alpha',
            variables: {
              juara: 'Juara 1',
              gdrive_link: 'https://drive.google.com/drive/folders/sertifikat-1',
              password: 'Init#Pass99',
            },
          },
        ],
      },
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.recipientCount).toBe(1)
    expect(json.data.preview.subject).toBe('Pengumuman Juara 1 - Tim Alpha')
    expect(json.data.preview.text).toContain('https://drive.google.com/drive/folders/sertifikat-1')
    expect(json.data.preview.text).toContain('Init#Pass99')
    expect(writesTo(state.db, 'email_campaigns')).toHaveLength(0)
    expect(writesTo(state.db, 'email_outbox')).toHaveLength(0)
  })

  it('queues a live campaign, writes outbox rows with variables, schedules after() worker, and returns 202', async () => {
    const res = await postRequest({
      subject: 'Selamat {{juara}} - {{nama}}',
      body: 'Sertifikat: {{gdrive_link}}',
      filter: {
        customRecipients: [
          {
            email: 'winner1@example.com',
            name: 'Tim Satu',
            variables: { juara: 'Juara 1', gdrive_link: 'https://drive.google.com/1' },
          },
          {
            email: 'winner2@example.com',
            name: 'Tim Dua',
            variables: { juara: 'Juara 2', gdrive_link: 'https://drive.google.com/2' },
          },
        ],
      },
    })

    expect(res.status).toBe(202)
    const json = await res.json()
    expect(json.data).toEqual({
      campaignId: '11111111-1111-1111-1111-111111111111',
      status: 'sending',
      recipientCount: 2,
    })
    expect(writesTo(state.db, 'email_campaigns')).toHaveLength(1)
    expect(writesTo(state.db, 'email_outbox')).toHaveLength(1)
    expect(state.afterCallbacks).toHaveLength(1)
  })

  it('refuses live send with 503 when Resend is not configured', async () => {
    state.configured = false
    const res = await postRequest({
      subject: 'Subjek',
      body: 'Isi',
      filter: { customRecipients: [{ email: 'user@example.com' }] },
    })
    expect(res.status).toBe(503)
  })

  it('returns campaign details and outbox counts on GET ?campaignId=...', async () => {
    const res = await getRequest('campaignId=11111111-1111-1111-1111-111111111111')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.campaign.id).toBe('11111111-1111-1111-1111-111111111111')
    expect(json.data.counts).toEqual({ pending: 0, sending: 0, sent: 0, failed: 0 })
  })

  it('rejects malformed campaignId on GET and POST resume', async () => {
    expect((await getRequest('campaignId=not-a-uuid')).status).toBe(400)
    expect((await postRequest({ campaignId: 'not-a-uuid' })).status).toBe(400)
  })
})
