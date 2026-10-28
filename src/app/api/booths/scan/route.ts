import { type NextRequest } from 'next/server'

import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import { hasUserRole } from '@/lib/admin'
import {
  allocateBoothPoints,
  getBoothAdminSummary,
  resolveBoothForStaff,
  updateVisitorBoothPerimeter,
} from '@/lib/booths'

export const dynamic = 'force-dynamic'

/**
 * GET /api/booths/scan?boothId=...
 * Booth Admin View: returns the booth's point configuration (standard + max bonus)
 * and recent visitor scans for Booth Staff / Exhibitor / Admin.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const boothId = searchParams.get('boothId') || searchParams.get('booth') || undefined

    const booth = await resolveBoothForStaff({
      staffUserId: auth.user.id,
      boothId,
    })

    if (!booth) {
      return apiError('BOOTH_NOT_FOUND', 'Booth tidak ditemukan untuk akun petugas ini.', 404)
    }

    const isStaffOrOwner =
      booth.exhibitor_user_id === auth.user.id ||
      (await hasUserRole(auth.user, ['admin', 'booth_staff', 'exhibitor', 'field_staff']))

    if (!isStaffOrOwner) {
      return apiError(
        'FORBIDDEN',
        'Akses ditolak: Hanya petugas booth (Booth Staff / Exhibitor / Admin) yang dapat melihat panel booth.',
        403,
      )
    }

    const summary = await getBoothAdminSummary(booth.id)
    if (!summary) {
      return apiError('BOOTH_NOT_FOUND', 'Gagal memuat ringkasan booth.', 404)
    }

    return apiSuccess(summary)
  } catch (err) {
    console.error('[API Booth Admin GET Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan saat memuat data admin booth.', 500)
  }
}

/**
 * POST /api/booths/scan
 *
 * 1. Geo-fencing perimeter update (`action: 'perimeter'`):
 *    Marks the authenticated visitor as within a booth's perimeter (tolerant of weak local bandwidth).
 *
 * 2. Booth Staff Point Allocation (default):
 *    Booth Staff scans the visitor's unique Personal QR code (`visitorQrCode` / `qrCode`)
 *    to allocate standard visit points + optional bonus points (up to `max_bonus_points`).
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const {
      action,
      visitorQrCode,
      qrCode,
      boothId,
      boothSlug,
      boothQrCode,
      bonusPoints = 0,
      activityNote,
      latitude,
      longitude,
      withinPerimeter,
    } = body

    // Mode 1: Visitor geo-fencing perimeter update
    if (action === 'perimeter') {
      const perimeterResult = await updateVisitorBoothPerimeter({
        userId: auth.user.id,
        boothId: boothId || boothSlug || boothQrCode || null,
        latitude: typeof latitude === 'number' ? latitude : null,
        longitude: typeof longitude === 'number' ? longitude : null,
        withinPerimeter: typeof withinPerimeter === 'boolean' ? withinPerimeter : undefined,
      })

      return apiSuccess(perimeterResult)
    }

    // Mode 2: Booth Staff scanning Visitor's Personal QR to award points
    const scannedPersonalQr =
      typeof visitorQrCode === 'string' && visitorQrCode.trim()
        ? visitorQrCode.trim()
        : typeof qrCode === 'string' && qrCode.trim()
          ? qrCode.trim()
          : ''

    if (!scannedPersonalQr) {
      return apiError(
        'INVALID_INPUT',
        'Parameter visitorQrCode (atau qrCode) Personal QR pengunjung wajib diisi.',
        400,
      )
    }

    // Resolve booth and verify Booth Staff / Exhibitor / Admin authorization
    const targetBooth = await resolveBoothForStaff({
      staffUserId: auth.user.id,
      boothId: boothId || null,
      boothSlug: boothSlug || null,
      boothQrCode: boothQrCode || null,
    })

    if (!targetBooth) {
      return apiError(
        'BOOTH_NOT_FOUND',
        'Wahana/Booth tidak ditemukan atau akun Anda belum terhubung ke booth aktif.',
        404,
      )
    }

    const isAuthorizedBoothStaff =
      targetBooth.exhibitor_user_id === auth.user.id ||
      (await hasUserRole(auth.user, ['admin', 'booth_staff', 'exhibitor', 'field_staff']))

    if (!isAuthorizedBoothStaff) {
      return apiError(
        'FORBIDDEN',
        'Hanya Booth Staff, Exhibitor, atau Admin yang dapat memberikan poin kunjungan booth.',
        403,
      )
    }

    const visitorLocation =
      typeof latitude === 'number' && typeof longitude === 'number'
        ? { latitude, longitude }
        : null

    const result = await allocateBoothPoints({
      visitorQrCode: scannedPersonalQr,
      staffUserId: auth.user.id,
      boothId: targetBooth.id,
      bonusPoints: typeof bonusPoints === 'number' ? bonusPoints : Number(bonusPoints || 0),
      activityNote: typeof activityNote === 'string' ? activityNote : null,
      visitorLocation,
    })

    if (!result.ok) {
      const status =
        result.code === 'UNAUTHORIZED'
          ? 403
          : result.code === 'BOOTH_NOT_FOUND' || result.code === 'VISITOR_NOT_FOUND'
            ? 404
            : 400
      return apiError(result.code, result.message, status)
    }

    return apiSuccess({
      booth: result.booth,
      visitor: result.visitor,
      pointsAwarded: result.pointsAwarded,
      standardPointsAwarded: result.standardPointsAwarded,
      bonusPointsAwarded: result.bonusPointsAwarded,
      totalBoothPointsForVisitor: result.totalBoothPointsForVisitor,
      standardPointsValue: result.standardPointsValue,
      maxBonusPoints: result.maxBonusPoints,
      remainingBonusAllowance: result.remainingBonusAllowance,
      alreadyVisited: result.alreadyVisited,
      withinPerimeter: result.withinPerimeter,
      totalPoints: result.totalPoints,
      totalVisited: result.totalVisited,
    })
  } catch (err) {
    console.error('[API Booth Scan Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan saat memproses alokasi poin booth.', 500)
  }
}
