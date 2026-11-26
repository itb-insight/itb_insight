// Server-side data layer for booths & main-quest QR point awards.
//
// Award rules (docs/SIDEQUESTS.md, migration 0022):
//  - First award at a booth (`mode: 'visit'`): booths.points + optional bonus (0..max_bonus_points).
//    Base points are given once per visitor per booth for the whole event. No cooldown.
//  - Repeat award at the same booth (`mode: 'bonus'`, "Berikan Bonus?"): bonus points only. The bonus
//    a visitor receives at one booth, summed over all visits, is capped at booths.max_bonus_points
//    (`award_booth_bonus()` enforces the cap under a row lock).
//  - Admin manual award with no booth (`mode: 'manual'`): -1000..1000, for testing / corrections.
//
// Wireframe screens:
//  - "Ini Akun Panitia!" (`COMMITTEE_ACCOUNT`): accounts with profiles.role_a cannot receive visitor
//    points (unless admin self-testing).
//  - "BANYAK BANGET!" (`highPoints`): |pointsToAward| > HIGH_POINTS_THRESHOLD (default 100).
//  - "Yakin?" (`nonBoothStaff`): the scanner is not on the booth's roster (field_staff helpers, admins).
//  - "Berikan Bonus?" (`repeatVisit`): the visitor already got this booth's base points.
//  - Priority when several apply: high_points > non_booth_staff > repeat_visit.
//  - Any warning must be acknowledged: an award without `confirmWarnings: true` returns
//    CONFIRMATION_REQUIRED and writes nothing.
//  - "HOORAY!": returns `awardedByName` so the visitor UI can thank the staff.

import 'server-only'

import { recordAuditLog } from '@/lib/audit'
import { processGateCheckIn } from '@/lib/check-in'
import { parseVisitorQr } from '@/lib/qr'
import { createServiceClient } from '@/lib/supabase/server'
import { type Booth, type ProfileRoleA, type UserRole } from '@/lib/types/database'

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

/** Roles that may award booth points (POST /api/booths/scan, /dashboard/booth-scan). */
export const BOOTH_AWARD_ROLES: readonly UserRole[] = ['booth_staff', 'exhibitor', 'field_staff', 'admin']

/** Admins and field_staff helpers may award at any active booth (with the "Yakin?" warning). */
const canPickAnyBooth = (role: UserRole) => role === 'admin' || role === 'field_staff'

export type ScannerBooth = Pick<Booth, 'id' | 'name' | 'points' | 'max_bonus_points'> & { assigned: boolean }

/** Booths this staff member can award at: their roster booths, or every active booth for helpers. */
export async function getScannerBooths(staffUserId: string, staffRole: UserRole): Promise<ScannerBooth[]> {
  const supabase = createServiceClient()
  const [{ data: assigned }, { data: owned }] = await Promise.all([
    supabase.from('booth_staff').select('booth_id').eq('user_id', staffUserId),
    supabase.from('booths').select('id').eq('exhibitor_user_id', staffUserId),
  ])
  const mine = new Set([...(assigned ?? []).map((r) => r.booth_id as string), ...(owned ?? []).map((r) => r.id as string)])

  if (!canPickAnyBooth(staffRole) && mine.size === 0) return []

  let query = supabase
    .from('booths')
    .select('id, name, points, max_bonus_points')
    .eq('is_active', true)
    .order('name', { ascending: true })
  if (!canPickAnyBooth(staffRole)) query = query.in('id', [...mine])

  const { data } = await query
  return ((data ?? []) as Array<Pick<Booth, 'id' | 'name' | 'points' | 'max_bonus_points'>>)
    .map((b) => ({ ...b, assigned: mine.has(b.id) }))
    .sort((a, b) => Number(b.assigned) - Number(a.assigned))
}

export type Visitor = {
  userId: string
  fullName: string
  institution: string | null
  roleA?: ProfileRoleA | null
}

