// Server-side data layer for the Sidequest & Gamification backend:
//  - Event window & leaderboard freeze: 05:00 WIB start -> 17:00 WIB close/freeze.
//  - Sidequest catalog (Marketing, Acara, Competition, Fundraise) & visitor submission flow.
//  - Admin verification workflow (approve/reject pending submissions on D-Day).
//  - Global leaderboard (booth points + approved sidequest points, excluding committee accounts,
//    frozen at 17:00 WIB with earliest-reach tie-breaker).
//  - Reward tier catalog & claim recording with double-claim and quota protection.

import 'server-only'

import { recordAuditLog } from '@/lib/audit'
import { createServiceClient } from '@/lib/supabase/server'
import {
  type RewardClaim,
  type RewardTier,
  type Sidequest,
  type SidequestCategory,
  type SidequestSubmission,
  type SidequestSubmissionStatus,
} from '@/lib/types/database'

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000 // UTC+7
export const DEFAULT_START_HOUR_WIB = 5 // 05:00 WIB
export const DEFAULT_CLOSE_HOUR_WIB = 17 // 17:00 WIB

export type SidequestWindowState = {
  status: 'not_started' | 'open' | 'frozen'
  isOpen: boolean
  isFrozen: boolean
  startsAt: string | null
  closesAt: string | null
  freezeCutoffIso: string | null
  startHourWib: number
  closeHourWib: number
}

function parseHour(raw: string | undefined, fallback: number): number {
  const num = Number(raw)
  return Number.isInteger(num) && num >= 0 && num <= 24 ? num : fallback
}

function toWibIso(dateYmd: string, hour: number): string {
  const padded = String(hour).padStart(2, '0')
  return `${dateYmd}T${padded}:00:00+07:00`
}

/**
 * Evaluates the D-Day sidequest window in WIB (UTC+7):
 *  - Default hours: 05:00 WIB start, 17:00 WIB close & leaderboard freeze.
 *  - If `SIDEQUEST_FORCE_WINDOW` is `"open"`, `"frozen"`, or `"not_started"` (ignored in production
 *    only if invalid), that state is used.
 *  - If `SIDEQUEST_DATE` (`YYYY-MM-DD`) is configured, the window is pinned to that date.
 *  - Otherwise, the current WIB calendar day's `05:00`–`17:00` window is evaluated.
 */
export function getSidequestWindow(now: Date = new Date()): SidequestWindowState {
  const startHourWib = parseHour(process.env.SIDEQUEST_START_HOUR, DEFAULT_START_HOUR_WIB)
  const closeHourWib = parseHour(process.env.SIDEQUEST_CLOSE_HOUR, DEFAULT_CLOSE_HOUR_WIB)

  const configuredDate = process.env.SIDEQUEST_DATE?.trim()
  const wibDate =
    configuredDate && /^\d{4}-\d{2}-\d{2}$/.test(configuredDate)
      ? configuredDate
      : new Date(now.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10)

  const startsAtIso = toWibIso(wibDate, startHourWib)
  const closesAtIso = toWibIso(wibDate, closeHourWib)
  const startsAtMs = new Date(startsAtIso).getTime()
  const closesAtMs = new Date(closesAtIso).getTime()
  const nowMs = now.getTime()

  const forced = process.env.SIDEQUEST_FORCE_WINDOW?.trim().toLowerCase()
  let status: SidequestWindowState['status']
  if (forced === 'open' || forced === 'frozen' || forced === 'not_started') {
    status = forced
  } else if (nowMs < startsAtMs) {
    status = 'not_started'
  } else if (nowMs >= closesAtMs) {
    status = 'frozen'
  } else {
    status = 'open'
  }

  const isFrozen = status === 'frozen'
  return {
    status,
    isOpen: status === 'open',
    isFrozen,
    startsAt: new Date(startsAtMs).toISOString(),
    closesAt: new Date(closesAtMs).toISOString(),
    freezeCutoffIso: isFrozen ? new Date(closesAtMs).toISOString() : null,
    startHourWib,
    closeHourWib,
  }
}

