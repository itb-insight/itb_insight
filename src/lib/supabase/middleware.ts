import { createServerClient } from '@supabase/ssr'
import { isAuthRetryableFetchError } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

// Session refresh + route protection, called from the root `proxy.ts` (Next 16 renamed
// `middleware` → `proxy`). Ported from the `web` repo, redirect target changed to `/login`.

function createSupabaseResponse(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
}

function isMissingRefreshTokenError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const authError = error as { code?: string; message?: string }
  return authError.code === 'refresh_token_not_found' || authError.message?.includes('Refresh Token Not Found')
}

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  request.cookies
    .getAll()
    .filter(({ name }) => name.startsWith('sb-') && (name.includes('auth-token') || name.includes('code-verifier')))
    .forEach(({ name }) => {
      request.cookies.delete(name)
      response.cookies.set(name, '', { maxAge: 0, path: '/' })
    })
}

const PROTECTED_PREFIXES = ['/dashboard', '/admin']

export function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

const hasAuthCookie = (request: NextRequest) =>
  request.cookies.getAll().some(({ name }) => name.startsWith('sb-') && name.includes('auth-token'))

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(url)
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = createSupabaseResponse(request)

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse
  }

  // No session cookie: nothing to refresh, so skip Supabase entirely (most public traffic).
  if (!hasAuthCookie(request)) {
    return isProtectedPath(request.nextUrl.pathname) ? redirectToLogin(request) : supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = createSupabaseResponse(request)
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  let signedIn = false
  let error: unknown = null

  try {
    // getClaims() refreshes an expired session and verifies the JWT. With asymmetric JWT signing
    // keys (Supabase → Settings → JWT Keys) it verifies locally, without a round trip to Supabase
    // Auth on every request; with the legacy shared secret it falls back to asking the server.
    const result = await supabase.auth.getClaims()
    signedIn = Boolean(result.data?.claims?.sub)
    error = result.error
  } catch (caughtError) {
    if (!isMissingRefreshTokenError(caughtError)) {
      throw caughtError
    }
    error = caughtError
  }

  // A session cookie whose session is dead (revoked, refresh token already used, corrupt or
  // unreadable chunks) is deleted, so the browser stops looking signed in: the navbar and hero
  // read the cookie, not Supabase (src/shared/hooks/useHasSession.ts). Network errors and
  // Supabase 5xx are transient, so those cookies are kept for the next request to retry.
  const sessionIsDead = !signedIn && !isAuthRetryableFetchError(error)

  if (sessionIsDead) {
    clearSupabaseAuthCookies(request, supabaseResponse)
  }

  // Signed-out visitors to the dashboard or admin go to /login. The admin role itself is checked
  // in src/app/admin/layout.tsx and in every admin API route.
  if (!signedIn && isProtectedPath(request.nextUrl.pathname)) {
    const redirectResponse = redirectToLogin(request)
    if (sessionIsDead) {
      clearSupabaseAuthCookies(request, redirectResponse)
    }
    return redirectResponse
  }

  return supabaseResponse
}
