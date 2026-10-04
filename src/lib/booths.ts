import { createServiceClient } from '@/lib/supabase/server'
import { type Booth, type BoothScanEvent } from '@/lib/types/database'
import { recordAuditLog } from '@/lib/audit'

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
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('booths')
    .select('*')
    .eq('qr_code', qrCode.trim())
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as Booth
}

export type BoothScanResult =
  | {
      ok: true
      booth: Booth
      pointsAwarded: number
      alreadyVisited: boolean
      totalPoints: number
      totalVisited: number
    }
  | {
      ok: false
      code: 'GATE_CHECKIN_REQUIRED' | 'BOOTH_NOT_FOUND' | 'DATABASE_ERROR' | 'UNAUTHORIZED'
      message: string
    }

export async function recordBoothScan(userId: string, boothQrCode: string): Promise<BoothScanResult> {
  const supabase = createServiceClient()

  // 1. Verify booth exists
  const booth = await getBoothByQrCode(boothQrCode)
  if (!booth) {
    return { ok: false, code: 'BOOTH_NOT_FOUND', message: 'Wahana/Booth tidak ditemukan atau tidak aktif.' }
  }

  // 2. QRS-05: Dependensi gate -> booth (scan booth hanya aktif untuk user yang sudah check-in di gate)
  const { data: ticket, error: ticketError } = await supabase
    .from('visitor_tickets')
    .select('checked_in')
    .eq('user_id', userId)
    .maybeSingle()

  if (ticketError || !ticket || !ticket.checked_in) {
    return {
      ok: false,
      code: 'GATE_CHECKIN_REQUIRED',
      message: 'Anda harus check-in di Gate utama terlebih dahulu sebelum memindai booth.',
    }
  }

  // 3. Check if already scanned (idempotent / double-count protection)
  const { data: existingScan } = await supabase
    .from('booth_scan_events')
    .select('id, points_awarded, scanned_at')
    .eq('user_id', userId)
    .eq('booth_id', booth.id)
    .maybeSingle()

  if (existingScan) {
    const progress = await getUserBoothProgress(userId)
    return {
      ok: true,
      booth,
      pointsAwarded: 0,
      alreadyVisited: true,
      totalPoints: progress.totalPoints,
      totalVisited: progress.totalVisited,
    }
  }

  // 4. Record new scan event
  const points = booth.points || 10
  const { error: insertError } = await supabase.from('booth_scan_events').insert({
    user_id: userId,
    booth_id: booth.id,
    points_awarded: points,
  })

  if (insertError) {
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal mencatat kunjungan booth.' }
  }

  await recordAuditLog({
    userId,
    action: 'BOOTH_SCAN',
    targetTable: 'booths',
    recordId: booth.id,
    metadata: { boothName: booth.name, points },
  })

  const progress = await getUserBoothProgress(userId)

  return {
    ok: true,
    booth,
    pointsAwarded: points,
    alreadyVisited: false,
    totalPoints: progress.totalPoints,
    totalVisited: progress.totalVisited,
  }
}

export type UserBoothProgress = {
  totalVisited: number
  totalPoints: number
  visitedBoothIds: string[]
  recentScans: Array<{
    boothId: string
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

  const visitedBoothIds = scans.map((s) => s.booth_id)
  const totalPoints = scans.reduce((acc, s) => acc + (s.points_awarded || 0), 0)
  const recentScans = scans.map((s) => {
    const b = Array.isArray(s.booths) ? s.booths[0] : s.booths
    return {
      boothId: s.booth_id,
      boothName: b?.name || 'Booth',
      category: b?.category || 'general',
      pointsAwarded: s.points_awarded,
      scannedAt: s.scanned_at,
    }
  })

  return {
    totalVisited: scans.length,
    totalPoints,
    visitedBoothIds,
    recentScans,
  }
}
