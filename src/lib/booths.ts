// Server-side data layer for booths. Points are awarded by booth staff scanning the
// visitor's personal QR (docs/QR-FEATURES.md).

import 'server-only'

import { recordAuditLog } from '@/lib/audit'
import { processGateCheckIn } from '@/lib/check-in'
import { parseVisitorQr } from '@/lib/qr'
import { createServiceClient } from '@/lib/supabase/server'
import { type Booth, type UserRole } from '@/lib/types/database'

export async function getActiveBooths(category?: string): Promise<Booth[]> {
  const supabase = createServiceClient()
  let query = supabase
    .from('booths')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error || !data) {
    return []
  }

  return data as Booth[]
}

type Visitor = {
  userId: string
  fullName: string
  institution: string | null
}

type AwardError = {
  ok: false
  code:
    | 'INVALID_QR'
    | 'TICKET_NOT_FOUND'
    | 'BOOTH_NOT_FOUND'
    | 'BOOTH_NOT_ASSIGNED'
    | 'BOOTH_AMBIGUOUS'
    | 'INVALID_BONUS'
    | 'INVALID_POINTS'
    | 'SELF_AWARD'
    | 'DATABASE_ERROR'
  message: string
}

// What a scan would do, without writing anything. Lets the scanner ask "give points?" first.
export type BoothAwardPreview = {
  ok: true
  /** null = admin manual award with no booth (testing / corrections). */
  booth: Booth | null
  visitor: Visitor
  checkedIn: boolean
  alreadyVisited: boolean
  pointsToAward: number
  bonusPoints: number
}

export type BoothAwardResult =
  | {
      ok: true
      booth: Booth | null
      visitor: Visitor
      pointsAwarded: number
      bonusPoints: number
      alreadyVisited: boolean
      skippedGate: boolean
      totalPoints: number
      totalVisited: number
    }
  | {
      // Visitor never scanned at the gate. The staff UI asks them to confirm with the visitor
      // ("Belum absen di gate"), then resends with confirmSkippedGate to record attendance.
      ok: false
      code: 'GATE_CHECKIN_REQUIRED'
      message: string
      booth: Booth | null
      visitor: Visitor
      pointsToAward: number
    }
  | AwardError

export type BoothAwardParams = {
  staffUserId: string
  staffRole: UserRole
  visitorQr: unknown
  boothId?: string
  /** Discretionary bonus on top of booths.points, 0..booths.max_bonus_points. */
  bonusPoints?: number
  /** Admin only: award exactly this many points instead of base + bonus (testing / corrections). */
  points?: number
  confirmSkippedGate?: boolean
}

export const MAX_ADMIN_POINTS = 1000

type BoothResolution =
  | { ok: true; booth: Booth | null }
  | { ok: false; code: 'BOOTH_NOT_FOUND' | 'BOOTH_NOT_ASSIGNED' | 'BOOTH_AMBIGUOUS'; message: string }

// Which booth the scanning staff awards for. Booth staff and exhibitors are limited to their
// active assigned booths and may omit it when they have exactly one. Admins may pick any booth
// (active or not) or none at all — a manual award with no booth.
async function resolveStaffBooth(staffUserId: string, staffRole: UserRole, boothId?: string): Promise<BoothResolution> {
  const supabase = createServiceClient()
  let targetId = boothId

  if (staffRole !== 'admin') {
    const [{ data: assigned }, { data: owned }] = await Promise.all([
      supabase.from('booth_staff').select('booth_id').eq('user_id', staffUserId),
      supabase.from('booths').select('id').eq('exhibitor_user_id', staffUserId),
    ])
    const allowed = new Set([...(assigned ?? []).map((r) => r.booth_id as string), ...(owned ?? []).map((r) => r.id as string)])

    if (allowed.size === 0) {
      return { ok: false, code: 'BOOTH_NOT_ASSIGNED', message: 'Akun Anda belum ditugaskan ke booth mana pun.' }
    }
    if (targetId && !allowed.has(targetId)) {
      return { ok: false, code: 'BOOTH_NOT_ASSIGNED', message: 'Anda tidak ditugaskan di booth ini.' }
    }
    if (!targetId) {
      if (allowed.size > 1) {
        return { ok: false, code: 'BOOTH_AMBIGUOUS', message: 'Anda ditugaskan di beberapa booth. Pilih booth terlebih dahulu.' }
      }
      targetId = [...allowed][0]
    }
  }

  if (!targetId) {
    return { ok: true, booth: null } // only reachable for admins
  }

  let query = supabase.from('booths').select('*').eq('id', targetId)
  if (staffRole !== 'admin') query = query.eq('is_active', true)
  const { data, error } = await query.maybeSingle()

  if (error || !data) {
    return { ok: false, code: 'BOOTH_NOT_FOUND', message: 'Booth tidak ditemukan atau tidak aktif.' }
  }

  return { ok: true, booth: data as Booth }
}

