"use client"

import { useSyncExternalStore } from "react"

/*
  UI-only "is someone signed in?" check for public pages (navbar, hero CTA).

  It looks for this project's Supabase session cookie (`sb-<ref>-auth-token`, possibly chunked as
  `.0`, `.1`, ...) instead of loading @supabase/supabase-js (~60 KB gzipped) and calling Supabase
  Auth on every page view. It is not a security check: the proxy + server components decide what a
  visitor may actually see. The proxy also deletes the cookie once the session behind it is dead
  (see clearSupabaseAuthCookies in src/lib/supabase/middleware.ts), so this stays close to the truth.

  Only the cookie for NEXT_PUBLIC_SUPABASE_URL counts: a leftover `sb-*` cookie from another
  Supabase project on the same host (common on localhost) must not make the UI look signed in.
*/

/** The cookie name supabase-js uses by default: `sb-<first label of the project host>-auth-token`. */
export function sessionCookieKey(supabaseUrl: string | undefined): string | null {
  if (!supabaseUrl) return null
  try {
    return `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`
  } catch {
    return null
  }
}

const isSessionCookieName = (name: string, key: string) =>
  name === key || (name.startsWith(`${key}.`) && /^\d+$/.test(name.slice(key.length + 1)))

function cookieEntries(cookieHeader: string): Array<[string, string]> {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const eq = part.indexOf("=")
      return eq === -1 ? [part, ""] : [part.slice(0, eq), part.slice(eq + 1)]
    })
}

/** True when `cookieHeader` holds a non-empty session cookie (or chunk) named after `key`. */
export function cookieHasSession(cookieHeader: string, key: string | null): boolean {
  if (!key) return false
  return cookieEntries(cookieHeader).some(([name, value]) => isSessionCookieName(name, key) && value !== "")
}

const SESSION_KEY = sessionCookieKey(process.env.NEXT_PUBLIC_SUPABASE_URL)

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Signing in or out in another tab changes the cookie; re-check when this tab comes back.
  window.addEventListener("focus", listener)
  document.addEventListener("visibilitychange", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("focus", listener)
    document.removeEventListener("visibilitychange", listener)
  }
}

const hasSessionCookie = () => cookieHasSession(document.cookie, SESSION_KEY)

/** Re-reads the cookie everywhere, e.g. right after signing out. */
export function notifySessionChanged() {
  for (const listener of listeners) listener()
}

/**
  Deletes this project's session cookies (and the PKCE verifier) in the browser. Used after
  `auth.signOut()`, which leaves the cookie in place when it fails (network error, a refresh that
  could not complete), so the UI would otherwise still look signed in.
*/
export function clearSessionCookies() {
  if (!SESSION_KEY) return
  for (const [name] of cookieEntries(document.cookie)) {
    if (isSessionCookieName(name, SESSION_KEY) || name === `${SESSION_KEY}-code-verifier`) {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
    }
  }
}

/** `false` on the server and during hydration, so the signed-out layout renders first. */
export function useHasSession(): boolean {
  return useSyncExternalStore(subscribe, hasSessionCookie, () => false)
}
