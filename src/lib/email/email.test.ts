import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, eqValue, type FakeCall, type FakeDb } from '../../../tests/support/fake-supabase'

import { parseAudienceFilter } from './audience'
import { FALLBACK_NAME, renderEmail } from './template'

const state = vi.hoisted(() => ({
  db: undefined as unknown as FakeDb,
  sendBatchMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', async () => {
  const { createFakeClient } = await import('../../../tests/support/fake-supabase')
  return { createServiceClient: () => createFakeClient(state.db) }
})

vi.mock('./resend', () => ({
  BATCH_SIZE: 100,
  isEmailConfigured: () => true,
  sendBatch: (...args: unknown[]) => state.sendBatchMock(...args),
}))

const { resolveRecipients } = await import('./recipients')
const { createCampaign, processCampaign, resumeCampaign, MAX_ATTEMPTS } = await import('./campaigns')

function inValues(call: FakeCall, column: string): unknown[] | undefined {
  return call.filters.find((filter) => filter.method === 'in' && filter.args[0] === column)?.args[1] as
    | unknown[]
    | undefined
}

describe('email template rendering', () => {
  it('substitutes {{nama}}, escapes HTML, and strips control characters from subject', () => {
    const rendered = renderEmail(
      {
        subject: 'Halo {{ nama }}\r\nBcc: attacker@evil.test',
        body: 'Selamat datang, {{NAMA}}!\n\nKlik <script>alert(1)</script> & lanjut.',
      },
      { name: 'Budi <Admin>\nInjected' },
    )

    expect(rendered.subject).toBe('Halo Budi <Admin> Injected Bcc: attacker@evil.test')
    expect(rendered.text).toContain('Selamat datang, Budi <Admin> Injected!')
    expect(rendered.html).toContain('Budi &lt;Admin&gt; Injected')
    expect(rendered.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; lanjut.')
    expect(rendered.html).not.toContain('<script>')
  })

  it('falls back when recipient name is blank or null', () => {
    const rendered = renderEmail({ subject: 'Hi {{nama}}', body: 'Halo {{nama}}' }, { name: '   ' })
    expect(rendered.subject).toBe(`Hi ${FALLBACK_NAME}`)
    expect(rendered.text).toBe(`Halo ${FALLBACK_NAME}`)
  })
})

describe('parseAudienceFilter', () => {
  it('rejects empty filter unless allUsers is explicitly true', () => {
    expect(parseAudienceFilter({})).toEqual({
      ok: false,
      message: 'Pilih minimal satu filter penerima, atau aktifkan allUsers secara eksplisit.',
    })
    expect(parseAudienceFilter({ allUsers: false })).toEqual({
      ok: false,
      message: 'Pilih minimal satu filter penerima, atau aktifkan allUsers secara eksplisit.',
    })
    expect(parseAudienceFilter({ allUsers: true })).toEqual({
      ok: true,
      filter: { allUsers: true },
    })
  })

  it('validates enum values and slug format', () => {
    expect(parseAudienceFilter({ registrationStatus: ['invalid'] }).ok).toBe(false)
    expect(parseAudienceFilter({ paymentStatus: ['paid', 'unpaid'] })).toEqual({
      ok: true,
      filter: { paymentStatus: ['paid', 'unpaid'] },
    })
    expect(parseAudienceFilter({ competitionSlugs: ['bad slug!'] }).ok).toBe(false)
    expect(parseAudienceFilter({ competitionSlugs: ['business-plan-competition'] }).ok).toBe(true)
  })
})

describe('resolveRecipients', () => {
  const profiles = [
    { id: 'u-ind', full_name: 'Alya', email: 'Alya@Example.com' },
    { id: 'u-lead', full_name: 'Bima', email: 'bima@example.com' },
    { id: 'u-mem', full_name: 'Citra', email: 'citra@example.com' },
    { id: 'u-other', full_name: 'Doni', email: 'doni@example.com' },
  ]

  beforeEach(() => {
    state.db = createFakeDb((call) => {
      switch (call.table) {
        case 'competitions':
          return { data: [{ id: 'comp-1' }], error: null }
        case 'competition_registrations':
          return {
            data: [
              { id: 'reg-1', user_id: 'u-ind', team_id: null, payments: [{ status: 'paid' }] },
              { id: 'reg-2', user_id: null, team_id: 'team-1', payments: [] },
            ],
            error: null,
          }
        case 'competition_team_members':
          return {
            data: [
              { id: 'm-1', user_id: 'u-lead' },
              { id: 'm-2', user_id: 'u-mem' },
            ],
            error: null,
          }
        case 'visitor_tickets':
          return { data: [{ id: 't-1', user_id: 'u-ind' }, { id: 't-2', user_id: 'u-mem' }], error: null }
        case 'profiles': {
          const ids = inValues(call, 'id') as string[] | undefined
          const filtered = ids ? profiles.filter((p) => ids.includes(p.id)) : profiles
          return { data: filtered, error: null }
        }
        default:
          return { data: [], error: null }
      }
    })
  })

  it('includes individual registrants and all team members, intersected with checkedIn and unioned with manual emails', async () => {
    const res = await resolveRecipients({
      competitionSlugs: ['business-plan-competition'],
      checkedIn: true,
      manualEmails: ['Alya@example.com', 'vip@itb.ac.id', 'not-an-email'],
    })

    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.recipients.map((r) => r.email)).toEqual(['alya@example.com', 'citra@example.com', 'vip@itb.ac.id'])
    expect(res.invalidManualEmails).toEqual(['not-an-email'])
  })

  it('filters unpaid registrations (no paid payment record)', async () => {
    const res = await resolveRecipients({
      competitionSlugs: ['business-plan-competition'],
      paymentStatus: ['unpaid'],
    })

    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.recipients.map((r) => r.email)).toEqual(['bima@example.com', 'citra@example.com'])
  })
})

