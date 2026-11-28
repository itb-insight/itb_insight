import { after, type NextRequest } from 'next/server'

import { adminEmailList } from '@/lib/admin'
import { getAdminAccess } from '@/lib/admin-access'
import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { recordAuditLog } from '@/lib/audit'
import { getAuthenticatedUser } from '@/lib/auth'
import { parseTextFields } from '@/lib/input'
import { parseVisitorQr } from '@/lib/qr'
import { createServiceClient } from '@/lib/supabase/server'

// Insight Arcade prize desk (migration 0032). Body: { qrCode, tier?: '101' | '102' | '103' }.
//   no tier -> the visitor and what they already received; tier -> hand it over
//   (arcade_claim_prize: eligibility, stock and one per person, under a lock).
// The desk picks a prize first and sends the tier with every scan (src/features/arcade-ops/PrizeDesk.tsx),
// so a refusal names the visitor: the staff member is already looking at the next person.
// Access: admins and arcade_duties prize_desk.
const MESSAGES: Record<string, [number, string]> = {
  ALREADY_CLAIMED: [409, 'sudah pernah menerima hadiah ini.'],
  OUT_OF_STOCK: [409, 'Stok habis.'],
  NOT_ELIGIBLE: [403, 'belum memenuhi syarat hadiah ini.'],
  NOT_PUBLISHED: [403, 'Hasil akhir belum diumumkan.'],
  COMMITTEE_ACCOUNT: [403, 'Akun panitia tidak bisa menerima hadiah.'],
  SELF_CLAIM: [403, 'Tidak bisa memberi hadiah ke akun sendiri.'],
  TIER_NOT_FOUND: [404, 'Hadiah tidak ditemukan.'],
  PAUSED: [423, 'Insight Arcade sedang dijeda panitia.'],
  CLOSED: [403, 'Pengambilan hadiah sudah ditutup.'],
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) return unauthorizedResponse()
  const access = await getAdminAccess(auth.user)
  if (!access.prizeDesk) return apiError('FORBIDDEN', 'Akses ditolak: hanya petugas meja hadiah.', 403)

  const fields = parseTextFields(await request.json().catch(() => null), { qrCode: 300, tier: 4 })
  const { qrCode, tier } = fields.ok ? fields.values : {}
  const token = qrCode ? parseVisitorQr(qrCode) : null
  if (!token) return apiError('INVALID_QR', 'QR ini bukan QR profil pengunjung ITB Insight.', 400)
  if (tier && !['101', '102', '103'].includes(tier)) return apiError('INVALID_INPUT', 'Hadiah tidak dikenal.', 400)

  const supabase = createServiceClient()
  const { data: ticket } = await supabase
    .from('visitor_tickets')
    .select('user_id, profiles!visitor_tickets_user_id_fkey(full_name)')
    .eq('qr_code', token)
    .maybeSingle()
  if (!ticket) return apiError('TICKET_NOT_FOUND', 'Pengunjung tidak ditemukan.', 404)
  const userId = ticket.user_id as string
  const profile = (Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles) as { full_name?: string } | null
  const name = profile?.full_name?.trim() || 'Pengunjung'

  let left: number | null = null
  if (tier) {
    const { data, error } = await supabase.rpc('arcade_claim_prize', {
      p_user: userId,
      p_tier_number: Number(tier),
      p_staff: auth.user.id,
      p_admin_emails: adminEmailList(),
    })
    if (error) {
      console.error('[arcade-prize] claim failed', error)
      return apiError('SERVER_ERROR', 'Gagal mencatat hadiah.', 500)
    }
    const result = (data ?? {}) as { ok?: boolean; code?: string; remaining?: number | null }
    if (!result.ok) {
      const [status, message] = MESSAGES[result.code ?? ''] ?? [500, 'Gagal mencatat hadiah.']
      const named = result.code === 'ALREADY_CLAIMED' || result.code === 'NOT_ELIGIBLE' ? `${name} ${message}` : message
      return apiError((result.code ?? 'SERVER_ERROR') as Uppercase<string>, named, status)
    }
    left = result.remaining ?? null
    after(() =>
      recordAuditLog({ userId: auth.user.id, action: 'ARCADE_PRIZE_HANDED', metadata: { visitorId: userId, tier } }),
    )
  }

  const { data: claims } = await supabase
    .from('reward_claims')
    .select('claimed_at, reward_tiers!inner(tier_number)')
    .eq('user_id', userId)
  const claimed = ((claims ?? []) as Array<{ reward_tiers: { tier_number: number } | Array<{ tier_number: number }> }>).map((c) =>
    String((Array.isArray(c.reward_tiers) ? c.reward_tiers[0] : c.reward_tiers)?.tier_number),
  )

  return apiSuccess({ visitor: { name }, claimed, handed: tier ?? null, left })
}