export type BoothWarningValues = {
  highPoints: boolean
  nonBoothStaff: boolean
  /** The visitor already received this booth's base points: only a bonus can be given. */
  repeatVisit: boolean
  primaryWarning: 'high_points' | 'non_booth_staff' | 'repeat_visit' | null
}

/** visit = first award at a booth, bonus = repeat visit (bonus only), manual = admin, no booth. */
export type AwardMode = 'visit' | 'bonus' | 'manual'

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
    | 'COMMITTEE_ACCOUNT'
    | 'DATABASE_ERROR'
  message: string
  visitorRole?: ProfileRoleA | null
}

// What a scan would do, without writing anything. Lets the scanner ask "give points?" first.
export type BoothAwardPreview = {
  ok: true
  /** null = admin manual award with no booth (testing / corrections). */
  booth: Booth | null
  visitor: Visitor
  checkedIn: boolean
  mode: AwardMode
  /** The visitor already received this booth's base points. */
  alreadyVisited: boolean
  lastScannedAt: string | null
  /** booths.points on a first visit; 0 on a repeat visit or a manual award. */
  basePoints: number
  bonusPoints: number
  pointsToAward: number
  /** Bonus still available to this visitor at this booth after this award; null for manual. */
  bonusRemaining: number | null
  isAssignedBoothStaff: boolean
  awardedByName: string | null
  warnings: BoothWarningValues
}

export type BoothAwardResult =
  | {
      ok: true
      booth: Booth | null
      visitor: Visitor
      mode: AwardMode
      pointsAwarded: number
      bonusPoints: number
      /** Nothing was written: repeat visit with no bonus, or the bonus cap is used up. */
      alreadyVisited: boolean
      bonusRemaining: number | null
      skippedGate: boolean
      totalPoints: number
      totalVisited: number
      awardedByName: string | null
      warnings: BoothWarningValues
    }
  | {
      // The scan raised a wireframe warning the staff has not acknowledged yet. The scanner shows
      // the matching screen, then resends with confirmWarnings.
      ok: false
      code: 'CONFIRMATION_REQUIRED'
      message: string
      preview: BoothAwardPreview
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
  /** Discretionary bonus: on a first visit on top of booths.points, on a repeat visit on its own. */
  bonusPoints?: number
  /** Admin only: exact amount. -1000..1000 with no booth; 0..1000 for a booth's first visit. */
  points?: number
  confirmSkippedGate?: boolean
  /** The staff saw and accepted the preview's warnings. */
  confirmWarnings?: boolean
}

export const MAX_ADMIN_POINTS = 1000

export function getHighPointsThreshold(): number {
  const raw = Number(process.env.BOOTH_HIGH_POINTS_THRESHOLD)
  return Number.isInteger(raw) && raw > 0 ? raw : 100
}

type BoothResolution =
  | { ok: true; booth: Booth | null; isAssignedBoothStaff: boolean }
  | { ok: false; code: 'BOOTH_NOT_FOUND' | 'BOOTH_NOT_ASSIGNED' | 'BOOTH_AMBIGUOUS'; message: string }

