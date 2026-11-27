"use client"

import { useEffect, useState } from "react"

import { useHasSession } from "@/shared/hooks/useHasSession"

/*
  The header's "Admin" link for the signed-in user, or null (rules: src/lib/admin-nav.ts).
  Asked of GET /api/me/admin-link only when a session cookie exists, once per page load: the desktop
  nav and the mobile menu share the request. Signing out drops the cached answer.
  A UI hint only; the admin pages decide access themselves.
*/

let pending: Promise<string | null> | null = null

function fetchAdminLink(): Promise<string | null> {
  pending ??= fetch("/api/me/admin-link", { credentials: "same-origin", cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) return null
      const body = (await res.json()) as { data?: { href?: unknown } | null }
      const href = body.data?.href
      // Same-origin paths only, never something that could leave the site.
      return typeof href === "string" && href.startsWith("/") && !href.startsWith("//") ? href : null
    })
    .catch(() => {
      pending = null // let the next mount retry after a network error
      return null
    })
  return pending
}

export function useAdminLink(): string | null {
  const signedIn = useHasSession()
  const [href, setHref] = useState<string | null>(null)

  useEffect(() => {
    if (!signedIn) {
      pending = null
      return
    }
    let cancelled = false
    fetchAdminLink().then((value) => {
      if (!cancelled) setHref(value)
    })
    return () => {
      cancelled = true
    }
  }, [signedIn])

  return signedIn ? href : null
}
