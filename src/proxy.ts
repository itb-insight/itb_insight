import { NextResponse, type NextRequest } from 'next/server'
import { getMaintenanceState, isPageUnderMaintenance } from './lib/maintenance'
import { updateSession } from '@/lib/supabase/middleware'

// Next.js 16 renamed the `middleware` convention to `proxy` (Node runtime, no edge config).
/*
  1. Maintenance mode: Rewrites blocked requests to /maintenance/* with a 503.
  2. Refreshes the Supabase auth session on every matched request and guard `/dashboard`.
*/

export async function proxy(request: NextRequest) {
  const maintenance = handleMaintenance(request);
  if (maintenance) return maintenance;

  return updateSession(request)
}


/*
Returns a response if the request is blocked (or is a bypass request), otherwise, null
*/
function handleMaintenance(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl
  const { site, pages } = getMaintenanceState()

  if (!site && pages.length === 0) return null

  // Let team through: Visit any page with ?bypass=<secret> once to get a cookie
  const secret = process.env.MAINTENANCE_BYPASS_SECRET
  if (secret && searchParams.get('bypass') === secret) {
    const clean = request.nextUrl.clone()
    clean.searchParams.delete('bypass')
    const res = NextResponse.redirect(clean)
    res.cookies.set(BYPASS_COOKIE, secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    return res
  }
  if (secret && request.cookies.get(BYPASS_COOKIE)?.value === secret)
    return null

  const blocked = site || isPageUnderMaintenance(pathname, pages)
  if (!blocked) return null

  const target = site ? '/maintenance/site': '/maintenance/page'
  return NextResponse.rewrite(new URL(target, request.url), {
    status: 503,
    headers: { 'Retry-After': '3600', 'Cache-Control': 'no-store' },
  })
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
