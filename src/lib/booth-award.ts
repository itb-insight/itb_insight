import 'server-only'

import { adminEmailList } from '@/lib/admin'
import { type AwardPlan, type BoothAccess, type BoothPointOption, type PointsBooth } from '@/lib/booth-points'
import { findBoothInScope } from '@/lib/booth-roster'
import { UUID_PATTERN } from '@/lib/input'
import { parseVisitorQr } from '@/lib/qr'
import { createServiceClient } from '@/lib/supabase/server'

/*
  Live booth award (Insight Arcade, rules: src/lib/booth-points.ts). The database decides:
  public.arcade_award_booth (migrations 0030, 0036, 0040) gives Contribution once and Bonus once per
  visitor per booth under a lock, inside the game window (an offline-queued award counts at its
  capture time), never to the scanner themself (committee accounts may
  play since 0036; the leaderboard leaves them out), and writes a replayed client_ref only once. This module resolves the visitor behind the
  QR, checks the booth is in the scanner's scope, and translates the result for the scanner.
*/

export type ScanVisitor = {
  /** profiles.id */
  key: string
  fullName: string
  institution: string | null
}

export type BoothGiven = { contribution: boolean; bonus: boolean }

export type ScanLookup = { booth: PointsBooth; visitor: ScanVisitor; given: BoothGiven }

export type ScanAward = ScanLookup & {
  plan: AwardPlan
  /** Server time the award was recorded. */
  receivedAt: string
  /** Short id of the written row, also in the audit log. */
  reference: string
  /** The same client_ref was already written (retry / replay): nothing new was added. */
  duplicate: boolean
}

export type ScanErrorCode =
  | 'INVALID_QR'
  | 'BOOTH_NOT_ALLOWED'
  | 'TICKET_NOT_FOUND'
  | 'SELF_AWARD'
  | 'COMMITTEE_ACCOUNT'
  | 'ALREADY_GIVEN'
  | 'NO_BONUS'
  | 'NOT_OPEN'
  | 'CLOSED'
  | 'PAUSED'
  | 'TOO_OLD'
  | 'INVALID_INPUT'
  | 'DATABASE_ERROR'

export type ScanError = { ok: false; code: ScanErrorCode; message: string; status: 400 | 403 | 404 | 409 | 423 | 500; given?: BoothGiven }

export type ScanParams = {
  staffUserId: string
  access: BoothAccess
  qrCode: string
  boothId: string
  option?: BoothPointOption
  /** Idempotency key from the scanner (one per award attempt, reused on retry). */
  clientRef?: string
  /** When the scan was captured, for an award sent later from the offline queue (validated ISO). */
  capturedAt?: string
}

const MESSAGES: Record<Exclude<ScanErrorCode, 'NOT_OPEN' | 'CLOSED'>, string> = {
  INVALID_QR: 'QR ini bukan QR profil pengunjung ITB Insight.',
  BOOTH_NOT_ALLOWED: 'Anda tidak punya akses ke booth ini.',
  TICKET_NOT_FOUND: 'Pengunjung tidak ditemukan. Minta pengunjung memuat ulang QR di profilnya.',
  SELF_AWARD: 'Ini akunmu sendiri. Kamu tidak bisa memberi poin ke akun sendiri.',
  COMMITTEE_ACCOUNT: 'Ini akun panitia. Akun panitia tidak bisa menerima poin Insight Arcade.',
  ALREADY_GIVEN: 'Pilihan ini sudah diberikan ke pengunjung ini di booth ini.',
  NO_BONUS: 'Booth ini tidak punya Bonus.',
  PAUSED: 'Insight Arcade sedang dijeda panitia. Catat di log kertas dan coba lagi nanti.',
  TOO_OLD: 'Scan ini terlalu lama tertunda dan tidak bisa dikirim lagi.',
  INVALID_INPUT: 'Data scan tidak valid.',
  DATABASE_ERROR: 'Gagal menyimpan poin. Coba lagi.',
}

const STATUS: Record<ScanErrorCode, ScanError['status']> = {
  INVALID_QR: 400,
  BOOTH_NOT_ALLOWED: 403,
  TICKET_NOT_FOUND: 404,
  SELF_AWARD: 403,
  COMMITTEE_ACCOUNT: 403,
  ALREADY_GIVEN: 409,
  NO_BONUS: 400,
  NOT_OPEN: 403,
  CLOSED: 403,
  PAUSED: 423,
  TOO_OLD: 400,
  INVALID_INPUT: 400,
  DATABASE_ERROR: 500,
}

function wib(iso: unknown): string {
  if (typeof iso !== 'string') return ''
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
    .format(new Date(iso))
    .replace('.', ':')
}

