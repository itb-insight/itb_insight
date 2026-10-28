/*
 * Server-side data layer for Booth Visits, Geo-Fenced Booth Perimeter, and Points Allocation.
 * Aligned with docs/QR-FEATURES.md & docs/PRD(v1.0).md:
 *
 * 1. Personal QR Code:
 *    Each account has a unique personal QR code (visitor_tickets.qr_code or account user_id).
 *
 * 2. No Hard Gate-Scan Prerequisite:
 *    Attendance is tracked automatically when stepping inside ITB Ganesha Campus (geo-fencing),
 *    while Gate Staff scanning serves as gate confirmation and a TUTORIAL for new visitors.
 *    Therefore, booth point allocation does NOT fail if the visitor skipped the gate tutorial scan.
 *
 * 3. Booth Perimeter Geo-Fencing (Bandwidth-Tolerant):
 *    Visitors visiting a booth are marked within the booth perimeter by the geo-fencing service.
 *    Because local internet bandwidth may be weak, stale/missing live perimeter state never blocks
 *    Booth Staff from scanning a visitor's personal QR to award points.
 *
 * 4. Booth Staff Points Allocation (Standard + Bonus up to Max):
 *    Booth Staff scan the visitor's unique personal QR through their booth admin view to award:
 *    - Standard value (`standardPoints`, configured per booth in `booths.points`, default 10) on first visit.
 *    - Bonus value (`bonusPoints`, 0 up to `booths.max_bonus_points`, default 50) for active
 *      participation or winning games/activities in the booth (can be awarded during initial scan
 *      or in subsequent scans at the same booth up to `max_bonus_points`).
 */

import { createServiceClient } from '@/lib/supabase/server'
import { type Booth } from '@/lib/types/database'
import { recordAuditLog } from '@/lib/audit'
import { ensureVisitorTicket } from '@/lib/tickets'

export const DEFAULT_STANDARD_POINTS = 10
export const DEFAULT_MAX_BONUS_POINTS = 50
export const DEFAULT_BOOTH_PERIMETER_METERS = 15

// Institut Teknologi Bandung (Ganesha Campus) bounding box & center
export const ITB_GANESHA_CAMPUS = {
  centerLat: -6.8915,
  centerLng: 107.6107,
  minLat: -6.8965,
  maxLat: -6.8865,
  minLng: 107.6065,
  maxLng: 107.6155,
  radiusMeters: 600,
} as const

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim())
}

/**
 * Calculates Haversine distance in meters between two WGS84 coordinates.
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371000 // Earth radius in meters
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Checks whether coordinates are inside ITB Ganesha Campus premises.
 */
export function isInsideGaneshaCampus(latitude: number, longitude: number): boolean {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false
  }

  const inBoundingBox =
    latitude >= ITB_GANESHA_CAMPUS.minLat &&
    latitude <= ITB_GANESHA_CAMPUS.maxLat &&
    longitude >= ITB_GANESHA_CAMPUS.minLng &&
    longitude <= ITB_GANESHA_CAMPUS.maxLng

  if (inBoundingBox) {
    return true
  }

  const distance = calculateDistanceMeters(
    latitude,
    longitude,
    ITB_GANESHA_CAMPUS.centerLat,
    ITB_GANESHA_CAMPUS.centerLng,
  )
  return distance <= ITB_GANESHA_CAMPUS.radiusMeters
}

/**
 * Checks whether a visitor's coordinates fall within a booth's geo-fence perimeter.
 * Handles both (coordinate_y = lat, coordinate_x = lng) and (coordinate_x = lat, coordinate_y = lng).
 */
export function isWithinBoothPerimeter(
  latitude: number,
  longitude: number,
  booth: Pick<Booth, 'coordinate_x' | 'coordinate_y' | 'perimeter_radius_meters'>,
): boolean {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    booth.coordinate_x === null ||
    booth.coordinate_x === undefined ||
    booth.coordinate_y === null ||
    booth.coordinate_y === undefined
  ) {
    return false
  }

  const radius =
    typeof booth.perimeter_radius_meters === 'number' && booth.perimeter_radius_meters > 0
      ? booth.perimeter_radius_meters
      : DEFAULT_BOOTH_PERIMETER_METERS

  // Standard convention: coordinate_x = longitude (~107.61), coordinate_y = latitude (~-6.89)
  const boothLat = Math.abs(booth.coordinate_y) <= 90 ? booth.coordinate_y : booth.coordinate_x
  const boothLng = Math.abs(booth.coordinate_y) <= 90 ? booth.coordinate_x : booth.coordinate_y

  if (Math.abs(boothLat) > 90 || Math.abs(boothLng) > 180) {
    return false
  }

  const distance = calculateDistanceMeters(latitude, longitude, boothLat, boothLng)
  return distance <= radius
}

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

