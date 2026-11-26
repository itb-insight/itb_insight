import { type NextRequest } from 'next/server'

import { getLive } from '@/features/admin/data/adapters'
import { getScopedUser } from '@/lib/admin'
import { apiError, apiSuccess } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

// D-day live panels in /admin poll this every 30 s. The figures are cached on the server for 30 s
// (adapters.ts), so many admins watching cost one query per 30 s.
export async function GET(request: NextRequest) {
  const auth = await getScopedUser(request, ['admin'])
  if (!auth.ok) return apiError(auth.code, auth.message, auth.status)

  const response = apiSuccess(await getLive())
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