type AwardContext = BoothAwardPreview & { token: string }

async function loadAwardContext(params: BoothAwardParams): Promise<AwardContext | AwardError> {
  const { staffUserId, staffRole, visitorQr, boothId, bonusPoints = 0, points } = params

  const token = parseVisitorQr(visitorQr)
  if (!token) {
    return { ok: false, code: 'INVALID_QR', message: 'QR ini bukan QR profil pengunjung ITB Insight.' }
  }

  const resolved = await resolveStaffBooth(staffUserId, staffRole, boothId)
  if (!resolved.ok) return resolved
  const booth = resolved.booth

  let pointsToAward: number
  let bonus = 0
  if (points !== undefined) {
    if (staffRole !== 'admin') {
      return { ok: false, code: 'INVALID_POINTS', message: 'Hanya admin yang dapat menentukan jumlah poin langsung.' }
    }
    if (!Number.isInteger(points) || points < 0 || points > MAX_ADMIN_POINTS) {
      return { ok: false, code: 'INVALID_POINTS', message: `Poin harus bilangan bulat antara 0 dan ${MAX_ADMIN_POINTS}.` }
    }
    pointsToAward = points
  } else if (!booth) {
    return { ok: false, code: 'INVALID_POINTS', message: 'Tanpa booth, jumlah poin wajib diisi.' }
  } else {
    if (!Number.isInteger(bonusPoints) || bonusPoints < 0 || bonusPoints > (booth.max_bonus_points ?? 0)) {
      return {
        ok: false,
        code: 'INVALID_BONUS',
        message: `Bonus harus bilangan bulat antara 0 dan ${booth.max_bonus_points ?? 0}.`,
      }
    }
    bonus = bonusPoints
    pointsToAward = (booth.points ?? 10) + bonus
  }

  const supabase = createServiceClient()

  const { data: ticket, error: ticketError } = await supabase
    .from('visitor_tickets')
    .select('id, user_id, checked_in, profiles!visitor_tickets_user_id_fkey(full_name, institution)')
    .eq('qr_code', token)
    .maybeSingle()

  if (ticketError) {
    console.error('[booths] ticket lookup failed', ticketError)
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal mencari data pengunjung.' }
  }
  if (!ticket) {
    return { ok: false, code: 'TICKET_NOT_FOUND', message: 'Pengunjung tidak ditemukan. Minta pengunjung memuat ulang QR-nya.' }
  }

  // Admins may award themselves, so the flow can be tested with a single account.
  if (ticket.user_id === staffUserId && staffRole !== 'admin') {
    return { ok: false, code: 'SELF_AWARD', message: 'Anda tidak dapat memberi poin ke akun sendiri.' }
  }

  const profile = Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles

  // Once per visitor per booth. Manual awards (no booth) are not deduplicated.
  const { data: existingScan, error: scanError } = booth
    ? await supabase
        .from('booth_scan_events')
        .select('id')
        .eq('user_id', ticket.user_id)
        .eq('booth_id', booth.id)
        .maybeSingle()
    : { data: null, error: null }

  if (scanError) {
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal memeriksa riwayat kunjungan booth.' }
  }

  return {
    ok: true,
    token,
    booth,
    visitor: {
      userId: ticket.user_id,
      fullName: profile?.full_name || 'Pengunjung',
      institution: profile?.institution || null,
    },
    checkedIn: ticket.checked_in,
    alreadyVisited: Boolean(existingScan),
    pointsToAward,
    bonusPoints: bonus,
  }
}

// Resolves a scan without writing: who the visitor is and what awarding would do.
export async function previewBoothAward(params: BoothAwardParams): Promise<BoothAwardPreview | AwardError> {
  const ctx = await loadAwardContext(params)
  if (!ctx.ok) return ctx
  const { booth, visitor, checkedIn, alreadyVisited, pointsToAward, bonusPoints } = ctx
  return { ok: true, booth, visitor, checkedIn, alreadyVisited, pointsToAward, bonusPoints }
}

