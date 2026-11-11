import { createServiceClient } from '@/lib/supabase/server'
import { type VisitorTicket } from '@/lib/types/database'
import { recordAuditLog } from '@/lib/audit'

export type CheckInResult =
  | {
      ok: true
      ticket: VisitorTicket
      profile: { full_name: string; email: string; institution?: string | null }
      alreadyCheckedIn: boolean
      checkInTime: string
    }
  | {
      ok: false
      code: 'TICKET_NOT_FOUND' | 'INVALID_INPUT' | 'DATABASE_ERROR' | 'ALREADY_CHECKED_IN'
      message: string
    }

export async function processGateCheckIn(params: {
  qrCode: string
  staffUserId?: string
  gateName?: string
  checkInType?: 'staff_scan' | 'self_scan' | 'manual_lookup'
}): Promise<CheckInResult> {
  const { qrCode, staffUserId, gateName = 'main_gate', checkInType = 'staff_scan' } = params

  if (!qrCode || typeof qrCode !== 'string') {
    return { ok: false, code: 'INVALID_INPUT', message: 'Kode QR tidak valid.' }
  }

  const supabase = createServiceClient()

  // 1. Fetch ticket and user profile
  const { data: ticket, error: ticketError } = await supabase
    .from('visitor_tickets')
    .select('id, user_id, qr_code, ticket_type, checked_in, checked_in_at, checked_in_by, profiles(full_name, email, institution)')
    .eq('qr_code', qrCode.trim())
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

  // 3. Atomically update ticket
  const { error: updateError } = await supabase
    .from('visitor_tickets')
    .update({
      checked_in: true,
      checked_in_at: now,
      checked_in_by: staffUserId || null,
    })
    .eq('id', ticket.id)
    .eq('checked_in', false)

  if (updateError) {
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal memperbarui status kehadiran.' }
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

export async function searchVisitorsManual(query: string) {
  if (!query || query.trim().length < 2) {
    return []
  }

  const supabase = createServiceClient()
  const cleanQuery = query.trim().toLowerCase()

  const { data, error } = await supabase
    .from('visitor_tickets')
    .select('id, user_id, qr_code, ticket_type, checked_in, checked_in_at, checked_in_by, profiles!inner(id, full_name, email, institution, phone)')
    .or(`email.ilike.%${cleanQuery}%,full_name.ilike.%${cleanQuery}%`, { referencedTable: 'profiles' })
    .limit(20)

  if (error || !data) {
    return []
  }

  return data.map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      ticketId: row.id,
      userId: row.user_id,
      qrCode: row.qr_code,
      checkedIn: row.checked_in,
      checkedInAt: row.checked_in_at,
      fullName: profile?.full_name || '',
      email: profile?.email || '',
      institution: profile?.institution || '',
      phone: profile?.phone || '',
    }
  })
}
