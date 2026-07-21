import { type NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

// Next.js 16 renamed the `middleware` convention to `proxy` (Node runtime, no edge config).
// Refreshes the Supabase auth session on every matched request and guards `/dashboard`.
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (route handlers do their own auth)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf)$).*)',
  ],
}