export async function getBoothByQrCode(qrCode: string): Promise<Booth | null> {
  const clean = qrCode.trim()
  if (!clean) return null

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .eq('qr_code', clean)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as Booth
}

export async function getBoothByIdentifier(identifier: string): Promise<Booth | null> {
  const clean = identifier.trim()
  if (!clean) return null

  const supabase = createServiceClient()

  if (isUuid(clean)) {
    const { data: byId } = await supabase
      .from('booths')
      .select('*')
      .eq('id', clean)
      .eq('is_active', true)
      .maybeSingle()

    if (byId) return byId as Booth
  }

  const { data: byQr } = await supabase
    .from('booths')
    .select('*')
    .eq('qr_code', clean)
    .eq('is_active', true)
    .maybeSingle()

  if (byQr) return byQr as Booth

  const { data: bySlug } = await supabase
    .from('booths')
    .select('*')
    .eq('slug', clean)
    .eq('is_active', true)
    .maybeSingle()

  if (bySlug) return bySlug as Booth

  return null
}

/**
 * Resolves the booth operated by a Booth Staff / Exhibitor user, or looks up by explicit identifier.
 */
export async function resolveBoothForStaff(params: {
  staffUserId?: string | null
  boothId?: string | null
  boothSlug?: string | null
  boothQrCode?: string | null
}): Promise<Booth | null> {
  const { staffUserId, boothId, boothSlug, boothQrCode } = params

  const explicitIdentifier = boothId || boothQrCode || boothSlug
  if (explicitIdentifier) {
    const booth = await getBoothByIdentifier(explicitIdentifier)
    if (booth) return booth
  }

  if (staffUserId && isUuid(staffUserId)) {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('booths')
      .select('*')
      .eq('exhibitor_user_id', staffUserId.trim())
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (data) return data as Booth
  }

  return null
}

export type ResolvedVisitor = {
  userId: string
  qrCode: string
  checkedIn: boolean
  currentBoothId?: string | null
  boothPerimeterUpdatedAt?: string | null
  profile: {
    full_name: string
    email: string
    institution: string | null
  }
}

/**
 * Resolves a visitor from their Personal QR Code.
 * Supports both `visitor_tickets.qr_code` token and `profiles.id` (`user_id` UUID from AccountQrCard / ProfileCard).
 */
export async function resolveVisitorByPersonalQr(personalQr: string): Promise<ResolvedVisitor | null> {
  const clean = personalQr.trim()
  if (!clean) return null

  const supabase = createServiceClient()

  // 1. Try lookup by visitor_tickets.qr_code
  const { data: ticketByQr } = await supabase
    .from('visitor_tickets')
    .select('*')
    .eq('qr_code', clean)
    .maybeSingle()

  if (ticketByQr) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, institution')
      .eq('id', ticketByQr.user_id)
      .maybeSingle()

    return {
      userId: ticketByQr.user_id,
      qrCode: ticketByQr.qr_code,
      checkedIn: Boolean(ticketByQr.checked_in),
      currentBoothId: (ticketByQr as Record<string, unknown>).current_booth_id as string | null | undefined,
      boothPerimeterUpdatedAt: (ticketByQr as Record<string, unknown>).booth_perimeter_updated_at as
        | string
        | null
        | undefined,
      profile: {
        full_name: profile?.full_name || 'Pengunjung',
        email: profile?.email || '',
        institution: profile?.institution || null,
      },
    }
  }

  // 2. If QR value is the user's account UUID (e.g. AccountQrCard), resolve by user_id and ensure ticket exists
  if (isUuid(clean)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, institution')
      .eq('id', clean)
      .maybeSingle()

    if (!profile) {
      return null
    }

    const ensured = await ensureVisitorTicket(profile.id, supabase)
    if (!ensured.ok || !ensured.ticket) {
      return null
    }

    const { data: fullTicket } = await supabase
      .from('visitor_tickets')
      .select('*')
      .eq('id', ensured.ticket.id)
      .maybeSingle()

    return {
      userId: profile.id,
      qrCode: ensured.ticket.qr_code,
      checkedIn: Boolean(fullTicket?.checked_in ?? ensured.ticket.checked_in),
      currentBoothId: (fullTicket as Record<string, unknown> | null)?.current_booth_id as
        | string
        | null
        | undefined,
      boothPerimeterUpdatedAt: (fullTicket as Record<string, unknown> | null)
        ?.booth_perimeter_updated_at as string | null | undefined,
      profile: {
        full_name: profile.full_name || 'Pengunjung',
        email: profile.email || '',
        institution: profile.institution || null,
      },
    }
  }

  return null
}