// Which booth the scanning staff awards for. Booth staff and exhibitors are limited to their
// assigned booths and may omit it when they have exactly one. Admins and field_staff helpers may
// pick any booth (field_staff: active ones only); `isAssignedBoothStaff` records whether they are
// on that booth's roster, which drives the "Yakin?" warning. Only admins may award with no booth.
async function resolveStaffBooth(staffUserId: string, staffRole: UserRole, boothId?: string): Promise<BoothResolution> {
  const supabase = createServiceClient()
  let targetId = boothId

  const [{ data: assigned }, { data: owned }] = await Promise.all([
    supabase.from('booth_staff').select('booth_id').eq('user_id', staffUserId),
    supabase.from('booths').select('id').eq('exhibitor_user_id', staffUserId),
  ])
  const allowed = new Set([...(assigned ?? []).map((r) => r.booth_id as string), ...(owned ?? []).map((r) => r.id as string)])

  if (!canPickAnyBooth(staffRole)) {
    if (allowed.size === 0) {
      return { ok: false, code: 'BOOTH_NOT_ASSIGNED', message: 'Akun Anda belum ditugaskan ke booth mana pun.' }
    }
    if (targetId && !allowed.has(targetId)) {
      return { ok: false, code: 'BOOTH_NOT_ASSIGNED', message: 'Anda tidak ditugaskan di booth ini.' }
    }
  }

  if (!targetId && staffRole !== 'admin') {
    if (allowed.size !== 1) {
      return {
        ok: false,
        code: 'BOOTH_AMBIGUOUS',
        message: allowed.size > 1 ? 'Anda ditugaskan di beberapa booth. Pilih booth terlebih dahulu.' : 'Pilih booth terlebih dahulu.',
      }
    }
    targetId = [...allowed][0]
  }

  if (!targetId) {
    return { ok: true, booth: null, isAssignedBoothStaff: false } // only reachable for admins
  }

  let query = supabase.from('booths').select('*').eq('id', targetId)
  if (staffRole !== 'admin') query = query.eq('is_active', true)
  const { data, error } = await query.maybeSingle()

  if (error || !data) {
    return { ok: false, code: 'BOOTH_NOT_FOUND', message: 'Booth tidak ditemukan atau tidak aktif.' }
  }

  return {
    ok: true,
    booth: data as Booth,
    isAssignedBoothStaff: allowed.has(targetId),
  }
}

export function computeWarnings(params: {
  pointsToAward: number
  /** No booth = manual admin award: the roster warning does not apply. */
  hasBooth: boolean
  isAssignedBoothStaff: boolean
  repeatVisit: boolean
}): BoothWarningValues {
  const highPoints = Math.abs(params.pointsToAward) > getHighPointsThreshold()
  const nonBoothStaff = params.hasBooth && !params.isAssignedBoothStaff
  const repeatVisit = params.repeatVisit

  // Wireframe note: "Jika pemberian poin banyak dan bukan staff, langsung aja ke warning screen ngelewatin treshold tertentu!"
  const primaryWarning: BoothWarningValues['primaryWarning'] = highPoints
    ? 'high_points'
    : nonBoothStaff
      ? 'non_booth_staff'
      : repeatVisit
        ? 'repeat_visit'
        : null

  return { highPoints, nonBoothStaff, repeatVisit, primaryWarning }
}

const isWholeNumber = (value: number) => Number.isInteger(value)

type AwardContext = BoothAwardPreview & { token: string }

