"use client"

import { useSyncExternalStore } from "react"

/*
  UI-only "is someone signed in?" check for public pages (navbar, hero CTA).

  It looks for the Supabase session cookie (`sb-<ref>-auth-token`, possibly chunked as `.0`,
  `.1`, ...) instead of loading @supabase/supabase-js (~60 KB gzipped) and calling Supabase Auth
  on every page view. It is not a security check: an expired session still has the cookie, and
  the proxy + server components decide what a visitor may actually see.
*/

const SESSION_COOKIE = /(?:^|;\s*)sb-[^=;]+-auth-token(?:\.\d+)?=/

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

const hasSessionCookie = () => SESSION_COOKIE.test(document.cookie)

/** Re-reads the cookie everywhere, e.g. right after signing out. */
export function notifySessionChanged() {
  for (const listener of listeners) listener()
}

/** `false` on the server and during hydration, so the signed-out layout renders first. */
export function useHasSession(): boolean {
  return useSyncExternalStore(subscribe, hasSessionCookie, () => false)
}