export async function getActiveSidequests(category?: SidequestCategory | 'all'): Promise<Sidequest[]> {
  const db = createServiceClient()
  let query = db
    .from('sidequests')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error || !data) return []
  return data as Sidequest[]
}

export type SidequestWithUserProgress = Sidequest & {
  submission: {
    id: string
    status: SidequestSubmissionStatus
    proofUrl: string | null
    note: string | null
    pointsAwarded: number
    reviewNote: string | null
    submittedAt: string
    reviewedAt: string | null
  } | null
}

export async function getSidequestsForUser(userId?: string | null): Promise<{
  window: SidequestWindowState
  quests: SidequestWithUserProgress[]
}> {
  const window = getSidequestWindow()
  const quests = await getActiveSidequests()
  if (!userId || quests.length === 0) {
    return {
      window,
      quests: quests.map((q) => ({ ...q, submission: null })),
    }
  }

  const db = createServiceClient()
  const { data: subs } = await db
    .from('sidequest_submissions')
    .select('id, quest_id, status, proof_url, note, points_awarded, review_note, submitted_at, reviewed_at')
    .eq('user_id', userId)

  const byQuestId = new Map<string, SidequestWithUserProgress['submission']>()
  for (const row of (subs as Array<Record<string, unknown>> | null) ?? []) {
    byQuestId.set(row.quest_id as string, {
      id: row.id as string,
      status: row.status as SidequestSubmissionStatus,
      proofUrl: (row.proof_url as string | null) ?? null,
      note: (row.note as string | null) ?? null,
      pointsAwarded: Number(row.points_awarded) || 0,
      reviewNote: (row.review_note as string | null) ?? null,
      submittedAt: row.submitted_at as string,
      reviewedAt: (row.reviewed_at as string | null) ?? null,
    })
  }

  return {
    window,
    quests: quests.map((q) => ({
      ...q,
      submission: byQuestId.get(q.id) ?? null,
    })),
  }
}

export type SubmitSidequestParams = {
  userId: string
  questId?: string
  questSlug?: string
  proofUrl?: string
  note?: string
  now?: Date
}

