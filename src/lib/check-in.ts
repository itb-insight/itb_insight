import { createServiceClient } from '@/lib/supabase/server'
import { type VisitorTicket } from '@/lib/types/database'
import { recordAuditLog } from '@/lib/audit'
import { ensureVisitorTicket } from '@/lib/tickets'
import { isInsideGaneshaCampus, isUuid } from '@/lib/booths'

export type CheckInResult =
  | {
      ok: true
      ticket: VisitorTicket
      profile: { full_name: string; email: string; institution?: string | null }
      alreadyCheckedIn: boolean
      gateConfirmed: boolean
      isTutorialScan: boolean
      tutorialMessage: string
      checkInTime: string
    }
  | {
      ok: false
      code: 'TICKET_NOT_FOUND' | 'INVALID_INPUT' | 'DATABASE_ERROR' | 'ALREADY_CHECKED_IN'
      message: string
    }

/**
 * Gate Staff QR Scan / Manual Lookup handler (aligned with docs/QR-FEATURES.md).
 *
 * Per docs/QR-FEATURES.md:
 * - Attendance (entry and exit for live visitor count) is tracked automatically when a user
 *   steps inside/outside the premises of ITB Ganesha Campus.
 * - Scanning a visitor's Personal QR by Gate Staff confirms entry through an assigned gate
 *   and serves as a TUTORIAL to new visitors on how their Personal Profile QR works.
 * - Accepts both `visitor_tickets.qr_code` and `profiles.id` (`user_id` UUID from AccountQrCard/ProfileCard).
 */
export async function processGateCheckIn(params: {
  qrCode: string
  staffUserId?: string
  gateName?: string
  checkInType?: 'staff_scan' | 'self_scan' | 'manual_lookup'
}): Promise<CheckInResult> {
  const { qrCode, staffUserId, gateName = 'main_gate', checkInType = 'staff_scan' } = params

  if (!qrCode || typeof qrCode !== 'string' || !qrCode.trim()) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Kode QR tidak valid.' }
  }

  const cleanQr = qrCode.trim()
  const supabase = createServiceClient()

  // 1. Fetch ticket by qr_code, or resolve by user_id UUID if AccountQrCard / ProfileCard UUID was scanned
  let { data: ticket, error: ticketError } = await supabase
    .from('visitor_tickets')
    .select('id, user_id, qr_code, ticket_type, checked_in, checked_in_at, checked_in_by, profiles(full_name, email, institution)')
    .eq('qr_code', cleanQr)
    .maybeSingle()

  if ((!ticket || ticketError) && isUuid(cleanQr)) {
    const ensured = await ensureVisitorTicket(cleanQr, supabase)
    if (ensured.ok && ensured.ticket) {
      const { data: byUser } = await supabase
        .from('visitor_tickets')
        .select('id, user_id, qr_code, ticket_type, checked_in, checked_in_at, checked_in_by, profiles(full_name, email, institution)')
        .eq('id', ensured.ticket.id)
        .maybeSingle()
      ticket = byUser
      ticketError = null
    }
  }

  if (ticketError || !ticket) {
    return { ok: false, code: 'TICKET_NOT_FOUND', message: 'Tiket tidak ditemukan atau kode QR salah.' }
  }

  const profile = Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles
  const profileData = {
    full_name: profile?.full_name || 'Pengunjung',
    email: profile?.email || '',
    institution: profile?.institution || null,
  }

  const tutorialMessage =
    'Tutorial Personal QR berhasil! Gunakan QR profil yang sama ini di setiap booth untuk mengumpulkan poin.'

  // 2. Check if already scanned at a gate by staff (double-count protection QRS-07)
  // Note: If the user was marked `checked_in` automatically by Campus Geo-fencing, a Gate Staff scan
  // still records the assigned gate confirmation and tutorial demonstration once.
  const { data: existingGateScans } = await supabase
    .from('gate_check_ins')
    .select('id, check_in_type, checked_in_at')
    .eq('ticket_id', ticket.id)
    .in('check_in_type', ['staff_scan', 'manual_lookup'])
    .limit(1)

  const alreadyConfirmedAtGate = Boolean(existingGateScans && existingGateScans.length > 0)

  if (ticket.checked_in && (alreadyConfirmedAtGate || checkInType === 'self_scan')) {
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
        gate_confirmed: true,
        is_on_campus: true,
        created_at: '',
        updated_at: '',
      },
      profile: profileData,
      alreadyCheckedIn: true,
      gateConfirmed: true,
      isTutorialScan: checkInType === 'staff_scan',
      tutorialMessage,
      checkInTime: ticket.checked_in_at || new Date().toISOString(),
    }
  }

  const now = new Date().toISOString()
  const wasAlreadyAttending = Boolean(ticket.checked_in)

  // 3. Update ticket attendance & gate confirmation (with fallback for pre-0009 schema)
  const { error: extUpdateError } = await supabase
    .from('visitor_tickets')
    .update({
      checked_in: true,
      checked_in_at: ticket.checked_in_at || now,
      checked_in_by: staffUserId || ticket.checked_in_by || null,
      is_on_campus: true,
      last_entered_at: now,
      gate_confirmed: checkInType === 'staff_scan' || checkInType === 'manual_lookup',
    })
    .eq('id', ticket.id)

  if (extUpdateError) {
    const { error: baseUpdateError } = await supabase
      .from('visitor_tickets')
      .update({
        checked_in: true,
        checked_in_at: ticket.checked_in_at || now,
        checked_in_by: staffUserId || ticket.checked_in_by || null,
      })
      .eq('id', ticket.id)

    if (baseUpdateError) {
      return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal memperbarui status kehadiran.' }
    }
  }

  // 4. Record gate check-in / tutorial scan entry
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
    metadata: {
      gateName,
      visitorEmail: profileData.email,
      isTutorialScan: checkInType === 'staff_scan',
      wasAlreadyAttendingViaGeofence: wasAlreadyAttending,
    },
  })

  return {
    ok: true,
    ticket: {
      id: ticket.id,
      user_id: ticket.user_id,
      qr_code: ticket.qr_code,
      ticket_type: ticket.ticket_type,
      checked_in: true,
      checked_in_at: ticket.checked_in_at || now,
      checked_in_by: staffUserId || ticket.checked_in_by || null,
      gate_confirmed: checkInType === 'staff_scan' || checkInType === 'manual_lookup',
      is_on_campus: true,
      created_at: '',
      updated_at: now,
    },
    profile: profileData,
    alreadyCheckedIn: wasAlreadyAttending,
    gateConfirmed: true,
    isTutorialScan: checkInType === 'staff_scan',
    tutorialMessage,
    checkInTime: ticket.checked_in_at || now,
  }
}

