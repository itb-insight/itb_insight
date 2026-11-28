import { after, type NextRequest } from 'next/server'

import { getAdminAccess } from '@/lib/admin-access'
import { apiError, apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { recordAuditLog } from '@/lib/audit'
import { getAuthenticatedUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

// Insight Arcade prize stock (migration 0039). Body: { tier: 101 | 102 | 103, delta } to add or
// remove that many, or { tier, left } to set the number left (after counting the box).
// Handouts lower the stock on their own (left = total_stock - claims).
// Access: admins and arcade_duties prize_desk, the same people who run the desk.
const MESSAGES: Record<string, [number, string]> = {
  INVALID: [400, 'Isi jumlah perubahan atau sisa stok.'],
  TIER_NOT_FOUND: [404, 'Hadiah tidak ditemukan.'],
  BELOW_ZERO: [409, 'Sisa stok tidak bisa kurang dari 0.'],
  TOO_MANY: [400, 'Jumlah terlalu besar.'],
}

const TIERS = new Set([101, 102, 103])

function intOrNull(value: unknown, min: number, max: number): number | null | undefined {
  if (value === undefined || value === null) return null
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) return undefined
  return value
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) return unauthorizedResponse()
  const access = await getAdminAccess(auth.user)
  if (!access.prizeDesk) return apiError('FORBIDDEN', 'Akses ditolak: hanya petugas meja hadiah.', 403)

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const tier = body?.tier
  if (typeof tier !== 'number' || !TIERS.has(tier)) return apiError('INVALID_INPUT', 'Hadiah tidak dikenal.', 400)
  const delta = intOrNull(body?.delta, -10000, 10000)
  const left = intOrNull(body?.left, 0, 100000)
  if (delta === undefined || left === undefined || (delta === null) === (left === null) || delta === 0) {
    return apiError('INVALID_INPUT', 'Isi jumlah perubahan atau sisa stok.', 400)
  }

  const { data, error } = await createServiceClient().rpc('arcade_adjust_prize_stock', {
    p_tier_number: tier,
    p_delta: delta,
    p_left: left,
  })
  if (error) {
    console.error('[arcade-prize-stock] adjust failed', error)
    return apiError('SERVER_ERROR', 'Gagal mengubah stok.', 500)
  }
  const result = (data ?? {}) as { ok?: boolean; code?: string; claimed?: number; leftBefore?: number; left?: number }
  if (!result.ok) {
    const [status, message] = MESSAGES[result.code ?? ''] ?? [500, 'Gagal mengubah stok.']
    return apiError((result.code ?? 'SERVER_ERROR') as Uppercase<string>, message, status)
  }

  after(() =>
    recordAuditLog({
      userId: auth.user.id,
      action: 'ARCADE_PRIZE_STOCK',
      targetTable: 'reward_tiers',
      metadata: { tier, delta, setLeft: left, leftBefore: result.leftBefore, left: result.left },
    }),
  )
  return apiSuccess({ tier, left: result.left ?? 0, claimed: result.claimed ?? 0 })
}