export type SubmitSidequestResult =
  | { ok: true; submission: SidequestSubmission; quest: Sidequest }
  | {
      ok: false
      code:
        | 'WINDOW_NOT_OPEN'
        | 'WINDOW_CLOSED'
        | 'QUEST_NOT_FOUND'
        | 'PROOF_REQUIRED'
        | 'INVALID_PROOF_URL'
        | 'COMMITTEE_ACCOUNT'
        | 'ALREADY_APPROVED'
        | 'ALREADY_PENDING'
        | 'DATABASE_ERROR'
      message: string
    }

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export async function submitSidequest(params: SubmitSidequestParams): Promise<SubmitSidequestResult> {
  const window = getSidequestWindow(params.now)
  if (window.status === 'not_started') {
    return {
      ok: false,
      code: 'WINDOW_NOT_OPEN',
      message: `Sidequest baru dibuka mulai pukul ${String(window.startHourWib).padStart(2, '0')}:00 WIB.`,
    }
  }
  if (window.status === 'frozen') {
    return {
      ok: false,
      code: 'WINDOW_CLOSED',
      message: `Pengumpulan sidequest telah ditutup pada pukul ${String(window.closeHourWib).padStart(2, '0')}:00 WIB.`,
    }
  }

  const db = createServiceClient()

  // Committee / stakeholder / sponsor accounts cannot earn points
  const { data: profile } = await db.from('profiles').select('id, role_a').eq('id', params.userId).maybeSingle()
  const roleA = (profile as { role_a?: string | null } | null)?.role_a
  if (roleA) {
    return {
      ok: false,
      code: 'COMMITTEE_ACCOUNT',
      message: `Ini Akun Panitia (${roleA}). Akun panitia/stakeholder/sponsor tidak mengikuti pengumpulan poin.`,
    }
  }

  let questQuery = db.from('sidequests').select('*').eq('is_active', true)
  if (params.questId) questQuery = questQuery.eq('id', params.questId)
  else if (params.questSlug) questQuery = questQuery.eq('slug', params.questSlug)
  else return { ok: false, code: 'QUEST_NOT_FOUND', message: 'Sidequest tidak ditemukan.' }

  const { data: questRow, error: questError } = await questQuery.maybeSingle()
  if (questError || !questRow) {
    return { ok: false, code: 'QUEST_NOT_FOUND', message: 'Sidequest tidak ditemukan atau tidak aktif.' }
  }
  const quest = questRow as Sidequest

  const proofUrl = params.proofUrl?.trim() || null
  const note = params.note?.trim() || null

  if (quest.requires_proof && !proofUrl && !note) {
    return {
      ok: false,
      code: 'PROOF_REQUIRED',
      message: 'Quest ini membutuhkan tautan bukti (proofUrl) atau keterangan untuk diverifikasi admin.',
    }
  }
  if (proofUrl && !isValidHttpUrl(proofUrl)) {
    return {
      ok: false,
      code: 'INVALID_PROOF_URL',
      message: 'Tautan bukti harus berupa URL http:// atau https:// yang valid.',
    }
  }

  const { data: existing } = await db
    .from('sidequest_submissions')
    .select('*')
    .eq('quest_id', quest.id)
    .eq('user_id', params.userId)
    .maybeSingle()

  if (existing) {
    const prev = existing as SidequestSubmission
    if (prev.status === 'approved') {
      return { ok: false, code: 'ALREADY_APPROVED', message: 'Sidequest ini sudah disetujui dan poin telah diberikan.' }
    }
    if (prev.status === 'pending') {
      return { ok: false, code: 'ALREADY_PENDING', message: 'Pengajuan Anda sedang menunggu verifikasi admin.' }
    }

    // Rejected submission can be re-submitted while window is open
    const { data: updated, error: updateError } = await db
      .from('sidequest_submissions')
      .update({
        proof_url: proofUrl,
        note,
        status: 'pending',
        points_awarded: 0,
        reviewed_by: null,
        review_note: null,
        reviewed_at: null,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', prev.id)
      .select('*')
      .single()

    if (updateError || !updated) {
      return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal mengirim ulang bukti sidequest.' }
    }
    return { ok: true, submission: updated as SidequestSubmission, quest }
  }

  const { data: inserted, error: insertError } = await db
    .from('sidequest_submissions')
    .insert({
      quest_id: quest.id,
      user_id: params.userId,
      proof_url: proofUrl,
      note,
      status: 'pending',
      points_awarded: 0,
    })
    .select('*')
    .single()

  if (insertError || !inserted) {
    if (insertError?.code === '23505') {
      return { ok: false, code: 'ALREADY_PENDING', message: 'Pengajuan Anda sedang menunggu verifikasi admin.' }
    }
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal menyimpan pengajuan sidequest.' }
  }

  return { ok: true, submission: inserted as SidequestSubmission, quest }
}

export type ReviewSidequestParams = {
  submissionId: string
  adminUserId: string
  decision: 'approved' | 'rejected'
  reviewNote?: string
}

export type ReviewSidequestResult =
  | { ok: true; submission: SidequestSubmission; pointsAwarded: number }
  | {
      ok: false
      code: 'NOT_FOUND' | 'ALREADY_REVIEWED' | 'DATABASE_ERROR'
      message: string
    }

export async function reviewSidequestSubmission(params: ReviewSidequestParams): Promise<ReviewSidequestResult> {
  const db = createServiceClient()

  const { data: existing, error: fetchError } = await db
    .from('sidequest_submissions')
    .select('*, sidequests(id, title, points)')
    .eq('id', params.submissionId)
    .maybeSingle()

  if (fetchError) {
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal memuat data pengajuan sidequest.' }
  }
  if (!existing) {
    return { ok: false, code: 'NOT_FOUND', message: 'Pengajuan sidequest tidak ditemukan.' }
  }

  const row = existing as SidequestSubmission & {
    sidequests?: { id: string; title: string; points: number } | Array<{ id: string; title: string; points: number }> | null
  }
  if (row.status === params.decision) {
    return { ok: false, code: 'ALREADY_REVIEWED', message: `Pengajuan ini sudah berstatus ${params.decision}.` }
  }

  const questObj = Array.isArray(row.sidequests) ? row.sidequests[0] : row.sidequests
  const questPoints = Math.max(0, Number(questObj?.points ?? 0))
  const pointsAwarded = params.decision === 'approved' ? questPoints : 0
  const reviewedAt = new Date().toISOString()

  const { data: updated, error: updateError } = await db
    .from('sidequest_submissions')
    .update({
      status: params.decision,
      points_awarded: pointsAwarded,
      reviewed_by: params.adminUserId,
      review_note: params.reviewNote?.trim() || null,
      reviewed_at: reviewedAt,
    })
    .eq('id', params.submissionId)
    .select('*')
    .single()

  if (updateError || !updated) {
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal memperbarui status verifikasi sidequest.' }
  }

  await recordAuditLog({
    userId: params.adminUserId,
    action: params.decision === 'approved' ? 'SIDEQUEST_APPROVED' : 'SIDEQUEST_REJECTED',
    targetTable: 'sidequest_submissions',
    recordId: params.submissionId,
    metadata: {
      questId: row.quest_id,
      questTitle: questObj?.title ?? null,
      visitorId: row.user_id,
      pointsAwarded,
      reviewNote: params.reviewNote?.trim() || null,
    },
  })

  return { ok: true, submission: updated as SidequestSubmission, pointsAwarded }
}

export type LeaderboardEntry = {
  rank: number
  userId: string
  fullName: string
  institution: string | null
  totalPoints: number
  boothPoints: number
  sidequestPoints: number
  lastPointAt: string
}

export type LeaderboardResponse = {
  window: SidequestWindowState
  entries: LeaderboardEntry[]
}

/**
 * Computes the global gamification leaderboard:
 *  - Sums `booth_scan_events.points_awarded` and approved `sidequest_submissions.points_awarded`.
 *  - Freeze rule (Fathir): at 17:00 WIB (`window.freezeCutoffIso`), only booth scans with
 *    `scanned_at <= closesAt` and sidequest submissions with `submitted_at <= closesAt` count toward
 *    the frozen leaderboard.
 *  - Excludes committee/stakeholder/sponsor accounts (`profiles.role_a IS NOT NULL`).
 *  - Tie-breaker ("Top 3 orang Tercepat"): higher `totalPoints` first, then earlier `lastPointAt`.
 */
export async function getLeaderboard(options: { limit?: number; now?: Date } = {}): Promise<LeaderboardResponse> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200)
  const window = getSidequestWindow(options.now)
  const cutoff = window.freezeCutoffIso
  const db = createServiceClient()

  let boothQuery = db
    .from('booth_scan_events')
    .select('user_id, points_awarded, scanned_at, profiles!booth_scan_events_user_id_fkey(full_name, institution, role_a)')
  if (cutoff) boothQuery = boothQuery.lte('scanned_at', cutoff)

  let questQuery = db
    .from('sidequest_submissions')
    .select('user_id, points_awarded, submitted_at, reviewed_at, profiles!sidequest_submissions_user_id_fkey(full_name, institution, role_a)')
    .eq('status', 'approved')
  if (cutoff) questQuery = questQuery.lte('submitted_at', cutoff)

  const [{ data: boothRows }, { data: questRows }] = await Promise.all([boothQuery, questQuery])

  type Agg = {
    userId: string
    fullName: string
    institution: string | null
    roleA: string | null
    boothPoints: number
    sidequestPoints: number
    lastPointAt: string
  }

  const map = new Map<string, Agg>()

  const touch = (
    userId: string,
    profileRaw: unknown,
    boothDelta: number,
    questDelta: number,
    timestamp: string,
  ) => {
    const prof = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as {
      full_name?: string | null
      institution?: string | null
      role_a?: string | null
    } | null
    const roleA = prof?.role_a ?? null
    if (roleA) return // committee/sponsor excluded from visitor leaderboard

    const existing = map.get(userId)
    if (!existing) {
      map.set(userId, {
        userId,
        fullName: prof?.full_name || 'Pengunjung',
        institution: prof?.institution ?? null,
        roleA,
        boothPoints: boothDelta,
        sidequestPoints: questDelta,
        lastPointAt: timestamp,
      })
      return
    }
    existing.boothPoints += boothDelta
    existing.sidequestPoints += questDelta
    if (timestamp > existing.lastPointAt) existing.lastPointAt = timestamp
  }

  for (const r of (boothRows as Array<Record<string, unknown>> | null) ?? []) {
    if (typeof r.user_id !== 'string') continue
    touch(
      r.user_id,
      r.profiles,
      Number(r.points_awarded) || 0,
      0,
      (r.scanned_at as string) || new Date(0).toISOString(),
    )
  }

  for (const r of (questRows as Array<Record<string, unknown>> | null) ?? []) {
    if (typeof r.user_id !== 'string') continue
    touch(
      r.user_id,
      r.profiles,
      0,
      Number(r.points_awarded) || 0,
      (r.submitted_at as string) || (r.reviewed_at as string) || new Date(0).toISOString(),
    )
  }

  const sorted = [...map.values()]
    .map((item) => ({
      ...item,
      totalPoints: Math.max(0, item.boothPoints + item.sidequestPoints),
    }))
    .filter((item) => item.totalPoints > 0)
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
      return a.lastPointAt.localeCompare(b.lastPointAt)
    })
    .slice(0, limit)

  const entries: LeaderboardEntry[] = sorted.map((item, idx) => ({
    rank: idx + 1,
    userId: item.userId,
    fullName: item.fullName,
    institution: item.institution,
    totalPoints: item.totalPoints,
    boothPoints: item.boothPoints,
    sidequestPoints: item.sidequestPoints,
    lastPointAt: item.lastPointAt,
  }))

  return { window, entries }
}

