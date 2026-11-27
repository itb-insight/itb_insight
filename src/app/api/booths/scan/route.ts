import { type NextRequest } from 'next/server'

import { getScopedUser } from '@/lib/admin'
import { apiError } from '@/lib/api-response'
import { BOOTH_AWARD_ROLES } from '@/lib/booths'

// Retired with Insight Arcade (migration 0030): booth points are awarded only at /admin/booth
// (POST /api/booth-points/scan -> public.arcade_award_booth), which enforces the game window, the
// kill switch and the once-per-booth rules in the database. This old admin_roles flow answered 410
// from D-day on. Manual corrections move to the Quest Ops help desk.
export async function POST(request: NextRequest) {
  const auth = await getScopedUser(request, [...BOOTH_AWARD_ROLES])
  if (!auth.ok) {
    return apiError(auth.code, auth.message, auth.status)
  }
  return apiError('GONE', 'Scanner lama sudah dinonaktifkan. Pakai halaman Booth di /admin/booth.', 410)
}
