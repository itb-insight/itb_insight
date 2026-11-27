import 'server-only'

import { randomUUID } from 'node:crypto'

import { type BoothAccess, planBoothAward, type AwardPlan, type BoothPointOption, type GivenOptions, type PointsBooth } from '@/lib/booth-points'
import { findBoothInScope } from '@/lib/booth-roster'
import { parseVisitorQr } from '@/lib/qr'
import { createServiceClient } from '@/lib/supabase/server'
import { type ProfileRoleA } from '@/lib/types/database'

/*
  Practice run of a booth points scan (rules: src/lib/booth-points.ts). Resolves everything a real
  award needs (booth access, the visitor behind the QR, which options are left) and writes no
  points. The route records an audit row so a scan can be confirmed server-side.
*/

export type ScanVisitor = {
  /** profiles.id: the scanner keys what was given in this session by it. */
  key: string
  fullName: string
  institution: string | null
}

/** Things that would block or change a live award; shown, not enforced, while practising. */
export type ScanNote = 'committee_account' | 'own_account'

export type ScanLookup = {
  practice: true
  booth: PointsBooth
  visitor: ScanVisitor
  notes: ScanNote[]
}

export type ScanAward = ScanLookup & {
  plan: AwardPlan
  /** Server time the scan arrived: the "signal received" proof shown to staff. */
  receivedAt: string
  /** Short id that is also in the audit row's metadata. */
  reference: string
}

export type ScanError = {
  ok: false
  code: 'INVALID_QR' | 'BOOTH_NOT_ALLOWED' | 'TICKET_NOT_FOUND' | 'ALREADY_GIVEN' | 'DATABASE_ERROR'
  message: string
  status: 400 | 403 | 404 | 409 | 500
}

export type ScanParams = {
  staffUserId: string
  access: BoothAccess
  qrCode: string
  boothId: string
  option?: BoothPointOption
  /** Practice only: what this browser already gave the visitor at this booth. */
  given: GivenOptions
}

export async function runPracticeScan(params: ScanParams): Promise<({ ok: true } & (ScanLookup | ScanAward)) | ScanError> {
  const token = parseVisitorQr(params.qrCode)
  if (!token) {
    return { ok: false, code: 'INVALID_QR', message: 'QR ini bukan QR profil pengunjung ITB Insight.', status: 400 }
  }

  let booth: PointsBooth | null
  try {
    booth = await findBoothInScope(params.access.scope, params.boothId)
  } catch (err) {
    console.error('[booth-practice] booth lookup failed', err)
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal membaca data booth.', status: 500 }
  }
  if (!booth) {
    return { ok: false, code: 'BOOTH_NOT_ALLOWED', message: 'Anda tidak punya akses ke booth ini.', status: 403 }
  }

  const { data: ticket, error } = await createServiceClient()
    .from('visitor_tickets')
    .select('user_id, profiles!visitor_tickets_user_id_fkey(full_name, institution, role_a)')
    .eq('qr_code', token)
    .maybeSingle()

  if (error) {
    console.error('[booth-practice] ticket lookup failed', error)
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal mencari data pengunjung.', status: 500 }
  }
  if (!ticket) {
    return {
      ok: false,
      code: 'TICKET_NOT_FOUND',
      message: 'Pengunjung tidak ditemukan. Minta pengunjung memuat ulang QR di profilnya.',
      status: 404,
    }
  }

  const profile = (Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles) as {
    full_name?: string | null
    institution?: string | null
    role_a?: ProfileRoleA | null
  } | null

  const notes: ScanNote[] = []
  if (profile?.role_a) notes.push('committee_account')
  if (ticket.user_id === params.staffUserId) notes.push('own_account')

  const lookup: ScanLookup = {
    practice: true,
    booth,
    visitor: {
      key: ticket.user_id as string,
      fullName: profile?.full_name?.trim() || 'Pengunjung',
      institution: profile?.institution?.trim() || null,
    },
    notes,
  }

  if (!params.option) return { ok: true, ...lookup }

  const plan = planBoothAward(params.given, params.option, booth)
  if (!plan) {
    return {
      ok: false,
      code: 'ALREADY_GIVEN',
      message:
        params.option === 'contribution'
          ? 'Contribution untuk pengunjung ini di booth ini sudah diberikan.'
          : 'Bonus untuk pengunjung ini di booth ini sudah diberikan.',
      status: 409,
    }
  }

  return {
    ok: true,
    ...lookup,
    plan,
    receivedAt: new Date().toISOString(),
    reference: randomUUID().slice(0, 8),
  }
}
