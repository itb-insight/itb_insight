import { beforeEach, describe, expect, it, vi } from 'vitest'

import { type FeedbackForm } from './forms'
import { questionListSchema } from './schema'

// ─── Fakes ───────────────────────────────────────────────────────────────────

const db = vi.hoisted(() => ({
  inserted: [] as Record<string, unknown>[],
  insertError: null as null | { code: string; message: string },
  profile: null as null | { full_name: string; email: string },
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === 'profiles') {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: db.profile, error: null }) }) }) }
      }
      return {
        insert: (row: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              if (db.insertError) return { data: null, error: db.insertError }
              db.inserted.push(row)
              return { data: { id: 'new-id' }, error: null }
            },
          }),
        }),
      }
    },
  }),
}))

const turnstile = vi.hoisted(() => ({ verify: vi.fn(async () => true) }))
vi.mock('./turnstile', () => ({ verifyTurnstile: turnstile.verify }))

const { processSubmission } = await import('./submit')

// ─── Fixtures ────────────────────────────────────────────────────────────────

const NOW = new Date('2026-11-12T10:00:00+07:00')

const form: FeedbackForm = {
  id: 'form-1',
  slug: 'inspirates-2026',
  title: 'Feedback',
  description: null,
  context: 'inspirates',
  opensAt: '2026-11-11T00:00:00+07:00',
  closesAt: '2026-11-24T23:59:59+07:00',
  isActive: true,
  piiRetentionDays: 180,
  questions: questionListSchema.parse([
    { id: 'fun', type: 'stars', label: 'Seru?', required: true, overall: true },
    { id: 'suggestion', type: 'long', label: 'Saran', required: false },
  ]),
}

const body = (overrides: Record<string, unknown> = {}) => ({
  name: 'Siti',
  email: 'Siti@Example.com',
  answers: { fun: 4, suggestion: 'Lebih lama!' },
  consent: true,
  website: '',
  elapsedMs: 30_000,
  turnstileToken: 'tok',
  ...overrides,
})

const run = (overrides: Partial<Parameters<typeof processSubmission>[0]> = {}) =>
  processSubmission({ form, body: body(), account: null, remoteIp: '1.2.3.4', now: NOW, ...overrides })

beforeEach(() => {
  db.inserted = []
  db.insertError = null
  db.profile = null
  turnstile.verify.mockClear()
  turnstile.verify.mockResolvedValue(true)
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('processSubmission', () => {
  it('stores a valid anonymous submission with a normalised email', async () => {
    const r = await run()
    expect(r).toEqual({ ok: true, id: 'new-id' })
    expect(db.inserted).toHaveLength(1)
    expect(db.inserted[0]).toMatchObject({
      form_id: 'form-1',
      user_id: null,
      name: 'Siti',
      email: 'siti@example.com',
      overall_rating: 4,
      answers: { fun: 4, suggestion: 'Lebih lama!' },
      consent_at: NOW.toISOString(),
    })
    expect(turnstile.verify).toHaveBeenCalledWith('tok', '1.2.3.4')
  })

  it('silently drops honeypot submissions', async () => {
    const r = await run({ body: body({ website: 'http://spam.example' }) })
    expect(r).toEqual({ ok: true, id: null })
    expect(db.inserted).toHaveLength(0)
  })

  it('rejects submissions completed implausibly fast', async () => {
    const r = await run({ body: body({ elapsedMs: 500 }) })
    expect(r).toMatchObject({ ok: false, code: 'TOO_FAST' })
    expect(db.inserted).toHaveLength(0)
  })

  it('requires consent', async () => {
    const r = await run({ body: body({ consent: false }) })
    expect(r).toMatchObject({ ok: false, code: 'CONSENT_REQUIRED', status: 400 })
  })

  it('rejects malformed envelopes', async () => {
    for (const bad of [null, 'x', body({ elapsedMs: 'soon' }), body({ name: 5 })]) {
      expect(await run({ body: bad })).toMatchObject({ ok: false, code: 'INVALID_INPUT' })
    }
    expect(db.inserted).toHaveLength(0)
  })

  it('refuses before opens_at and after closes_at', async () => {
    expect(await run({ now: new Date('2026-11-10T12:00:00+07:00') })).toMatchObject({ code: 'FORM_NOT_OPEN' })
    expect(await run({ now: new Date('2026-11-25T00:00:01+07:00') })).toMatchObject({ code: 'FORM_CLOSED' })
    expect(await run({ form: { ...form, isActive: false } })).toMatchObject({ code: 'FORM_CLOSED' })
    expect(db.inserted).toHaveLength(0)
  })

  it('FEEDBACK_FORCE_OPEN opens closed forms outside production only', async () => {
    const closedNow = new Date('2026-11-25T00:00:01+07:00')
    vi.stubEnv('FEEDBACK_FORCE_OPEN', 'true')
    try {
      vi.stubEnv('NODE_ENV', 'development')
      expect(await run({ now: closedNow })).toMatchObject({ ok: true })

      vi.stubEnv('NODE_ENV', 'production')
      db.inserted = []
      expect(await run({ now: closedNow })).toMatchObject({ code: 'FORM_CLOSED' })
      expect(db.inserted).toHaveLength(0)
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('returns field errors without calling Turnstile or the database', async () => {
    const r = await run({ body: body({ email: 'not-an-email', answers: { fun: 9 } }) })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.fieldErrors ?? {}).sort()).toEqual(['email', 'fun'])
    expect(turnstile.verify).not.toHaveBeenCalled()
    expect(db.inserted).toHaveLength(0)
  })

  it('rejects a failed Turnstile check', async () => {
    turnstile.verify.mockResolvedValue(false)
    expect(await run()).toMatchObject({ ok: false, code: 'CAPTCHA_FAILED', status: 403 })
    expect(db.inserted).toHaveLength(0)
  })

  it('maps the unique-email violation to ALREADY_SUBMITTED', async () => {
    db.insertError = { code: '23505', message: 'duplicate key' }
    expect(await run()).toMatchObject({ ok: false, code: 'ALREADY_SUBMITTED', status: 409 })
  })

  it('takes a signed-in user identity from the account, not the request body', async () => {
    db.profile = { full_name: 'Akun Asli', email: 'asli@itb.ac.id' }
    const r = await run({
      account: { id: 'user-1', email: 'asli@itb.ac.id' },
      body: body({ name: 'Orang Lain', email: 'korban@example.com' }),
    })
    expect(r.ok).toBe(true)
    expect(db.inserted[0]).toMatchObject({ user_id: 'user-1', name: 'Akun Asli', email: 'asli@itb.ac.id' })
  })

  it('asks signed-in users with no profile name to complete their profile', async () => {
    db.profile = { full_name: '', email: 'asli@itb.ac.id' }
    const r = await run({ account: { id: 'user-1', email: 'asli@itb.ac.id' } })
    expect(r).toMatchObject({ ok: false, code: 'PROFILE_INCOMPLETE' })
  })
})