async function loadAwardContext(params: BoothAwardParams): Promise<AwardContext | AwardError> {
  const { staffUserId, staffRole, visitorQr, boothId, bonusPoints = 0, points } = params

  const token = parseVisitorQr(visitorQr)
  if (!token) {
    return { ok: false, code: 'INVALID_QR', message: 'QR ini bukan QR profil pengunjung ITB Insight.' }
  }

  const resolved = await resolveStaffBooth(staffUserId, staffRole, boothId)
  if (!resolved.ok) return resolved
  const { booth, isAssignedBoothStaff } = resolved
  const maxBonus = booth?.max_bonus_points ?? 0

  // Input checks that do not depend on the visitor.
  if (points !== undefined) {
    if (staffRole !== 'admin') {
      return { ok: false, code: 'INVALID_POINTS', message: 'Hanya admin yang dapat menentukan jumlah poin langsung.' }
    }
    const minAllowed = booth ? 0 : -MAX_ADMIN_POINTS
    if (!isWholeNumber(points) || points < minAllowed || points > MAX_ADMIN_POINTS) {
      return {
        ok: false,
        code: 'INVALID_POINTS',
        message: `Poin harus bilangan bulat antara ${minAllowed} dan ${MAX_ADMIN_POINTS}.`,
      }
    }
  } else if (!booth) {
    return { ok: false, code: 'INVALID_POINTS', message: 'Tanpa booth, jumlah poin wajib diisi.' }
  } else if (!isWholeNumber(bonusPoints) || bonusPoints < 0 || bonusPoints > maxBonus) {
    return { ok: false, code: 'INVALID_BONUS', message: `Bonus harus bilangan bulat antara 0 dan ${maxBonus}.` }
  }

  const supabase = createServiceClient()

  const { data: ticket, error: ticketError } = await supabase
    .from('visitor_tickets')
    .select('id, user_id, checked_in, profiles!visitor_tickets_user_id_fkey(full_name, institution, role_a)')
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

  const profile = (Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles) as {
    full_name?: string | null
    institution?: string | null
    role_a?: ProfileRoleA | null
  } | null

  // Wireframe: "Ini Akun Panitia! Akun ini memiliki peran (panitia / stakeholder / sponsor). Tidak ada keperluan memiliki poin lohh"
  const visitorRole = profile?.role_a ?? null
  if (visitorRole && !(staffRole === 'admin' && ticket.user_id === staffUserId)) {
    return {
      ok: false,
      code: 'COMMITTEE_ACCOUNT',
      message: `Ini Akun Panitia! Akun ini memiliki peran (${visitorRole}). Tidak ada keperluan memiliki poin.`,
      visitorRole,
    }
  }

  // Everything this visitor already received at this booth: the base visit and any bonuses.
  const { data: priorRows, error: scanError } = booth
    ? await supabase
        .from('booth_scan_events')
        .select('id, kind, bonus_points, scanned_at')
        .eq('user_id', ticket.user_id)
        .eq('booth_id', booth.id)
    : { data: [], error: null }

  if (scanError) {
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal memeriksa riwayat kunjungan booth.' }
  }

  const prior = (priorRows ?? []) as Array<{ kind?: string | null; bonus_points?: number | null; scanned_at?: string | null }>
  // Rows written before 0022 have no kind; any row with a booth was a visit then.
  const alreadyVisited = prior.some((row) => (row.kind ?? 'visit') === 'visit')
  const bonusUsed = prior.reduce((acc, row) => acc + (row.bonus_points || 0), 0)
  const lastScannedAt = prior.reduce<string | null>(
    (latest, row) => (row.scanned_at && (!latest || row.scanned_at > latest) ? row.scanned_at : latest),
    null,
  )

  const mode: AwardMode = !booth ? 'manual' : alreadyVisited ? 'bonus' : 'visit'
  let basePoints = 0
  let bonus = 0
  let pointsToAward: number

  if (mode === 'manual') {
    pointsToAward = points as number
  } else if (mode === 'visit') {
    if (points !== undefined) {
      pointsToAward = points
    } else {
      basePoints = booth?.points ?? 10
      bonus = bonusPoints
      pointsToAward = basePoints + bonus
    }
  } else {
    if (points !== undefined) {
      return {
        ok: false,
        code: 'INVALID_POINTS',
        message: 'Pengunjung sudah menerima poin booth ini. Untuk koreksi, gunakan penyesuaian manual tanpa booth.',
      }
    }
    const remaining = Math.max(0, maxBonus - bonusUsed)
    if (bonusPoints > remaining) {
      return {
        ok: false,
        code: 'INVALID_BONUS',
        message:
          remaining > 0
            ? `Pengunjung sudah pernah ke booth ini. Sisa bonus yang bisa diberikan: ${remaining} poin.`
            : 'Pengunjung sudah pernah ke booth ini dan bonusnya sudah habis.',
      }
    }
    bonus = bonusPoints
    pointsToAward = bonus
  }

  const bonusRemaining = mode === 'manual' ? null : Math.max(0, maxBonus - bonusUsed - bonus)

  const { data: staffProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', staffUserId)
    .maybeSingle()
  const awardedByName = (staffProfile as { full_name?: string | null } | null)?.full_name?.trim() || null

  const warnings = computeWarnings({
    pointsToAward,
    hasBooth: Boolean(booth),
    isAssignedBoothStaff,
    repeatVisit: mode === 'bonus',
  })

  return {
    ok: true,
    token,
    booth,
    visitor: {
      userId: ticket.user_id,
      fullName: profile?.full_name || 'Pengunjung',
      institution: profile?.institution || null,
      roleA: visitorRole,
    },
    checkedIn: ticket.checked_in,
    mode,
    alreadyVisited,
    lastScannedAt,
    basePoints,
    bonusPoints: bonus,
    pointsToAward,
    bonusRemaining,
    isAssignedBoothStaff,
    awardedByName,
    warnings,
  }
}

function toPreview(ctx: AwardContext): BoothAwardPreview {
  const { token: _token, ...preview } = ctx
  return preview
}

const hasWarning = (warnings: BoothWarningValues) => warnings.highPoints || warnings.nonBoothStaff || warnings.repeatVisit

// Resolves a scan without writing: who the visitor is and what awarding would do.
export async function previewBoothAward(params: BoothAwardParams): Promise<BoothAwardPreview | AwardError> {
  const ctx = await loadAwardContext(params)
  if (!ctx.ok) return ctx
  return toPreview(ctx)
}

// Booth staff scan a visitor's personal QR to award the booth's points (first visit) or a bonus
// (repeat visit). See the rules at the top of this file.
export async function awardBoothPoints(params: BoothAwardParams): Promise<BoothAwardResult> {
  const ctx = await loadAwardContext(params)
  if (!ctx.ok) return ctx

  const { token, booth, visitor, mode, pointsToAward, bonusPoints, awardedByName, warnings } = ctx
  const { staffUserId, confirmSkippedGate = false, confirmWarnings = false } = params

  const nothingWritten = async (bonusRemaining: number | null): Promise<BoothAwardResult> => {
    const progress = await getUserBoothProgress(visitor.userId)
    return {
      ok: true,
      booth,
      visitor,
      mode,
      pointsAwarded: 0,
      bonusPoints: 0,
      alreadyVisited: true,
      bonusRemaining,
      skippedGate: false,
      totalPoints: progress.totalPoints,
      totalVisited: progress.totalVisited,
      awardedByName,
      warnings,
    }
  }

  // Repeat visit without a bonus: nothing to give.
  if (mode === 'bonus' && bonusPoints === 0) return nothingWritten(ctx.bonusRemaining)

  if (hasWarning(warnings) && !confirmWarnings) {
    return {
      ok: false,
      code: 'CONFIRMATION_REQUIRED',
      message: 'Periksa peringatan lalu konfirmasi pemberian poin.',
      preview: toPreview(ctx),
    }
  }

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

  if (mode === 'bonus' && booth) {
    const { data: bonusRowId, error: bonusError } = await supabase.rpc('award_booth_bonus', {
      p_user: visitor.userId,
      p_booth: booth.id,
      p_bonus: bonusPoints,
      p_awarded_by: staffUserId,
    })
    if (bonusError) {
      console.error('[booths] bonus award failed', bonusError)
      return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal mencatat bonus booth.' }
    }
    // NULL: another device spent the remaining bonus first.
    if (!bonusRowId) return nothingWritten(0)
  } else {
    const { error: insertError } = await supabase.from('booth_scan_events').insert({
      user_id: visitor.userId,
      booth_id: booth?.id ?? null,
      kind: mode,
      points_awarded: pointsToAward,
      bonus_points: bonusPoints,
      awarded_by: staffUserId,
    })

    if (insertError) {
      // One visit row per (user, booth): another staff device awarded this visitor concurrently.
      if (insertError.code === '23505') return nothingWritten(ctx.bonusRemaining)
      console.error('[booths] award insert failed', insertError)
      return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal mencatat poin booth.' }
    }
  }

  await recordAuditLog({
    userId: staffUserId,
    action: pointsToAward < 0 ? 'BOOTH_POINTS_DEDUCTED' : mode === 'bonus' ? 'BOOTH_BONUS_AWARDED' : 'BOOTH_POINTS_AWARDED',
    targetTable: 'booth_scan_events',
    recordId: booth?.id ?? null,
    metadata: {
      boothName: booth?.name ?? null,
      visitorId: visitor.userId,
      mode,
      pointsAwarded: pointsToAward,
      bonusPoints,
      adminOverride: params.points !== undefined,
      skippedGate,
      warnings,
    },
  })

  const progress = await getUserBoothProgress(visitor.userId)

  return {
    ok: true,
    booth,
    visitor,
    mode,
    pointsAwarded: pointsToAward,
    bonusPoints,
    alreadyVisited: false,
    bonusRemaining: ctx.bonusRemaining,
    skippedGate,
    totalPoints: progress.totalPoints,
    totalVisited: progress.totalVisited,
    awardedByName,
    warnings,
  }
}

export type UserBoothProgress = {
  totalVisited: number
  totalPoints: number
  boothPoints: number
  sidequestPoints: number
  visitedBoothIds: string[]
  recentScans: Array<{
    boothId: string | null
    boothName: string
    category: string
    kind: AwardMode
    pointsAwarded: number
    scannedAt: string
    awardedByName: string | null
  }>
  /** The point rows could not be read: the totals above are not trustworthy. */
  loadFailed?: true
}

export async function getUserBoothProgress(userId: string): Promise<UserBoothProgress> {
  const supabase = createServiceClient()

  const [{ data: scans, error }, { data: approvedQuests }] = await Promise.all([
    supabase
      .from('booth_scan_events')
      .select(
        'id, booth_id, kind, points_awarded, scanned_at, booths(id, name, category), awarder:profiles!booth_scan_events_awarded_by_fkey(full_name)',
      )
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false }),
    supabase
      .from('sidequest_submissions')
      .select('points_awarded')
      .eq('user_id', userId)
      .eq('status', 'approved'),
  ])

  const questList = Array.isArray(approvedQuests) ? (approvedQuests as Array<{ points_awarded?: number }>) : []
  const sidequestPoints = questList.reduce((acc, q) => acc + (q.points_awarded || 0), 0)

  if (error || !Array.isArray(scans)) {
    console.error('[booths] progress lookup failed', error)
    return {
      totalVisited: 0,
      totalPoints: Math.max(0, sidequestPoints),
      boothPoints: 0,
      sidequestPoints,
      visitedBoothIds: [],
      recentScans: [],
      loadFailed: true,
    }
  }

  const kindOf = (s: { kind?: string | null; booth_id?: string | null }): AwardMode =>
    s.kind === 'bonus' || s.kind === 'manual' || s.kind === 'visit' ? s.kind : s.booth_id ? 'visit' : 'manual'

  // Booths visited = base visit rows; bonus rows add points, not visits. Manual rows have no booth.
  const visitedBoothIds = [
    ...new Set(scans.flatMap((s) => (kindOf(s) === 'visit' && s.booth_id ? [s.booth_id as string] : []))),
  ]
  const boothPoints = scans.reduce((acc, s) => acc + (s.points_awarded || 0), 0)
  const totalPoints = Math.max(0, boothPoints + sidequestPoints)
  const recentScans = scans.map((s) => {
    const b = Array.isArray(s.booths) ? s.booths[0] : s.booths
    const awarder = (Array.isArray(s.awarder) ? s.awarder[0] : s.awarder) as { full_name?: string | null } | null
    return {
      boothId: s.booth_id as string | null,
      boothName: b?.name || (s.booth_id ? 'Booth' : 'Admin (manual)'),
      category: b?.category || 'general',
      kind: kindOf(s),
      pointsAwarded: s.points_awarded,
      scannedAt: s.scanned_at,
      awardedByName: awarder?.full_name?.trim() || null,
    }
  })

  return {
    totalVisited: visitedBoothIds.length,
    totalPoints,
    boothPoints,
    sidequestPoints,
    visitedBoothIds,
    recentScans,
  }
}