export type BoothPerimeterUpdateResult = {
  ok: boolean
  userId: string
  insideGaneshaCampus: boolean
  activeBooth: Booth | null
  matchedBooths: Booth[]
  updatedAt: string
}

/**
 * Geo-fencing service updater for booth perimeter & campus presence.
 * Marks the visitor as within a booth's perimeter (and attending ITB Ganesha Campus if inside campus).
 * Tolerates weak local bandwidth: best-effort persistence that never blocks QR point allocation.
 */
export async function updateVisitorBoothPerimeter(params: {
  userId: string
  boothId?: string | null
  latitude?: number | null
  longitude?: number | null
  withinPerimeter?: boolean
}): Promise<BoothPerimeterUpdateResult> {
  const { userId, boothId, latitude, longitude, withinPerimeter } = params
  const now = new Date().toISOString()
  const supabase = createServiceClient()

  await ensureVisitorTicket(userId, supabase)

  const booths = await getActiveBooths()
  let matchedBooths: Booth[] = []
  let activeBooth: Booth | null = null

  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)

  const insideCampus = hasCoords
    ? isInsideGaneshaCampus(latitude!, longitude!)
    : withinPerimeter !== false

  if (boothId) {
    const targetBooth = booths.find((b) => b.id === boothId || b.slug === boothId || b.qr_code === boothId) || null
    if (targetBooth) {
      const isInsideTarget =
        typeof withinPerimeter === 'boolean'
          ? withinPerimeter
          : hasCoords
            ? isWithinBoothPerimeter(latitude!, longitude!, targetBooth)
            : true

      if (isInsideTarget) {
        activeBooth = targetBooth
        matchedBooths = [targetBooth]
      }
    }
  } else if (hasCoords) {
    matchedBooths = booths.filter((b) => isWithinBoothPerimeter(latitude!, longitude!, b))
    activeBooth = matchedBooths[0] || null
  }

  // Best-effort update on visitor_tickets (supports both base 0002/0007 schema and extended 0009 schema)
  const extendedUpdate: Record<string, unknown> = {
    current_booth_id: activeBooth ? activeBooth.id : null,
    booth_perimeter_updated_at: now,
  }

  if (insideCampus) {
    extendedUpdate.checked_in = true
    extendedUpdate.is_on_campus = true
    extendedUpdate.last_entered_at = now
  }

  const { error: extError } = await supabase
    .from('visitor_tickets')
    .update(extendedUpdate)
    .eq('user_id', userId)

  if (extError && insideCampus) {
    // Fallback if migration 0009 columns are not yet applied on remote DB
    await supabase
      .from('visitor_tickets')
      .update({
        checked_in: true,
        checked_in_at: now,
      })
      .eq('user_id', userId)
      .eq('checked_in', false)
  }

  return {
    ok: true,
    userId,
    insideGaneshaCampus: insideCampus,
    activeBooth,
    matchedBooths,
    updatedAt: now,
  }
}