export async function getUserTotalPoints(userId: string): Promise<number> {
  const db = createServiceClient()
  const [{ data: scans }, { data: quests }] = await Promise.all([
    db.from('booth_scan_events').select('points_awarded').eq('user_id', userId),
    db.from('sidequest_submissions').select('points_awarded').eq('user_id', userId).eq('status', 'approved'),
  ])

  const boothSum = ((scans as Array<{ points_awarded?: number }> | null) ?? []).reduce(
    (acc, r) => acc + (Number(r.points_awarded) || 0),
    0,
  )
  const questSum = ((quests as Array<{ points_awarded?: number }> | null) ?? []).reduce(
    (acc, r) => acc + (Number(r.points_awarded) || 0),
    0,
  )
  return Math.max(0, boothSum + questSum)
}

export type RewardTierStatus = RewardTier & {
  claimedCount: number
  remainingStock: number | null
  userClaimed: boolean
  eligible: boolean
}

export async function getRewardTiersWithStatus(userId?: string | null): Promise<{
  totalPoints: number
  tiers: RewardTierStatus[]
}> {
  const db = createServiceClient()
  const [{ data: tiersData }, { data: claimsData }, totalPoints] = await Promise.all([
    db.from('reward_tiers').select('*').eq('is_active', true).order('tier_number', { ascending: true }),
    db.from('reward_claims').select('id, tier_id, user_id'),
    userId ? getUserTotalPoints(userId) : Promise.resolve(0),
  ])

  const tiers = (tiersData as RewardTier[] | null) ?? []
  const claims = (claimsData as Array<{ id: string; tier_id: string; user_id: string }> | null) ?? []

  const countByTier = new Map<string, number>()
  const claimedByUser = new Set<string>()

  for (const c of claims) {
    countByTier.set(c.tier_id, (countByTier.get(c.tier_id) ?? 0) + 1)
    if (userId && c.user_id === userId) claimedByUser.add(c.tier_id)
  }

  return {
    totalPoints,
    tiers: tiers.map((tier) => {
      const claimedCount = countByTier.get(tier.id) ?? 0
      const remainingStock =
        tier.total_stock === null || tier.total_stock === undefined
          ? null
          : Math.max(0, tier.total_stock - claimedCount)
      const userClaimed = claimedByUser.has(tier.id)
      const inStock = remainingStock === null || remainingStock > 0
      const eligible = Boolean(userId && !userClaimed && inStock && totalPoints >= tier.min_points)

      return {
        ...tier,
        claimedCount,
        remainingStock,
        userClaimed,
        eligible,
      }
    }),
  }
}

