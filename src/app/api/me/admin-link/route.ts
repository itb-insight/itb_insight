import { type NextRequest } from 'next/server'

import { getAdminLink } from '@/lib/admin-access'
import { apiSuccess, unauthorizedResponse } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'

// Where the signed-in user's header "Admin" link goes: { href: string | null }.
// Only a UI hint for the navbar; the admin pages and APIs check the role themselves.
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if (!auth.ok) {
    return unauthorizedResponse()
  }

  const response = apiSuccess({ href: await getAdminLink(auth.user) })
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
