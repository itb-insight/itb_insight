import 'server-only'

import { createServiceClient } from '@/lib/supabase/server'
import { type GateCheckIn, type VisitorTicket } from '@/lib/types/database'
import { recordAuditLog } from '@/lib/audit'
import { ilikeAnyFilter, stripFilterSyntax } from '@/lib/postgrest'
import { parseVisitorQr } from '@/lib/qr'
import { markEnteredGate, markVisitedItb } from '@/lib/visit-flags'

export type CheckInResult =
  | {
      ok: true
      ticket: VisitorTicket
      profile: { full_name: string; email: string; institution?: string | null }
      alreadyCheckedIn: boolean
      checkInTime: string
      /**
       * True when this check-in set the visitor's profile flag (0026) for the first time:
       * entered_gate for a staff scan / manual lookup, visited_itb for a geofenced self check-in.
       */
      firstVisitFlag: boolean
    }
  | {
      ok: false
      code: 'TICKET_NOT_FOUND' | 'INVALID_INPUT' | 'DATABASE_ERROR' | 'ALREADY_CHECKED_IN'
      message: string
    }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type CheckInParams = Parameters<typeof checkInTicket>[0]

/**
 * Gate check-in: marks the ticket checked in (once) and sets the visitor's profile flag (0026),
 * which stays true even if the ticket was already checked in some other way:
 *   staff_scan / manual_lookup -> entered_gate;  self_scan (inside the geofence) -> visited_itb.
 */
export async function processGateCheckIn(params: CheckInParams): Promise<CheckInResult> {
  const result = await checkInTicket(params)
  if (!result.ok) return result

  const type = params.checkInType ?? 'staff_scan'
  const mark = type === 'self_scan' ? markVisitedItb : type === 'staff_scan' || type === 'manual_lookup' ? markEnteredGate : null
  const firstVisitFlag = mark
    ? await mark(result.ticket.user_id).catch((error) => {
        console.error('[Check-In] visit flag failed:', error instanceof Error ? error.message : 'unknown')
        return false
      })
    : false
  return { ...result, firstVisitFlag }
}

type TicketCheckIn = Exclude<CheckInResult, { ok: true }> | (Omit<Extract<CheckInResult, { ok: true }>, 'firstVisitFlag'>)

async function checkInTicket(params: {
  /** The visitor's QR payload (scans). Exactly one of qrCode / ticketId. */
  qrCode?: string
  /** visitor_tickets.id, for manual desk check-in after a name/email search. */
  ticketId?: string
  staffUserId?: string
  gateName?: string
  checkInType?: GateCheckIn['check_in_type']
}): Promise<TicketCheckIn> {
  const { qrCode, ticketId, staffUserId, gateName = 'main_gate', checkInType = 'staff_scan' } = params

  const lookup = ticketId !== undefined ? (UUID.test(ticketId) ? { column: 'id', value: ticketId } : null) : null
  const token = lookup ? null : parseVisitorQr(qrCode)
  if (!lookup && !token) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Kode QR tidak valid.' }
  }

  const supabase = createServiceClient()

  // 1. Fetch ticket and user profile
  const { data: ticket, error: ticketError } = await supabase
    .from('visitor_tickets')
    .select('id, user_id, qr_code, ticket_type, checked_in, checked_in_at, checked_in_by, profiles!visitor_tickets_user_id_fkey(full_name, email, institution)')
    .eq(lookup ? lookup.column : 'qr_code', lookup ? lookup.value : token)
    .maybeSingle()

  if (ticketError || !ticket) {
    return { ok: false, code: 'TICKET_NOT_FOUND', message: 'Tiket tidak ditemukan atau kode QR salah.' }
  }

  const profile = Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles
  const profileData = {
    full_name: profile?.full_name || 'Pengunjung',
    email: profile?.email || '',
    institution: profile?.institution || null,
  }

  // 2. Double-count protection (QRS-07)
  if (ticket.checked_in) {
    return {
      ok: true,
      ticket: {
        id: ticket.id,
        user_id: ticket.user_id,
        qr_code: ticket.qr_code,
        ticket_type: ticket.ticket_type,
        checked_in: true,
        checked_in_at: ticket.checked_in_at,
        checked_in_by: ticket.checked_in_by,
        created_at: '',
        updated_at: '',
      },
      profile: profileData,
      alreadyCheckedIn: true,
      checkInTime: ticket.checked_in_at || new Date().toISOString(),
    }
  }

  const now = new Date().toISOString()

  // 3. Atomically update ticket. Only the request whose update flips the row counts as the
  // check-in; a concurrent scan that loses the race reports "already checked in".
  const { data: flipped, error: updateError } = await supabase
    .from('visitor_tickets')
    .update({
      checked_in: true,
      checked_in_at: now,
      checked_in_by: staffUserId || null,
    })
    .eq('id', ticket.id)
    .eq('checked_in', false)
    .select('id')

  if (updateError) {
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal memperbarui status kehadiran.' }
  }

  if (!Array.isArray(flipped) || flipped.length === 0) {
    return {
      ok: true,
      ticket: {
        id: ticket.id,
        user_id: ticket.user_id,
        qr_code: ticket.qr_code,
        ticket_type: ticket.ticket_type,
        checked_in: true,
        checked_in_at: now,
        checked_in_by: null,
        created_at: '',
        updated_at: '',
      },
      profile: profileData,
      alreadyCheckedIn: true,
      checkInTime: now,
    }
  }

  // 4. Record gate check-in entry
  await supabase.from('gate_check_ins').insert({
    ticket_id: ticket.id,
    user_id: ticket.user_id,
    checked_in_by: staffUserId || null,
    gate_name: gateName,
    check_in_type: checkInType,
    checked_in_at: now,
  })

  // 5. Audit log
  await recordAuditLog({
    userId: staffUserId || ticket.user_id,
    action: `GATE_CHECK_IN_${checkInType.toUpperCase()}`,
    targetTable: 'visitor_tickets',
    recordId: ticket.id,
    metadata: { gateName, visitorEmail: profileData.email },
  })

  return {
    ok: true,
    ticket: {
      id: ticket.id,
      user_id: ticket.user_id,
      qr_code: ticket.qr_code,
      ticket_type: ticket.ticket_type,
      checked_in: true,
      checked_in_at: now,
      checked_in_by: staffUserId || null,
      created_at: '',
      updated_at: now,
    },
    profile: profileData,
    alreadyCheckedIn: false,
    checkInTime: now,
  }
}

/** Shows only the last 4 digits, enough for staff to confirm "is this your number?". */
export function maskPhone(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '')
  return digits.length >= 4 ? `•••• ${digits.slice(-4)}` : ''
}

// Manual desk lookup by name or email. Returns the ticket id for check-in, never the QR token
// (which would let staff award booth points without the visitor present) or the full phone.
export async function searchVisitorsManual(query: string) {
  const term = stripFilterSyntax(query ?? '').slice(0, 64)
  if (term.length < 2) {
    return []
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('visitor_tickets')
    .select('id, user_id, checked_in, checked_in_at, profiles!visitor_tickets_user_id_fkey!inner(id, full_name, email, institution, phone)')
    .or(ilikeAnyFilter(['email', 'full_name'], term), { referencedTable: 'profiles' })
    .limit(20)

  if (error || !data) {
    return []
  }

  return data.map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      ticketId: row.id,
      userId: row.user_id,
      checkedIn: row.checked_in,
      checkedInAt: row.checked_in_at,
      fullName: profile?.full_name || '',
      email: profile?.email || '',
      institution: profile?.institution || '',
      phoneHint: maskPhone(profile?.phone),
    }
  })
}
