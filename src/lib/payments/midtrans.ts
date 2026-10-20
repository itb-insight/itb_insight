import crypto, { randomBytes } from 'crypto'

import { createServiceClient } from '@/lib/supabase/server'
import { getCompetitionFee } from '@/lib/competitions'
import { recordAuditLog } from '@/lib/audit'
import { type Payment } from '@/lib/types/database'

// ─── Config helpers (read lazily so env changes / tests are respected) ─────────────────────────
const serverKey = () => process.env.MIDTRANS_SERVER_KEY || ''
const isProductionGateway = () => process.env.MIDTRANS_IS_PRODUCTION === 'true'
const isProductionRuntime = () => process.env.NODE_ENV === 'production'
const snapUrl = () =>
  isProductionGateway()
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions'
const statusApiUrl = (orderId: string) =>
  `${isProductionGateway() ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com'}/v2/${encodeURIComponent(orderId)}/status`
const basicAuth = () => `Basic ${Buffer.from(`${serverKey()}:`).toString('base64')}`

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  providedSignature: string,
): boolean {
  if (!serverKey() || !providedSignature) return false

  const expected = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey()}`)
    .digest('hex')

  const a = Buffer.from(expected.toLowerCase())
  const b = Buffer.from(String(providedSignature).toLowerCase())
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// ─── Registration ownership ────────────────────────────────────────────────────────────────────
type RegistrationAccess = {
  registrationId: string
  status: string
  competitionSlug: string
  competitionName: string
  // true for the individual registrant or the team leader: the only people who may start a payment.
  canPay: boolean
}

// Resolves a registration only if `userId` is the registrant or a member of the team. Returns null
// otherwise, so callers answer "not found" and never reveal that someone else's registration exists.
export async function getRegistrationAccess(
  registrationId: string,
  userId: string,
): Promise<RegistrationAccess | null> {
  const supabase = createServiceClient()

  const { data: registration, error } = await supabase
    .from('competition_registrations')
    .select('id, user_id, team_id, status, competitions(slug, name), competition_teams(leader_user_id)')
    .eq('id', registrationId)
    .maybeSingle()

  if (error || !registration) return null

  const competition = Array.isArray(registration.competitions) ? registration.competitions[0] : registration.competitions
  const team = Array.isArray(registration.competition_teams) ? registration.competition_teams[0] : registration.competition_teams

  const isIndividualOwner = !registration.team_id && registration.user_id === userId
  const isTeamLeader = Boolean(registration.team_id) && team?.leader_user_id === userId

  let isTeamMember = false
  if (registration.team_id && !isTeamLeader) {
    const { data: membership } = await supabase
      .from('competition_team_members')
      .select('id')
      .eq('team_id', registration.team_id)
      .eq('user_id', userId)
      .maybeSingle()
    isTeamMember = Boolean(membership)
  }

  if (!isIndividualOwner && !isTeamLeader && !isTeamMember) return null

  return {
    registrationId: registration.id,
    status: registration.status,
    competitionSlug: competition?.slug || '',
    competitionName: competition?.name || 'Kompetisi',
    canPay: isIndividualOwner || isTeamLeader,
  }
}

// ─── Create payment session (CMP-10, CMP-14, CMP-16) ───────────────────────────────────────────
export type CreatePaymentSessionParams = {
  registrationId: string
  userId: string
  userEmail: string
  userName: string
}

type SessionTransaction = { orderId: string; snapToken?: string | null; redirectUrl?: string | null }

export type CreatePaymentSessionResult =
  | { ok: true; payment: Payment; transaction: SessionTransaction; isMock: boolean; reused: boolean }
  | {
      ok: false
      code:
        | 'REGISTRATION_NOT_FOUND'
        | 'FORBIDDEN'
        | 'REGISTRATION_NOT_PAYABLE'
        | 'ALREADY_PAID'
        | 'FEE_NOT_CONFIGURED'
        | 'GATEWAY_NOT_CONFIGURED'
        | 'DATABASE_ERROR'
        | 'GATEWAY_ERROR'
      message: string
      status: number
    }

async function findLatestPayment(registrationId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('payments')
    .select('*, midtrans_transactions(order_id, snap_token, redirect_url, created_at)')
    .eq('registration_id', registrationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

function latestTransaction(payment: { midtrans_transactions?: unknown } | null) {
  const list = payment?.midtrans_transactions
  const txs = (Array.isArray(list) ? list : list ? [list] : []) as Array<{
    order_id: string
    snap_token: string | null
    redirect_url: string | null
    created_at?: string
  }>
  return [...txs].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))[0] || null
}

export async function createPaymentSession(params: CreatePaymentSessionParams): Promise<CreatePaymentSessionResult> {
  const { registrationId, userId, userEmail, userName } = params
  const supabase = createServiceClient()

  // 1. Authorization: only the registrant / team leader may pay (prevents IDOR).
  const access = await getRegistrationAccess(registrationId, userId)
  if (!access) {
    return { ok: false, code: 'REGISTRATION_NOT_FOUND', message: 'Registrasi lomba tidak ditemukan.', status: 404 }
  }
  if (!access.canPay) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: 'Hanya ketua tim / pendaftar yang dapat melakukan pembayaran.',
      status: 403,
    }
  }
  if (access.status === 'rejected') {
    return { ok: false, code: 'REGISTRATION_NOT_PAYABLE', message: 'Registrasi ini ditolak dan tidak dapat dibayar.', status: 409 }
  }

  // 2. Amount comes ONLY from server-side config (CMP-14). Unfinalized fee => no payment.
  const amount = await getCompetitionFee(access.competitionSlug)
  if (amount === null) {
    return {
      ok: false,
      code: 'FEE_NOT_CONFIGURED',
      message: 'Biaya pendaftaran lomba ini belum ditetapkan. Silakan hubungi panitia.',
      status: 409,
    }
  }

  const isMock = !serverKey()
  if (isMock && isProductionRuntime()) {
    return {
      ok: false,
      code: 'GATEWAY_NOT_CONFIGURED',
      message: 'Layanan pembayaran belum dikonfigurasi. Silakan hubungi panitia.',
      status: 503,
    }
  }

  // 3. Idempotency: reuse a live pending payment, block a paid one (CMP-12, CMP-16).
  const existing = await findLatestPayment(registrationId)
  if (existing?.status === 'paid') {
    return { ok: false, code: 'ALREADY_PAID', message: 'Registrasi ini sudah berhasil dibayar.', status: 409 }
  }
  if (existing?.status === 'pending') {
    const tx = latestTransaction(existing)
    if (tx?.redirect_url) {
      return {
        ok: true,
        payment: existing as Payment,
        transaction: { orderId: tx.order_id, snapToken: tx.snap_token, redirectUrl: tx.redirect_url },
        isMock: existing.provider === 'mock',
        reused: true,
      }
    }
    // Pending without a usable checkout: cancel the stale attempt so a fresh one can be created.
    await supabase.from('payments').update({ status: 'cancelled' }).eq('id', existing.id)
  }

  // 4. Create the gateway order.
  const orderId = `INSIGHT-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`
  let snapToken: string | null = null
  let redirectUrl: string | null = null

  if (!isMock) {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
      const response = await fetch(snapUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: basicAuth() },
        body: JSON.stringify({
          transaction_details: { order_id: orderId, gross_amount: amount },
          customer_details: { first_name: userName, email: userEmail },
          item_details: [
            { id: access.competitionSlug, price: amount, quantity: 1, name: `Registrasi ${access.competitionName}`.slice(0, 50) },
          ],
          ...(siteUrl ? { callbacks: { finish: `${siteUrl}/dashboard` } } : {}),
        }),
      })

      if (!response.ok) {
        console.error('[Midtrans Snap Error]', response.status, await response.text())
        return { ok: false, code: 'GATEWAY_ERROR', message: 'Gagal menghubungi server pembayaran Midtrans.', status: 502 }
      }

      const snap = await response.json()
      snapToken = snap.token || null
      redirectUrl = snap.redirect_url || null
    } catch (err) {
      console.error('[Midtrans Network Error]', err)
      return { ok: false, code: 'GATEWAY_ERROR', message: 'Terjadi gangguan koneksi ke server pembayaran.', status: 502 }
    }
  } else {
    snapToken = `mock-${orderId}`
    redirectUrl = `/dashboard?mock_payment=${orderId}`
  }

  // 5. Persist. The partial unique index allows only one pending payment per registration, so a
  // double-click race lands here with 23505: return the winner instead of failing.
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      registration_id: registrationId,
      provider: isMock ? 'mock' : 'midtrans',
      status: 'pending',
      amount,
      currency: 'IDR',
    })
    .select()
    .single()

  if (paymentError || !payment) {
    if (paymentError?.code === '23505') {
      const winner = await findLatestPayment(registrationId)
      const tx = latestTransaction(winner)
      if (winner && tx?.redirect_url) {
        return {
          ok: true,
          payment: winner as Payment,
          transaction: { orderId: tx.order_id, snapToken: tx.snap_token, redirectUrl: tx.redirect_url },
          isMock: winner.provider === 'mock',
          reused: true,
        }
      }
    }
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal membuat tagihan pembayaran.', status: 500 }
  }

  const { error: txError } = await supabase.from('midtrans_transactions').insert({
    payment_id: payment.id,
    order_id: orderId,
    snap_token: snapToken,
    redirect_url: redirectUrl,
    gross_amount: amount,
  })

  if (txError) {
    await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id)
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal menyimpan transaksi pembayaran.', status: 500 }
  }

  await recordAuditLog({
    userId,
    action: 'PAYMENT_SESSION_CREATED',
    targetTable: 'payments',
    recordId: payment.id,
    metadata: { orderId, amount, isMock, registrationId },
  })

  return {
    ok: true,
    payment: payment as Payment,
    transaction: { orderId, snapToken, redirectUrl },
    isMock,
    reused: false,
  }
}

// ─── Webhook / reconciliation (CMP-13, SEC-11, R-09) ───────────────────────────────────────────
export type MidtransNotificationPayload = {
  order_id: string
  status_code: string
  gross_amount: string
  signature_key: string
  transaction_status: string
  fraud_status?: string
  payment_type?: string
  settlement_time?: string
  transaction_time?: string
}

function mapStatus(transactionStatus: string, fraudStatus?: string): Payment['status'] {
  switch (transactionStatus) {
    case 'capture':
      return fraudStatus === 'challenge' ? 'pending' : 'paid'
    case 'settlement':
      return 'paid'
    case 'cancel':
    case 'deny':
      return 'failed'
    case 'expire':
      return 'expired'
    case 'refund':
    case 'partial_refund':
    case 'chargeback':
    case 'partial_chargeback':
      return 'refunded'
    default:
      return 'pending' // 'pending', 'authorize', unknown
  }
}

// A payment can only move forward: out-of-order or duplicate webhooks must never revive a paid
// payment or resurrect a refunded one.
function canTransition(from: Payment['status'], to: Payment['status']) {
  if (from === to) return false
  if (from === 'refunded') return false
  if (from === 'paid') return to === 'refunded'
  return true
}

export async function processMidtransNotification(payload: MidtransNotificationPayload) {
  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = payload

  if (!serverKey()) {
    return { ok: false as const, code: 'GATEWAY_NOT_CONFIGURED', message: 'Midtrans belum dikonfigurasi.', status: 503 }
  }

  // Authenticity: signature is the only proof the call came from Midtrans.
  if (!verifyMidtransSignature(order_id, status_code, gross_amount, signature_key)) {
    return { ok: false as const, code: 'INVALID_SIGNATURE', message: 'Tanda tangan Midtrans tidak valid.', status: 403 }
  }

  const supabase = createServiceClient()

  const { data: tx } = await supabase
    .from('midtrans_transactions')
    .select('id, payment_id, payments!inner(id, registration_id, status, amount)')
    .eq('order_id', order_id)
    .maybeSingle()

  if (!tx) {
    return { ok: false as const, code: 'TRANSACTION_NOT_FOUND', message: 'Transaksi tidak ditemukan.', status: 404 }
  }

  const payment = Array.isArray(tx.payments) ? tx.payments[0] : tx.payments

  // Integrity: the settled amount must equal what we billed server-side.
  if (Number(gross_amount) !== Number(payment.amount)) {
    console.error('[Midtrans Amount Mismatch]', { order_id, gross_amount, expected: payment.amount })
    return { ok: false as const, code: 'AMOUNT_MISMATCH', message: 'Nominal tidak sesuai.', status: 400 }
  }

  const nextStatus = mapStatus(transaction_status, fraud_status)
  const currentStatus = payment.status as Payment['status']

  if (canTransition(currentStatus, nextStatus)) {
    const update: Record<string, unknown> = { status: nextStatus }
    if (nextStatus === 'paid') update.paid_at = new Date().toISOString()
    if (nextStatus === 'expired') update.expired_at = new Date().toISOString()

    await supabase.from('payments').update(update).eq('id', payment.id)

    // NOTE: payment state is intentionally separate from registration verification (DECISIONS.md).
    await recordAuditLog({
      action: `PAYMENT_STATUS_${nextStatus.toUpperCase()}`,
      targetTable: 'payments',
      recordId: payment.id,
      metadata: { orderId: order_id, from: currentStatus, to: nextStatus, registrationId: payment.registration_id },
    })
  }

  await supabase
    .from('midtrans_transactions')
    .update({ transaction_status, fraud_status: fraud_status || null, raw_notification: payload })
    .eq('id', tx.id)

  // Always OK for valid duplicates so Midtrans stops retrying (idempotent).
  return { ok: true as const, status: canTransition(currentStatus, nextStatus) ? nextStatus : currentStatus }
}

// Pulls the authoritative status from Midtrans and applies it. Covers lost/late webhooks (R-09).
async function syncFromMidtrans(orderId: string) {
  if (!serverKey()) return
  try {
    const response = await fetch(statusApiUrl(orderId), {
      headers: { Accept: 'application/json', Authorization: basicAuth() },
      cache: 'no-store',
    })
    if (!response.ok) return
    const body = (await response.json()) as MidtransNotificationPayload
    if (body?.order_id === orderId && body.signature_key) {
      await processMidtransNotification(body)
    }
  } catch (err) {
    console.warn('[Midtrans Sync Error]', err)
  }
}

// ─── Status (CMP-12) ───────────────────────────────────────────────────────────────────────────
export async function getPaymentStatus(registrationId: string, userId: string, options: { sync?: boolean } = {}) {
  const access = await getRegistrationAccess(registrationId, userId)
  if (!access) return { found: false as const }

  let payment = await findLatestPayment(registrationId)
  if (!payment) return { found: true as const, payment: null, canPay: access.canPay }

  if (options.sync && payment.status === 'pending' && payment.provider === 'midtrans') {
    const tx = latestTransaction(payment)
    if (tx) {
      await syncFromMidtrans(tx.order_id)
      payment = (await findLatestPayment(registrationId)) || payment
    }
  }

  const tx = latestTransaction(payment)
  return {
    found: true as const,
    canPay: access.canPay,
    payment: {
      paymentId: payment.id as string,
      registrationId: payment.registration_id as string,
      provider: payment.provider as string,
      status: payment.status as Payment['status'],
      amount: payment.amount as number,
      currency: payment.currency as string,
      paidAt: (payment.paid_at as string | null) ?? null,
      orderId: tx?.order_id ?? null,
      redirectUrl: payment.status === 'pending' ? tx?.redirect_url ?? null : null,
      // failed / expired / cancelled can retry without re-entering the form (CMP-16).
      canRetry: access.canPay && ['failed', 'expired', 'cancelled'].includes(payment.status),
    },
  }
}

// ─── Dev-only: simulate settlement when no Midtrans key exists ────────────────────────────────
export async function mockSettlePayment(orderId: string, userId: string) {
  if (isProductionRuntime() || serverKey()) {
    return { ok: false as const, code: 'NOT_AVAILABLE' as const, message: 'Tidak tersedia.', status: 404 }
  }

  const supabase = createServiceClient()
  const { data: tx } = await supabase
    .from('midtrans_transactions')
    .select('payment_id, payments!inner(id, status, registration_id, provider)')
    .eq('order_id', orderId)
    .maybeSingle()

  const payment = tx ? (Array.isArray(tx.payments) ? tx.payments[0] : tx.payments) : null
  if (!payment || payment.provider !== 'mock') {
    return { ok: false as const, code: 'TRANSACTION_NOT_FOUND' as const, message: 'Transaksi tidak ditemukan.', status: 404 }
  }

  const access = await getRegistrationAccess(payment.registration_id, userId)
  if (!access?.canPay) {
    return { ok: false as const, code: 'TRANSACTION_NOT_FOUND' as const, message: 'Transaksi tidak ditemukan.', status: 404 }
  }

  if (payment.status === 'pending') {
    await supabase.from('payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', payment.id)
    await supabase.from('midtrans_transactions').update({ transaction_status: 'settlement' }).eq('order_id', orderId)
  }

  return { ok: true as const }
}