describe('campaigns & outbox delivery', () => {
  type OutboxRow = {
    id: string
    campaign_id: string
    user_id: string | null
    to_email: string
    to_name: string | null
    status: 'pending' | 'sending' | 'sent' | 'failed'
    attempts: number
    last_error: string | null
    next_attempt_at: string
    provider_message_id: string | null
    idempotency_key: string
    sent_at: string | null
    created_at: string
    updated_at: string
  }

  let campaignRow: {
    id: string
    subject: string
    body: string
    status: string
    recipient_count: number
    sent_count: number
    failed_count: number
    started_at: string | null
    completed_at: string | null
  }
  let outbox: OutboxRow[]

  beforeEach(() => {
    state.sendBatchMock.mockReset()
    campaignRow = {
      id: 'camp-1',
      subject: 'Pengumuman {{nama}}',
      body: 'Halo {{nama}}',
      status: 'queued',
      recipient_count: 0,
      sent_count: 0,
      failed_count: 0,
      started_at: null,
      completed_at: null,
    }
    outbox = []

    state.db = createFakeDb((call) => {
      if (call.table === 'email_campaigns') {
        if (call.op === 'insert') {
          const payload = call.payload as Record<string, unknown>
          campaignRow = {
            ...campaignRow,
            subject: payload.subject as string,
            body: payload.body as string,
            recipient_count: payload.recipient_count as number,
          }
          return { data: { id: campaignRow.id }, error: null }
        }
        if (call.op === 'update') {
          Object.assign(campaignRow, call.payload)
          return { data: campaignRow, error: null }
        }
        return { data: campaignRow, error: null }
      }

      if (call.table === 'email_outbox') {
        if (call.op === 'insert') {
          const rows = call.payload as Array<Record<string, unknown>>
          rows.forEach((r, idx) => {
            outbox.push({
              id: `row-${outbox.length + idx + 1}`,
              campaign_id: r.campaign_id as string,
              user_id: (r.user_id as string | null) ?? null,
              to_email: r.to_email as string,
              to_name: (r.to_name as string | null) ?? null,
              status: 'pending',
              attempts: 0,
              last_error: null,
              next_attempt_at: new Date(0).toISOString(),
              provider_message_id: null,
              idempotency_key: r.idempotency_key as string,
              sent_at: null,
              created_at: new Date(0).toISOString(),
              updated_at: new Date().toISOString(),
            })
          })
          return { data: null, error: null }
        }

        if (call.op === 'select') {
          const status = eqValue(call, 'status') as OutboxRow['status'] | undefined
          const lte = call.filters.find((f) => f.method === 'lte' && f.args[0] === 'next_attempt_at')?.args[1] as
            | string
            | undefined
          let rows = outbox.filter((r) => (!status || r.status === status) && (!lte || r.next_attempt_at <= lte))
          const limit = call.filters.find((f) => f.method === 'limit')?.args[0] as number | undefined
          if (limit !== undefined) rows = rows.slice(0, limit)
          return { data: rows, error: null, count: rows.length }
        }

        if (call.op === 'update') {
          const patch = call.payload as Partial<OutboxRow>
          const idEq = eqValue(call, 'id') as string | undefined
          const idsIn = inValues(call, 'id') as string[] | undefined
          const statusEq = eqValue(call, 'status') as OutboxRow['status'] | undefined
          const ltUpdated = call.filters.find((f) => f.method === 'lt' && f.args[0] === 'updated_at')?.args[1] as
            | string
            | undefined

          const matched = outbox.filter(
            (r) =>
              (!idEq || r.id === idEq) &&
              (!idsIn || idsIn.includes(r.id)) &&
              (!statusEq || r.status === statusEq) &&
              (!ltUpdated || r.updated_at < ltUpdated),
          )
          matched.forEach((r) => Object.assign(r, patch))
          return { data: matched, error: null }
        }
      }

      return { data: null, error: null }
    })
  })

  it('queues recipients and marks all sent when batch succeeds', async () => {
    const created = await createCampaign({
      createdBy: 'admin-1',
      content: { subject: 'Pengumuman {{nama}}', body: 'Halo {{nama}}' },
      filter: { allUsers: true },
      recipients: [
        { userId: 'u-1', email: 'a@example.com', name: 'Alya' },
        { userId: 'u-2', email: 'b@example.com', name: 'Bima' },
      ],
    })
    expect(created).toEqual({ ok: true, campaignId: 'camp-1' })
    expect(outbox).toHaveLength(2)

    state.sendBatchMock.mockResolvedValueOnce({ ok: true, ids: ['msg-1', 'msg-2'] })

    const counts = await processCampaign('camp-1', { budgetMs: 5_000 })
    expect(counts).toEqual({ pending: 0, sending: 0, sent: 2, failed: 0 })
    expect(campaignRow.status).toBe('completed')
    expect(outbox.map((r) => r.provider_message_id)).toEqual(['msg-1', 'msg-2'])
  })

  it('bisects permanent 422 batch failures to isolate the bad recipient', async () => {
    await createCampaign({
      createdBy: 'admin-1',
      content: { subject: 'Subjek', body: 'Isi' },
      filter: { allUsers: true },
      recipients: [
        { userId: 'u-1', email: 'good@example.com', name: 'Good' },
        { userId: 'u-2', email: 'bad@example.com', name: 'Bad' },
      ],
    })

    state.sendBatchMock.mockImplementation(async (emails: Array<{ to: string }>) => {
      if (emails.some((e) => e.to === 'bad@example.com')) {
        return { ok: false, permanent: true, message: 'Resend 422: invalid to address' }
      }
      return { ok: true, ids: emails.map(() => 'msg-ok') }
    })

    const counts = await processCampaign('camp-1', { budgetMs: 5_000 })
    expect(counts).toEqual({ pending: 0, sending: 0, sent: 1, failed: 1 })
    expect(campaignRow.status).toBe('partial')
    expect(outbox.find((r) => r.to_email === 'good@example.com')?.status).toBe('sent')
    expect(outbox.find((r) => r.to_email === 'bad@example.com')?.status).toBe('failed')
  })

  it('schedules backoff on transient failure and retries failed rows on resumeCampaign', async () => {
    await createCampaign({
      createdBy: 'admin-1',
      content: { subject: 'Subjek', body: 'Isi' },
      filter: { allUsers: true },
      recipients: [{ userId: 'u-1', email: 'a@example.com', name: 'Alya' }],
    })

    // Transient failure with a long Retry-After so processCampaign exits without sleeping
    state.sendBatchMock.mockResolvedValueOnce({
      ok: false,
      permanent: false,
      message: 'Resend 429: rate limited',
      retryAfterSeconds: 120,
    })

    const first = await processCampaign('camp-1', { budgetMs: 1_000 })
    expect(first).toEqual({ pending: 1, sending: 0, sent: 0, failed: 0 })
    expect(outbox[0].attempts).toBe(1)
    expect(campaignRow.status).toBe('sending')

    // Exhaust attempts -> failed, then resume with retryFailed = true
    outbox[0].attempts = MAX_ATTEMPTS - 1
    outbox[0].next_attempt_at = new Date(0).toISOString()
    state.sendBatchMock.mockResolvedValueOnce({
      ok: false,
      permanent: false,
      message: 'Resend 503: unavailable',
    })
    await processCampaign('camp-1', { budgetMs: 1_000 })
    expect(outbox[0].status).toBe('failed')
    expect(campaignRow.status).toBe('failed')

    state.sendBatchMock.mockResolvedValueOnce({ ok: true, ids: ['msg-recovered'] })
    const resumed = await resumeCampaign('camp-1', true)
    expect(resumed).toEqual({ pending: 0, sending: 0, sent: 1, failed: 0 })
    expect(campaignRow.status).toBe('completed')
  })
})