export type AllocateBoothPointsParams = {
  /** Visitor's unique personal QR code (visitor_tickets.qr_code or user_id UUID) */
  visitorQrCode: string
  /** Booth Staff / Exhibitor / Admin user ID performing the scan */
  staffUserId?: string | null
  /** Target booth ID, slug, or booth QR code (optional if staffUserId is assigned to a booth) */
  boothId?: string | null
  boothSlug?: string | null
  boothQrCode?: string | null
  /** Optional bonus points (0 up to booth's max_bonus_points) for active participation / winning games */
  bonusPoints?: number
  /** Optional note describing the activity/game won for bonus points */
  activityNote?: string | null
  /** Optional visitor coordinates if geo-fence data is sent alongside the scan */
  visitorLocation?: { latitude: number; longitude: number } | null
}

export type BoothScanResult =
  | {
      ok: true
      booth: Booth
      visitor: {
        userId: string
        fullName: string
        email: string
        institution: string | null
      }
      pointsAwarded: number
      standardPointsAwarded: number
      bonusPointsAwarded: number
      totalBoothPointsForVisitor: number
      standardPointsValue: number
      maxBonusPoints: number
      remainingBonusAllowance: number
      alreadyVisited: boolean
      withinPerimeter: boolean | null
      totalPoints: number
      totalVisited: number
    }
  | {
      ok: false
      code:
        | 'BOOTH_NOT_FOUND'
        | 'VISITOR_NOT_FOUND'
        | 'INVALID_BONUS_POINTS'
        | 'BONUS_EXCEEDS_MAX'
        | 'DATABASE_ERROR'
        | 'UNAUTHORIZED'
      message: string
    }

/**
 * Primary Booth Staff QR scan & point allocation handler per docs/QR-FEATURES.md.
 *
 * Booth Staff scan the visitor's unique personal QR code through their booth admin view.
 * - Standard points (`booth.points`, default 10) are awarded on the first scan at the booth.
 * - Bonus points (`bonusPoints`, 0 up to `booth.max_bonus_points`, default 50) can be given
 *   freely during the initial scan or on a subsequent scan at the same booth to represent
 *   active participation or winning games/activities in the booth.
 * - Does NOT require prior gate check-in (gate scanning is a tutorial, while attendance &
 *   perimeter presence use geo-fencing which may lag on weak local bandwidth).
 */
