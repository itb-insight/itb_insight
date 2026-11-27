import { type NextRequest } from 'next/server'

import { getDDay } from '@/features/admin/data/adapters'
import { getScopedUser } from '@/lib/admin'
import { getAdminAccess } from '@/lib/admin-access'
import { apiError, apiSuccess } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// The /admin/d-day page polls this every 30 s. Every staff member may read it (staffAccessFor in
// src/lib/admin-access.ts): admins and admin_roles staff pass getScopedUser; committee profiles
// (role_a 'staff' / 'stakeholder') and booth staff pass the profile check after it. The figures
// are cached on the server for 30 s (adapters.ts), so many staff watching cost one query per 30 s.
export async function GET(request: NextRequest) {
  const auth = await getScopedUser(request, ['field_staff', 'gate_staff', 'booth_staff'])
  if (!auth.ok) {
    // 401 (signed out) stays a 401.
    if (auth.status === 401) return apiError(auth.code, auth.message, auth.status)
    const user = await getAuthenticatedUser(request)
    if (!user.ok || !(await getAdminAccess(user.user)).staff) return apiError(auth.code, auth.message, auth.status)
  }

  const response = apiSuccess(await getDDay())
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
