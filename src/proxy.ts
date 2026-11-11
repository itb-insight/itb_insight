import { NextResponse, type NextRequest } from 'next/server'
import { getMaintenanceState, isPageUnderMaintenance } from './lib/maintenance'
import { COUNTDOWN_PAGE, isCountdownAsset, isCountdownOnly } from './lib/countdown'
import { updateSession } from '@/lib/supabase/middleware'

// Next.js 16 renamed the `middleware` convention to `proxy` (Node runtime, no edge config).
/*
  0. Countdown-only mode: Every page is rewritten to the static countdown, everything else is 503.
  1. Maintenance mode: Rewrites blocked requests to /maintenance/* with a 503.
  2. Refreshes the Supabase auth session on every matched request and guard `/dashboard`.
*/

const BYPASS_COOKIE = 'maintenance-bypass'

export async function proxy(request: NextRequest) {
  if (isCountdownOnly()) return handleCountdownOnly(request)

  // API routes do their own auth; the proxy only matches them for countdown mode
  if (isApiRoute(request.nextUrl.pathname)) return NextResponse.next()

  const maintenance = handleMaintenance(request);
  if (maintenance) return maintenance;

  return updateSession(request)
}


function isApiRoute(pathname: string) {
  return pathname === '/api' || pathname.startsWith('/api/')
}

/*
COUNTDOWN_ONLY=true: no bypass, no other page / endpoint / auth flow is reachable
*/
function handleCountdownOnly(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  const isRead = request.method === 'GET' || request.method === 'HEAD'

  if (isRead && isCountdownAsset(pathname)) return NextResponse.next()

  const noStore = { 'Cache-Control': 'no-store' }

  // API routes, server actions, form posts, etc.
  if (!isRead || isApiRoute(pathname)) {
    return NextResponse.json(
      { success: false, data: null, error: { code: 'COUNTDOWN_ONLY', message: 'Coming soon.' } },
      { status: 503, headers: { ...noStore, 'Retry-After': '3600' } },
    )
  }

  return NextResponse.rewrite(new URL(COUNTDOWN_PAGE, request.url), { headers: noStore })
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
     * - (api IS matched so countdown mode can block it; it's passed through otherwise)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf)$).*)',
  ],
}