export type ClaimRewardParams = {
  userId: string
  tierId?: string
  tierNumber?: number
  claimedByStaffId?: string
}

export type ClaimRewardResult =
  | { ok: true; claim: RewardClaim; tier: RewardTier; totalPoints: number }
  | {
      ok: false
      code:
        | 'TIER_NOT_FOUND'
        | 'INSUFFICIENT_POINTS'
        | 'ALREADY_CLAIMED'
        | 'OUT_OF_STOCK'
        | 'COMMITTEE_ACCOUNT'
        | 'DATABASE_ERROR'
      message: string
    }

export async function claimRewardTier(params: ClaimRewardParams): Promise<ClaimRewardResult> {
  const db = createServiceClient()

  const { data: profile } = await db.from('profiles').select('id, role_a').eq('id', params.userId).maybeSingle()
  if ((profile as { role_a?: string | null } | null)?.role_a) {
    return {
      ok: false,
      code: 'COMMITTEE_ACCOUNT',
      message: 'Akun panitia/stakeholder/sponsor tidak dapat menukarkan hadiah pengunjung.',
    }
  }

  let tierQuery = db.from('reward_tiers').select('*').eq('is_active', true)
  if (params.tierId) tierQuery = tierQuery.eq('id', params.tierId)
  else if (params.tierNumber !== undefined) tierQuery = tierQuery.eq('tier_number', params.tierNumber)
  else return { ok: false, code: 'TIER_NOT_FOUND', message: 'Tier hadiah tidak ditemukan.' }

  const { data: tierRow } = await tierQuery.maybeSingle()
  if (!tierRow) {
    return { ok: false, code: 'TIER_NOT_FOUND', message: 'Tier hadiah tidak ditemukan atau tidak aktif.' }
  }
  const tier = tierRow as RewardTier

  const [totalPoints, { data: existingClaim }, { count: claimedCount }] = await Promise.all([
    getUserTotalPoints(params.userId),
    db.from('reward_claims').select('*').eq('tier_id', tier.id).eq('user_id', params.userId).maybeSingle(),
    db.from('reward_claims').select('id', { count: 'exact', head: true }).eq('tier_id', tier.id),
  ])

  if (existingClaim) {
    return { ok: false, code: 'ALREADY_CLAIMED', message: 'Anda sudah pernah mengklaim hadiah pada tier ini.' }
  }

  if (totalPoints < tier.min_points) {
    return {
      ok: false,
      code: 'INSUFFICIENT_POINTS',
      message: `Poin Anda (${totalPoints}) belum mencapai batas minimal tier ini (${tier.min_points} poin).`,
    }
  }

  if (tier.total_stock !== null && tier.total_stock !== undefined && (claimedCount ?? 0) >= tier.total_stock) {
    return { ok: false, code: 'OUT_OF_STOCK', message: 'Kuota hadiah untuk tier ini sudah habis.' }
  }

  const { data: inserted, error: insertError } = await db
    .from('reward_claims')
    .insert({
      tier_id: tier.id,
      user_id: params.userId,
      points_at_claim: totalPoints,
      claimed_by: params.claimedByStaffId ?? params.userId,
    })
    .select('*')
    .single()

  if (insertError || !inserted) {
    if (insertError?.code === '23505') {
      return { ok: false, code: 'ALREADY_CLAIMED', message: 'Anda sudah pernah mengklaim hadiah pada tier ini.' }
    }
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal mencatat klaim hadiah.' }
  }

  await recordAuditLog({
    userId: params.claimedByStaffId ?? params.userId,
    action: 'REWARD_TIER_CLAIMED',
    targetTable: 'reward_claims',
    recordId: (inserted as RewardClaim).id,
    metadata: {
      tierNumber: tier.tier_number,
      rewardName: tier.reward_name,
      visitorId: params.userId,
      pointsAtClaim: totalPoints,
    },
  })

  return { ok: true, claim: inserted as RewardClaim, tier, totalPoints }
}