// Booth staff scan a visitor's personal QR to award the booth's standard points plus an
// optional bonus (capped per booth). One award per visitor per booth.
export async function awardBoothPoints(params: BoothAwardParams): Promise<BoothAwardResult> {
  const ctx = await loadAwardContext(params)
  if (!ctx.ok) return ctx

  const { token, booth, visitor, pointsToAward, bonusPoints } = ctx
  const { staffUserId, confirmSkippedGate = false } = params

  const alreadyVisited = async (): Promise<BoothAwardResult> => {
    const progress = await getUserBoothProgress(visitor.userId)
    return {
      ok: true,
      booth,
      visitor,
      pointsAwarded: 0,
      bonusPoints: 0,
      alreadyVisited: true,
      skippedGate: false,
      totalPoints: progress.totalPoints,
      totalVisited: progress.totalVisited,
    }
  }

  if (ctx.alreadyVisited) return alreadyVisited()

  // The gate dependency is a booth rule; a manual admin award (no booth) leaves attendance alone.
  let skippedGate = false
  if (booth && !ctx.checkedIn) {
    if (!confirmSkippedGate) {
      return {
        ok: false,
        code: 'GATE_CHECKIN_REQUIRED',
        message: 'Pengunjung belum absen di gate. Konfirmasi ke pengunjung sebelum memberi poin.',
        booth,
        visitor,
        pointsToAward,
      }
    }

    const checkIn = await processGateCheckIn({
      qrCode: token,
      staffUserId,
      gateName: `booth:${booth.slug}`,
      checkInType: 'booth_skipped_gate',
    })
    if (!checkIn.ok) {
      return { ok: false, code: 'DATABASE_ERROR', message: checkIn.message }
    }
    skippedGate = !checkIn.alreadyCheckedIn
  }

  const supabase = createServiceClient()
  const { error: insertError } = await supabase.from('booth_scan_events').insert({
    user_id: visitor.userId,
    booth_id: booth?.id ?? null,
    points_awarded: pointsToAward,
    bonus_points: bonusPoints,
    awarded_by: staffUserId,
  })

  if (insertError) {
    // unique (user_id, booth_id): another staff device awarded this visitor concurrently.
    if (insertError.code === '23505') return alreadyVisited()
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal mencatat poin booth.' }
  }

  await recordAuditLog({
    userId: staffUserId,
    action: 'BOOTH_POINTS_AWARDED',
    targetTable: 'booth_scan_events',
    recordId: booth?.id ?? null,
    metadata: {
      boothName: booth?.name ?? null,
      visitorId: visitor.userId,
      pointsAwarded: pointsToAward,
      bonusPoints,
      adminOverride: params.points !== undefined,
      skippedGate,
    },
  })

  const progress = await getUserBoothProgress(visitor.userId)

  return {
    ok: true,
    booth,
    visitor,
    pointsAwarded: pointsToAward,
    bonusPoints,
    alreadyVisited: false,
    skippedGate,
    totalPoints: progress.totalPoints,
    totalVisited: progress.totalVisited,
  }
}

export type UserBoothProgress = {
  totalVisited: number
  totalPoints: number
  visitedBoothIds: string[]
  recentScans: Array<{
    boothId: string | null
    boothName: string
    category: string
    pointsAwarded: number
    scannedAt: string
  }>
}

export async function getUserBoothProgress(userId: string): Promise<UserBoothProgress> {
  const supabase = createServiceClient()

  const { data: scans, error } = await supabase
    .from('booth_scan_events')
    .select('id, booth_id, points_awarded, scanned_at, booths(id, name, category)')
    .eq('user_id', userId)
    .order('scanned_at', { ascending: false })

  if (error || !scans) {
    return { totalVisited: 0, totalPoints: 0, visitedBoothIds: [], recentScans: [] }
  }

  // booth_id is null for admin manual awards: they count toward points, not booths visited.
  const visitedBoothIds = scans.flatMap((s) => (s.booth_id ? [s.booth_id as string] : []))
  const totalPoints = scans.reduce((acc, s) => acc + (s.points_awarded || 0), 0)
  const recentScans = scans.map((s) => {
    const b = Array.isArray(s.booths) ? s.booths[0] : s.booths
    return {
      boothId: s.booth_id as string | null,
      boothName: b?.name || (s.booth_id ? 'Booth' : 'Admin (manual)'),
      category: b?.category || 'general',
      pointsAwarded: s.points_awarded,
      scannedAt: s.scanned_at,
    }
  })

  return {
    totalVisited: visitedBoothIds.length,
    totalPoints,
    visitedBoothIds,
    recentScans,
  }
}
