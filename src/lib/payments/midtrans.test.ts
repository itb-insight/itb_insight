import { createHash } from 'node:crypto'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDb, writesTo, type FakeDb } from '../../../tests/support/fake-supabase'

const state = vi.hoisted(() => ({ db: undefined as unknown as FakeDb }))

vi.mock('@/lib/supabase/server', async () => {
  const { createFakeClient } = await import('../../../tests/support/fake-supabase')
  return { createServiceClient: () => createFakeClient(state.db) }
})

const { verifyMidtransSignature, processMidtransNotification, mockSettlePayment } = await import('./midtrans')

const SERVER_KEY = 'test-server-key'
const sign = (orderId: string, statusCode: string, gross: string, key = SERVER_KEY) =>
  createHash('sha512').update(`${orderId}${statusCode}${gross}${key}`).digest('hex')

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'refunded'

function useDb(payment: { status: PaymentStatus; amount: number } | null) {
  state.db = createFakeDb((call) => {
    if (call.table === 'midtrans_transactions' && call.op === 'select') {
      return {
        data: payment
          ? { id: 'tx-1', payment_id: 'pay-1', payments: { id: 'pay-1', registration_id: 'reg-1', ...payment } }
          : null,
        error: null,
      }
    }
    return { data: { id: 'row' }, error: null }
  })
}

function notification(overrides: Partial<Record<string, string>> = {}) {
  const base = { order_id: 'INSIGHT-1', status_code: '200', gross_amount: '150000.00', transaction_status: 'settlement' }
  const merged = { ...base, ...overrides }
  return {
    ...merged,
    signature_key: overrides.signature_key ?? sign(merged.order_id, merged.status_code, merged.gross_amount),
  } as Parameters<typeof processMidtransNotification>[0]
}

beforeEach(() => {
  vi.stubEnv('MIDTRANS_SERVER_KEY', SERVER_KEY)
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fake.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fake')
  useDb({ status: 'pending', amount: 150000 })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('verifyMidtransSignature', () => {
  it('accepts the SHA-512 of order_id + status_code + gross_amount + server key, in any case', () => {
    const signature = sign('INSIGHT-1', '200', '150000.00')
    expect(verifyMidtransSignature('INSIGHT-1', '200', '150000.00', signature)).toBe(true)
    expect(verifyMidtransSignature('INSIGHT-1', '200', '150000.00', signature.toUpperCase())).toBe(true)
  })

  it('rejects tampered fields, other keys, truncated signatures, and a missing server key', () => {
    const signature = sign('INSIGHT-1', '200', '150000.00')
    expect(verifyMidtransSignature('INSIGHT-1', '200', '1.00', signature)).toBe(false)
    expect(verifyMidtransSignature('INSIGHT-1', '200', '150000.00', sign('INSIGHT-1', '200', '150000.00', 'other'))).toBe(false)
    expect(verifyMidtransSignature('INSIGHT-1', '200', '150000.00', signature.slice(0, 64))).toBe(false)
    expect(verifyMidtransSignature('INSIGHT-1', '200', '150000.00', '')).toBe(false)
    vi.stubEnv('MIDTRANS_SERVER_KEY', '')
    expect(verifyMidtransSignature('INSIGHT-1', '200', '150000.00', signature)).toBe(false)
  })
})

describe('processMidtransNotification (webhook)', () => {
  it('refuses everything when no server key is configured', async () => {
    vi.stubEnv('MIDTRANS_SERVER_KEY', '')
    const result = await processMidtransNotification(notification())
    expect(result).toMatchObject({ ok: false, status: 503 })
    expect(state.db.calls).toEqual([])
  })

  it('rejects a bad signature before touching the database', async () => {
    const result = await processMidtransNotification(notification({ signature_key: 'f'.repeat(128) }))
    expect(result).toMatchObject({ ok: false, code: 'INVALID_SIGNATURE', status: 403 })
    expect(state.db.calls).toEqual([])
  })

  it('answers 404 for an unknown order', async () => {
    useDb(null)
    expect(await processMidtransNotification(notification())).toMatchObject({ ok: false, status: 404 })
  })

  it('rejects a correctly signed notification whose amount differs from what was billed', async () => {
    const result = await processMidtransNotification(notification({ gross_amount: '1000.00' }))
    expect(result).toMatchObject({ ok: false, code: 'AMOUNT_MISMATCH' })
    expect(writesTo(state.db, 'payments')).toEqual([])
  })

  it('marks a pending payment paid on settlement and writes an audit log', async () => {
    const result = await processMidtransNotification(notification())
    expect(result).toEqual({ ok: true, status: 'paid' })
    const [update] = writesTo(state.db, 'payments')
    expect(update.payload).toMatchObject({ status: 'paid', paid_at: expect.any(String) })
    expect(writesTo(state.db, 'audit_logs')).toHaveLength(1)
  })

  it('is idempotent: a duplicate settlement does not update the payment again', async () => {
    useDb({ status: 'paid', amount: 150000 })
    expect(await processMidtransNotification(notification())).toEqual({ ok: true, status: 'paid' })
    expect(writesTo(state.db, 'payments')).toEqual([])
  })

  it('never moves a paid payment backwards (late expire / deny)', async () => {
    useDb({ status: 'paid', amount: 150000 })
    for (const transaction_status of ['expire', 'deny', 'cancel', 'pending']) {
      expect(await processMidtransNotification(notification({ transaction_status }))).toEqual({ ok: true, status: 'paid' })
    }
    expect(writesTo(state.db, 'payments')).toEqual([])
  })

  it('allows paid -> refunded, and nothing after refunded', async () => {
    useDb({ status: 'paid', amount: 150000 })
    expect(await processMidtransNotification(notification({ transaction_status: 'refund' }))).toEqual({ ok: true, status: 'refunded' })
    useDb({ status: 'refunded', amount: 150000 })
    expect(await processMidtransNotification(notification())).toEqual({ ok: true, status: 'refunded' })
    expect(writesTo(state.db, 'payments')).toEqual([])
  })

  it('keeps a fraud-challenged capture pending', async () => {
    const result = await processMidtransNotification(notification({ transaction_status: 'capture', fraud_status: 'challenge' }))
    expect(result).toEqual({ ok: true, status: 'pending' })
    expect(writesTo(state.db, 'payments')).toEqual([])
  })
})

describe('mockSettlePayment (dev-only)', () => {
  it('is unavailable in production and whenever a real server key exists', async () => {
    expect(await mockSettlePayment('INSIGHT-1', 'user-1')).toMatchObject({ ok: false, status: 404 })
    vi.stubEnv('MIDTRANS_SERVER_KEY', '')
    vi.stubEnv('NODE_ENV', 'production')
    expect(await mockSettlePayment('INSIGHT-1', 'user-1')).toMatchObject({ ok: false, status: 404 })
    expect(state.db.calls).toEqual([])
  })
})