export type CampusGeoAttendanceResult =
  | {
      ok: true
      event: 'enter' | 'exit'
      attending: boolean
      isOnCampus: boolean
      alreadyCheckedIn: boolean
      timestamp: string
      ticket: VisitorTicket
    }
  | {
      ok: false
      code: 'TICKET_ERROR' | 'OUTSIDE_CAMPUS_PREMISES' | 'DATABASE_ERROR'
      message: string
    }

/**
 * Automatic ITB Ganesha Campus Geo-Fence Attendance & Exit tracker (docs/QR-FEATURES.md).
 * - If a user steps inside the premises of ITB Ganesha Campus, they are instantly marked as "attending" (`isOnCampus: true`).
 * - When a user exits the premises, their exit is noted (`isOnCampus: false`) so live visitor count stays accurate.
 */
export async function processCampusGeoAttendance(params: {
  userId: string
  event?: 'enter' | 'exit'
  latitude?: number | null
  longitude?: number | null
  gateName?: string
}): Promise<CampusGeoAttendanceResult> {
  const { userId, event, latitude, longitude, gateName = 'ganesha_geofence' } = params
  const supabase = createServiceClient()

  const ticketResult = await ensureVisitorTicket(userId, supabase)
  if (!ticketResult.ok || !ticketResult.ticket) {
    return {
      ok: false,
      code: 'TICKET_ERROR',
      message: 'Gagal menyiapkan tiket kehadiran untuk akun Anda.',
    }
  }

  const ticket = ticketResult.ticket
  const now = new Date().toISOString()

  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)

  const resolvedEvent: 'enter' | 'exit' = event
    ? event
    : hasCoords
      ? isInsideGaneshaCampus(latitude!, longitude!)
        ? 'enter'
        : 'exit'
      : 'enter'

  if (resolvedEvent === 'exit') {
    await supabase
      .from('visitor_tickets')
      .update({
        is_on_campus: false,
        last_exited_at: now,
        current_booth_id: null,
      })
      .eq('id', ticket.id)
      .then(() => undefined, () => undefined)

    await recordAuditLog({
      userId,
      action: 'CAMPUS_GEOFENCE_EXIT',
      targetTable: 'visitor_tickets',
      recordId: ticket.id,
      metadata: { gateName, latitude: latitude ?? null, longitude: longitude ?? null },
    })

    return {
      ok: true,
      event: 'exit',
      attending: Boolean(ticket.checked_in),
      isOnCampus: false,
      alreadyCheckedIn: Boolean(ticket.checked_in),
      timestamp: now,
      ticket: {
        ...ticket,
        ticket_type: 'general_gate',
        is_on_campus: false,
        last_exited_at: now,
        created_at: '',
        updated_at: now,
      },
    }
  }

  // Event === 'enter': user stepped inside ITB Ganesha Campus -> instantly marked as attending
  const wasAlreadyCheckedIn = Boolean(ticket.checked_in)
  const checkInAt = ticket.checked_in_at || now

  const { error: extError } = await supabase
    .from('visitor_tickets')
    .update({
      checked_in: true,
      checked_in_at: checkInAt,
      checked_in_by: ticket.checked_in_by || userId,
      is_on_campus: true,
      last_entered_at: now,
    })
    .eq('id', ticket.id)

  if (extError) {
    const { error: baseError } = await supabase
      .from('visitor_tickets')
      .update({
        checked_in: true,
        checked_in_at: checkInAt,
        checked_in_by: ticket.checked_in_by || userId,
      })
      .eq('id', ticket.id)

    if (baseError) {
      return {
        ok: false,
        code: 'DATABASE_ERROR',
        message: 'Gagal memperbarui status kehadiran kampus.',
      }
    }
  }

  if (!wasAlreadyCheckedIn) {
    await supabase
      .from('gate_check_ins')
      .insert({
        ticket_id: ticket.id,
        user_id: userId,
        checked_in_by: userId,
        gate_name: gateName,
        check_in_type: 'self_scan',
        checked_in_at: now,
      })
      .then(() => undefined, () => undefined)
  }

  await recordAuditLog({
    userId,
    action: 'CAMPUS_GEOFENCE_ENTER',
    targetTable: 'visitor_tickets',
    recordId: ticket.id,
    metadata: {
      gateName,
      alreadyCheckedIn: wasAlreadyCheckedIn,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    },
  })

  return {
    ok: true,
    event: 'enter',
    attending: true,
    isOnCampus: true,
    alreadyCheckedIn: wasAlreadyCheckedIn,
    timestamp: checkInAt,
    ticket: {
      ...ticket,
      ticket_type: 'general_gate',
      checked_in: true,
      checked_in_at: checkInAt,
      is_on_campus: true,
      last_entered_at: now,
      created_at: '',
      updated_at: now,
    },
  }
}

/**
 * Returns both cumulative attendance and the live visitor count (accounting for exits).
 */
export async function getLiveVisitorStats() {
  const supabase = createServiceClient()

  const { data: tickets, error } = await supabase.from('visitor_tickets').select('*')

  if (error || !tickets) {
    return {
      totalTickets: 0,
      checkedIn: 0,
      liveVisitorCount: 0,
      gateConfirmedCount: 0,
    }
  }

  const totalTickets = tickets.length
  let checkedIn = 0
  let liveVisitorCount = 0
  let gateConfirmedCount = 0

  for (const t of tickets) {
    const row = t as Record<string, unknown>
    const isCheckedIn = Boolean(t.checked_in)
    if (isCheckedIn) {
      checkedIn += 1
    }

    // If `is_on_campus` column exists, use it; otherwise default to `checked_in`
    const isOnCampus =
      typeof row.is_on_campus === 'boolean' ? row.is_on_campus : isCheckedIn
    if (isOnCampus) {
      liveVisitorCount += 1
    }

    if (row.gate_confirmed === true) {
      gateConfirmedCount += 1
    }
  }

  return {
    totalTickets,
    checkedIn,
    liveVisitorCount,
    gateConfirmedCount,
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