function fail(code: ScanErrorCode, extra?: { given?: BoothGiven; opensAt?: unknown; freezesAt?: unknown }): ScanError {
  let message: string
  if (code === 'NOT_OPEN') message = `Insight Arcade belum dibuka${extra?.opensAt ? ` (mulai ${wib(extra.opensAt)} WIB)` : ''}.`
  else if (code === 'CLOSED') message = `Insight Arcade sudah ditutup${extra?.freezesAt ? ` (${wib(extra.freezesAt)} WIB)` : ''}.`
  else message = MESSAGES[code]
  return { ok: false, code, message, status: STATUS[code], ...(extra?.given ? { given: extra.given } : {}) }
}

/** What this visitor already has at this booth (counted rows only). */
async function loadGiven(userId: string, boothId: string): Promise<BoothGiven> {
  const { data, error } = await createServiceClient()
    .from('booth_scan_events')
    .select('kind, bonus_points')
    .eq('user_id', userId)
    .eq('booth_id', boothId)
  if (error) throw new Error(`booth_scan_events: ${error.message}`)
  const rows = (data ?? []) as Array<{ kind: string; bonus_points: number }>
  return {
    contribution: rows.some((row) => row.kind === 'visit'),
    bonus: rows.some((row) => (row.bonus_points ?? 0) > 0),
  }
}

export async function runBoothScan(params: ScanParams): Promise<({ ok: true } & (ScanLookup | ScanAward)) | ScanError> {
  const token = parseVisitorQr(params.qrCode)
  if (!token) return fail('INVALID_QR')
  if (params.clientRef !== undefined && !UUID_PATTERN.test(params.clientRef)) return fail('INVALID_INPUT')

  let booth: PointsBooth | null
  try {
    booth = await findBoothInScope(params.access.scope, params.boothId)
  } catch (err) {
    console.error('[booth-award] booth lookup failed', err)
    return fail('DATABASE_ERROR')
  }
  if (!booth) return fail('BOOTH_NOT_ALLOWED')

  const supabase = createServiceClient()
  const { data: ticket, error } = await supabase
    .from('visitor_tickets')
    .select('user_id, profiles!visitor_tickets_user_id_fkey(full_name, institution)')
    .eq('qr_code', token)
    .maybeSingle()
  if (error) {
    console.error('[booth-award] ticket lookup failed', error)
    return fail('DATABASE_ERROR')
  }
  if (!ticket) return fail('TICKET_NOT_FOUND')

  const visitorId = ticket.user_id as string
  if (visitorId === params.staffUserId) return fail('SELF_AWARD')

  // Committee / staff accounts may play (to test the game); they earn points but the leaderboard
  // leaves them out, so they never rank or win (migration 0036).
  const adminEmails = adminEmailList()

  const profile = (Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles) as {
    full_name?: string | null
    institution?: string | null
  } | null
  const visitor: ScanVisitor = {
    key: visitorId,
    fullName: profile?.full_name?.trim() || 'Pengunjung',
    institution: profile?.institution?.trim() || null,
  }

  if (!params.option) {
    try {
      return { ok: true, booth, visitor, given: await loadGiven(visitorId, booth.id) }
    } catch (err) {
      console.error('[booth-award] given lookup failed', err)
      return fail('DATABASE_ERROR')
    }
  }

  const { data: result, error: awardError } = await supabase.rpc('arcade_award_booth', {
    p_user: visitorId,
    p_booth: booth.id,
    p_option: params.option,
    p_awarded_by: params.staffUserId,
    p_client_ref: params.clientRef ?? null,
    p_captured_at: params.capturedAt ?? null,
    p_admin_emails: adminEmails,
  })
  if (awardError) {
    const message = awardError.message ?? ''
    if (message.includes('ARCADE_PAUSED')) return fail('PAUSED')
    if (message.includes('ARCADE_CLOSED')) return fail('CLOSED')
    console.error('[booth-award] award failed', awardError)
    return fail('DATABASE_ERROR')
  }

  const award = (result ?? {}) as {
    ok?: boolean
    code?: string
    id?: string
    contribution?: number
    bonus?: number
    total?: number
    given?: BoothGiven
    opensAt?: string
    freezesAt?: string
  }
  if (!award.ok) {
    const code = (award.code ?? 'DATABASE_ERROR') as ScanErrorCode
    return fail(code in STATUS ? code : 'DATABASE_ERROR', { given: award.given, opensAt: award.opensAt, freezesAt: award.freezesAt })
  }

  const contribution = award.contribution ?? 0
  const bonus = award.bonus ?? 0
  return {
    ok: true,
    booth,
    visitor,
    given: award.given ?? { contribution: true, bonus: params.option === 'bonus' },
    plan: { option: params.option, contribution, bonus, total: award.total ?? contribution + bonus },
    receivedAt: new Date().toISOString(),
    reference: (award.id ?? params.clientRef ?? '').slice(0, 8),
    duplicate: award.code === 'DUPLICATE',
  }
}
