import { type NextRequest } from 'next/server'

import { getLive } from '@/features/admin/data/adapters'
import { getScopedUser } from '@/lib/admin'
import { getAdminAccess } from '@/lib/admin-access'
import { apiError, apiSuccess } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// D-day live panels in /admin poll this every 30 s. Admins, and booth staff (role_b 'booth'), who
// also see the /admin dashboard (src/app/admin/page.tsx). The figures are cached on the server for 30 s
// (adapters.ts), so many admins watching cost one query per 30 s.
export async function GET(request: NextRequest) {
  const auth = await getScopedUser(request, ['admin'])
  if (!auth.ok) {
    // Not an admin: booth staff may read it too. 401 (signed out) stays a 401.
    if (auth.status === 401) return apiError(auth.code, auth.message, auth.status)
    const user = await getAuthenticatedUser(request)
    if (!user.ok || !(await getAdminAccess(user.user)).booth) return apiError(auth.code, auth.message, auth.status)
  }

  const response = apiSuccess(await getLive())
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