export async function allocateBoothPoints(
  params: AllocateBoothPointsParams,
): Promise<BoothScanResult> {
  const {
    visitorQrCode,
    staffUserId = null,
    boothId = null,
    boothSlug = null,
    boothQrCode = null,
    bonusPoints = 0,
    activityNote = null,
    visitorLocation = null,
  } = params

  if (!visitorQrCode || typeof visitorQrCode !== 'string' || !visitorQrCode.trim()) {
    return {
      ok: false,
      code: 'VISITOR_NOT_FOUND',
      message: 'Kode Personal QR pengunjung wajib diisi.',
    }
  }

  // 1. Validate bonusPoints input
  const parsedBonus = Number(bonusPoints ?? 0)
  if (!Number.isFinite(parsedBonus) || !Number.isInteger(parsedBonus) || parsedBonus < 0) {
    return {
      ok: false,
      code: 'INVALID_BONUS_POINTS',
      message: 'Nilai poin bonus harus berupa bilangan bulat 0 atau lebih.',
    }
  }

  // 2. Resolve the Booth (by explicit boothId/boothSlug/boothQrCode or by staff's exhibitor_user_id)
  const booth = await resolveBoothForStaff({
    staffUserId,
    boothId,
    boothSlug,
    boothQrCode,
  })

  if (!booth) {
    return {
      ok: false,
      code: 'BOOTH_NOT_FOUND',
      message: 'Booth tidak ditemukan atau tidak aktif.',
    }
  }

  const standardPointsValue =
    typeof booth.points === 'number' && booth.points >= 0 ? booth.points : DEFAULT_STANDARD_POINTS
  const maxBonusPoints =
    typeof booth.max_bonus_points === 'number' && booth.max_bonus_points >= 0
      ? booth.max_bonus_points
      : DEFAULT_MAX_BONUS_POINTS

  if (parsedBonus > maxBonusPoints) {
    return {
      ok: false,
      code: 'BONUS_EXCEEDS_MAX',
      message: `Poin bonus (${parsedBonus}) melebihi batas maksimal bonus di booth ini (${maxBonusPoints} poin).`,
    }
  }

  // 3. Resolve Visitor by their Personal QR code (or account user_id)
  const visitor = await resolveVisitorByPersonalQr(visitorQrCode)
  if (!visitor) {
    return {
      ok: false,
      code: 'VISITOR_NOT_FOUND',
      message: 'Pengunjung tidak ditemukan dari kode Personal QR yang dipindai.',
    }
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  // 4. Check geo-fence booth perimeter status (informational, bandwidth-tolerant: never blocks scan)
  let withinPerimeter: boolean | null = null
  if (
    visitorLocation &&
    typeof visitorLocation.latitude === 'number' &&
    typeof visitorLocation.longitude === 'number'
  ) {
    withinPerimeter = isWithinBoothPerimeter(
      visitorLocation.latitude,
      visitorLocation.longitude,
      booth,
    )
  } else if (visitor.currentBoothId) {
    withinPerimeter = visitor.currentBoothId === booth.id
  }

  // Being physically scanned by Booth Staff confirms the visitor is on campus & at this booth
  if (!visitor.checkedIn) {
    await supabase
      .from('visitor_tickets')
      .update({
        checked_in: true,
        checked_in_at: now,
        checked_in_by: staffUserId || null,
      })
      .eq('user_id', visitor.userId)
      .eq('checked_in', false)
  }

  // Best-effort update of visitor's current booth perimeter presence
  await supabase
    .from('visitor_tickets')
    .update({
      current_booth_id: booth.id,
      booth_perimeter_updated_at: now,
      is_on_campus: true,
    })
    .eq('user_id', visitor.userId)
    .then(() => undefined, () => undefined)

  // 5. Check existing scan record for (visitor.userId, booth.id)
  const { data: existingScan } = await supabase
    .from('booth_scan_events')
    .select('*')
    .eq('user_id', visitor.userId)
    .eq('booth_id', booth.id)
    .maybeSingle()

  if (existingScan) {
    const existingTotalPoints = Number(existingScan.points_awarded || 0)
    const existingStandardPoints =
      typeof (existingScan as Record<string, unknown>).standard_points_awarded === 'number'
        ? Number((existingScan as Record<string, unknown>).standard_points_awarded)
        : Math.min(existingTotalPoints, standardPointsValue)
    const existingBonusPoints =
      typeof (existingScan as Record<string, unknown>).bonus_points_awarded === 'number'
        ? Number((existingScan as Record<string, unknown>).bonus_points_awarded)
        : Math.max(0, existingTotalPoints - existingStandardPoints)

    const remainingBonusBefore = Math.max(0, maxBonusPoints - existingBonusPoints)

    // Case 5a: Repeat scan with NO bonus points -> idempotent (no duplicate standard points)
    if (parsedBonus === 0) {
      const progress = await getUserBoothProgress(visitor.userId)
      return {
        ok: true,
        booth,
        visitor: {
          userId: visitor.userId,
          fullName: visitor.profile.full_name,
          email: visitor.profile.email,
          institution: visitor.profile.institution,
        },
        pointsAwarded: 0,
        standardPointsAwarded: 0,
        bonusPointsAwarded: 0,
        totalBoothPointsForVisitor: existingTotalPoints,
        standardPointsValue,
        maxBonusPoints,
        remainingBonusAllowance: remainingBonusBefore,
        alreadyVisited: true,
        withinPerimeter,
        totalPoints: progress.totalPoints,
        totalVisited: progress.totalVisited,
      }
    }

    // Case 5b: Repeat scan WITH bonus points (visitor won a game / active participation in booth)
    if (parsedBonus > remainingBonusBefore) {
      return {
        ok: false,
        code: 'BONUS_EXCEEDS_MAX',
        message: `Poin bonus tambahan (${parsedBonus}) melebihi sisa batas bonus pengunjung di booth ini (tersisa ${remainingBonusBefore} dari maksimal ${maxBonusPoints} poin bonus).`,
      }
    }

    const newBonusTotal = existingBonusPoints + parsedBonus
    const newTotalPoints = existingStandardPoints + newBonusTotal

    const { error: updateExtendedError } = await supabase
      .from('booth_scan_events')
      .update({
        points_awarded: newTotalPoints,
        standard_points_awarded: existingStandardPoints,
        bonus_points_awarded: newBonusTotal,
        awarded_by: staffUserId || null,
        activity_note: activityNote?.trim() || (existingScan as Record<string, unknown>).activity_note || null,
        within_perimeter: withinPerimeter,
        updated_at: now,
      })
      .eq('id', existingScan.id)

    if (updateExtendedError) {
      // Fallback for DB with only 0007 columns
      const { error: fallbackUpdateError } = await supabase
        .from('booth_scan_events')
        .update({
          points_awarded: newTotalPoints,
        })
        .eq('id', existingScan.id)

      if (fallbackUpdateError) {
        return {
          ok: false,
          code: 'DATABASE_ERROR',
          message: 'Gagal memperbarui poin bonus kunjungan booth.',
        }
      }
    }

    await recordAuditLog({
      userId: staffUserId || visitor.userId,
      action: 'BOOTH_BONUS_POINTS_AWARDED',
      targetTable: 'booth_scan_events',
      recordId: existingScan.id,
      metadata: {
        boothId: booth.id,
        boothName: booth.name,
        visitorUserId: visitor.userId,
        visitorEmail: visitor.profile.email,
        bonusPointsAwarded: parsedBonus,
        totalBoothPointsForVisitor: newTotalPoints,
        activityNote: activityNote?.trim() || null,
        withinPerimeter,
      },
    })

    const progress = await getUserBoothProgress(visitor.userId)

    return {
      ok: true,
      booth,
      visitor: {
        userId: visitor.userId,
        fullName: visitor.profile.full_name,
        email: visitor.profile.email,
        institution: visitor.profile.institution,
      },
      pointsAwarded: parsedBonus,
      standardPointsAwarded: 0,
      bonusPointsAwarded: parsedBonus,
      totalBoothPointsForVisitor: newTotalPoints,
      standardPointsValue,
      maxBonusPoints,
      remainingBonusAllowance: Math.max(0, maxBonusPoints - newBonusTotal),
      alreadyVisited: true,
      withinPerimeter,
      totalPoints: progress.totalPoints,
      totalVisited: progress.totalVisited,
    }
  }

  // 6. First visit scan at this booth: award standardPointsValue + parsedBonus
  const totalAwarded = standardPointsValue + parsedBonus

  const { error: insertExtendedError } = await supabase.from('booth_scan_events').insert({
    user_id: visitor.userId,
    booth_id: booth.id,
    points_awarded: totalAwarded,
    standard_points_awarded: standardPointsValue,
    bonus_points_awarded: parsedBonus,
    awarded_by: staffUserId || null,
    activity_note: activityNote?.trim() || null,
    within_perimeter: withinPerimeter,
  })

  if (insertExtendedError) {
    // Fallback if migration 0009 columns are not yet applied on remote DB
    const { error: fallbackInsertError } = await supabase.from('booth_scan_events').insert({
      user_id: visitor.userId,
      booth_id: booth.id,
      points_awarded: totalAwarded,
    })

    if (fallbackInsertError) {
      return {
        ok: false,
        code: 'DATABASE_ERROR',
        message: 'Gagal mencatat poin kunjungan booth.',
      }
    }
  }

  await recordAuditLog({
    userId: staffUserId || visitor.userId,
    action: 'BOOTH_SCAN',
    targetTable: 'booths',
    recordId: booth.id,
    metadata: {
      boothName: booth.name,
      visitorUserId: visitor.userId,
      visitorEmail: visitor.profile.email,
      standardPointsAwarded: standardPointsValue,
      bonusPointsAwarded: parsedBonus,
      pointsAwarded: totalAwarded,
      activityNote: activityNote?.trim() || null,
      withinPerimeter,
    },
  })

  const progress = await getUserBoothProgress(visitor.userId)

  return {
    ok: true,
    booth,
    visitor: {
      userId: visitor.userId,
      fullName: visitor.profile.full_name,
      email: visitor.profile.email,
      institution: visitor.profile.institution,
    },
    pointsAwarded: totalAwarded,
    standardPointsAwarded: standardPointsValue,
    bonusPointsAwarded: parsedBonus,
    totalBoothPointsForVisitor: totalAwarded,
    standardPointsValue,
    maxBonusPoints,
    remainingBonusAllowance: Math.max(0, maxBonusPoints - parsedBonus),
    alreadyVisited: false,
    withinPerimeter,
    totalPoints: progress.totalPoints,
    totalVisited: progress.totalVisited,
  }
}

/**
 * Supports both the Booth Staff object signature (`AllocateBoothPointsParams`)
 * and positional arguments `(actorOrVisitorId, qrCode, options?)`.
 * Intelligently detects whether `qrCode` is a visitor's Personal QR (scanned by Booth Staff)
 * or a booth identifier (if called from a visitor context).
 */
export async function recordBoothScan(
  paramsOrActorId: AllocateBoothPointsParams | string,
  qrCodeOrIdentifier?: string,
  options?: {
    staffUserId?: string | null
    boothId?: string | null
    boothSlug?: string | null
    bonusPoints?: number
    activityNote?: string | null
    visitorLocation?: { latitude: number; longitude: number } | null
  },
): Promise<BoothScanResult> {
  if (typeof paramsOrActorId === 'object' && paramsOrActorId !== null) {
    return allocateBoothPoints(paramsOrActorId)
  }

  const firstArg = paramsOrActorId.trim()
  const secondArg = (qrCodeOrIdentifier || '').trim()

  // Check if secondArg is a Visitor Personal QR (preferred flow per docs/QR-FEATURES.md:
  // firstArg = staffUserId, secondArg = visitorQrCode)
  const visitorFromSecondArg = await resolveVisitorByPersonalQr(secondArg)
  if (visitorFromSecondArg) {
    return allocateBoothPoints({
      visitorQrCode: secondArg,
      staffUserId: options?.staffUserId ?? firstArg,
      boothId: options?.boothId ?? null,
      boothSlug: options?.boothSlug ?? null,
      bonusPoints: options?.bonusPoints ?? 0,
      activityNote: options?.activityNote ?? null,
      visitorLocation: options?.visitorLocation ?? null,
    })
  }

  // Fallback compatibility if firstArg is visitorUserId and secondArg is booth identifier/QR
  return allocateBoothPoints({
    visitorQrCode: firstArg,
    staffUserId: options?.staffUserId ?? null,
    boothId: options?.boothId ?? secondArg,
    boothSlug: options?.boothSlug ?? secondArg,
    boothQrCode: secondArg,
    bonusPoints: options?.bonusPoints ?? 0,
    activityNote: options?.activityNote ?? null,
    visitorLocation: options?.visitorLocation ?? null,
  })
}

export type UserBoothProgress = {
  totalVisited: number
  totalPoints: number
  totalStandardPoints: number
  totalBonusPoints: number
  visitedBoothIds: string[]
  currentBoothId: string | null
  recentScans: Array<{
    boothId: string
    boothName: string
    category: string
    pointsAwarded: number
    standardPointsAwarded: number
    bonusPointsAwarded: number
    activityNote: string | null
    scannedAt: string
  }>
}

export async function getUserBoothProgress(userId: string): Promise<UserBoothProgress> {
  const supabase = createServiceClient()

  const [{ data: scans, error }, { data: ticket }] = await Promise.all([
    supabase
      .from('booth_scan_events')
      .select('*, booths(id, name, category, points)')
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false }),
    supabase
      .from('visitor_tickets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const currentBoothId =
    ((ticket as Record<string, unknown> | null)?.current_booth_id as string | null | undefined) ??
    null

  if (error || !scans) {
    return {
      totalVisited: 0,
      totalPoints: 0,
      totalStandardPoints: 0,
      totalBonusPoints: 0,
      visitedBoothIds: [],
      currentBoothId,
      recentScans: [],
    }
  }

  const visitedBoothIds = scans.map((s) => s.booth_id)
  let totalPoints = 0
  let totalStandardPoints = 0
  let totalBonusPoints = 0

  const recentScans = scans.map((s) => {
    const b = Array.isArray(s.booths) ? s.booths[0] : s.booths
    const row = s as Record<string, unknown>
    const boothStandardDefault = typeof b?.points === 'number' ? b.points : DEFAULT_STANDARD_POINTS
    const pointsAwarded = Number(s.points_awarded || 0)
    const standardPointsAwarded =
      typeof row.standard_points_awarded === 'number'
        ? Number(row.standard_points_awarded)
        : Math.min(pointsAwarded, boothStandardDefault)
    const bonusPointsAwarded =
      typeof row.bonus_points_awarded === 'number'
        ? Number(row.bonus_points_awarded)
        : Math.max(0, pointsAwarded - standardPointsAwarded)

    totalPoints += pointsAwarded
    totalStandardPoints += standardPointsAwarded
    totalBonusPoints += bonusPointsAwarded

    return {
      boothId: s.booth_id,
      boothName: b?.name || 'Booth',
      category: b?.category || 'general',
      pointsAwarded,
      standardPointsAwarded,
      bonusPointsAwarded,
      activityNote: (row.activity_note as string | null | undefined) ?? null,
      scannedAt: s.scanned_at,
    }
  })

  return {
    totalVisited: scans.length,
    totalPoints,
    totalStandardPoints,
    totalBonusPoints,
    visitedBoothIds,
    currentBoothId,
    recentScans,
  }
}

export type BoothAdminSummary = {
  booth: Booth
  standardPointsValue: number
  maxBonusPoints: number
  totalVisitorsScanned: number
  totalPointsAwarded: number
  totalStandardPointsAwarded: number
  totalBonusPointsAwarded: number
  recentVisitors: Array<{
    scanId: string
    userId: string
    fullName: string
    email: string
    institution: string | null
    pointsAwarded: number
    standardPointsAwarded: number
    bonusPointsAwarded: number
    activityNote: string | null
    scannedAt: string
  }>
}

/**
 * Returns booth statistics and scan logs for the Booth Staff / Exhibitor admin view (ACC-08 / QRS-04).
 */
export async function getBoothAdminSummary(boothId: string): Promise<BoothAdminSummary | null> {
  const booth = await getBoothByIdentifier(boothId)
  if (!booth) return null

  const supabase = createServiceClient()
  const { data: scans } = await supabase
    .from('booth_scan_events')
    .select('*, profiles:user_id(full_name, email, institution)')
    .eq('booth_id', booth.id)
    .order('scanned_at', { ascending: false })

  const standardPointsValue =
    typeof booth.points === 'number' && booth.points >= 0 ? booth.points : DEFAULT_STANDARD_POINTS
  const maxBonusPoints =
    typeof booth.max_bonus_points === 'number' && booth.max_bonus_points >= 0
      ? booth.max_bonus_points
      : DEFAULT_MAX_BONUS_POINTS

  let totalPointsAwarded = 0
  let totalStandardPointsAwarded = 0
  let totalBonusPointsAwarded = 0

  const recentVisitors = (scans || []).map((s) => {
    const row = s as Record<string, unknown>
    const profRaw = row.profiles as
      | { full_name?: string; email?: string; institution?: string | null }
      | Array<{ full_name?: string; email?: string; institution?: string | null }>
      | null
    const prof = Array.isArray(profRaw) ? profRaw[0] : profRaw

    const pointsAwarded = Number(s.points_awarded || 0)
    const standardAwarded =
      typeof row.standard_points_awarded === 'number'
        ? Number(row.standard_points_awarded)
        : Math.min(pointsAwarded, standardPointsValue)
    const bonusAwarded =
      typeof row.bonus_points_awarded === 'number'
        ? Number(row.bonus_points_awarded)
        : Math.max(0, pointsAwarded - standardAwarded)

    totalPointsAwarded += pointsAwarded
    totalStandardPointsAwarded += standardAwarded
    totalBonusPointsAwarded += bonusAwarded

    return {
      scanId: s.id,
      userId: s.user_id,
      fullName: prof?.full_name || 'Pengunjung',
      email: prof?.email || '',
      institution: prof?.institution || null,
      pointsAwarded,
      standardPointsAwarded: standardAwarded,
      bonusPointsAwarded: bonusAwarded,
      activityNote: (row.activity_note as string | null | undefined) ?? null,
      scannedAt: s.scanned_at,
    }
  })

  return {
    booth,
    standardPointsValue,
    maxBonusPoints,
    totalVisitorsScanned: recentVisitors.length,
    totalPointsAwarded,
    totalStandardPointsAwarded,
    totalBonusPointsAwarded,
    recentVisitors,
  }
}
