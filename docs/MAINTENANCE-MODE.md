# Maintenance Mode

How to put the whole site, or specific pages, under maintenance. For now the toggle is set in `.env.local`.

## How it works

`src/proxy.ts` runs before every matched request (Next 16 renamed `middleware` to `proxy`; it runs on the Node.js runtime). It reads the maintenance flags. When a request is blocked, the proxy **rewrites** it to a maintenance page and returns status **503** with a `Retry-After` header.

- A rewrite keeps the URL the visitor typed, the same way the 404 and 401 pages do.
- 503 + `Retry-After` tells search engines and uptime monitors that the outage is temporary, so the site doesn't get deindexed.
- The check runs **before** `updateSession()`, so blocked requests never reach Supabase.

There are two modes:

| Mode | Env var | Page shown |
|---|---|---|
| Whole site | `MAINTENANCE_SITE=true` | `/maintenance/site`: "This website is under maintenance" |
| Specific pages | `MAINTENANCE_PAGES=/competition,/seminar` | `/maintenance/page`: "This page is under maintenance" |

A path prefix also blocks its subpaths: `/competition` blocks `/competition` and `/competition/anything`, but not `/competition2`.

## Files

| Action | File |
|---|---|
| Create | `src/lib/maintenance.ts` |
| Create | `src/app/maintenance/site/page.tsx` |
| Create | `src/app/maintenance/page/page.tsx` |
| Modify | `src/proxy.ts` |
| Modify | `.env.local` (and `.env.example` if the team keeps one) |

---

## 1. Flag source: `src/lib/maintenance.ts` (create)

This is the only file that needs to change if the toggle later moves out of env vars (see [Moving off env vars](#later-moving-off-env-vars)).

```ts
// Maintenance flags, read by `src/proxy.ts` on every request.
// Do NOT prefix these with NEXT_PUBLIC_: those get inlined at build time,
// so changing them would require a rebuild.

export type MaintenanceState = {
  site: boolean
  pages: string[]
}

export function getMaintenanceState(): MaintenanceState {
  return {
    site: process.env.MAINTENANCE_SITE === 'true',
    // comma-separated path prefixes, e.g. "/competition,/seminar"
    pages: (process.env.MAINTENANCE_PAGES ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
  }
}

export function isPageUnderMaintenance(pathname: string, pages: string[]) {
  return pages.some((p) => pathname === p || pathname.startsWith(p + '/'))
}
```

## 2. Maintenance pages (create)

These reuse `ErrorLayout` so they match the 404 and 401 pages. Both set `noindex` so the maintenance pages themselves never get indexed.

### `src/app/maintenance/site/page.tsx`

```tsx
/** ========================================================
 * MAINTENANCE PAGE: whole site
 * Shown by `src/proxy.ts` (rewrite + 503) when MAINTENANCE_SITE=true
 ===========================================================*/

import type { Metadata } from "next"
import ErrorLayout from "@/shared/components/ErrorLayout/ErrorLayout"

export const metadata: Metadata = {
  title: "Under Maintenance",
  robots: { index: false, follow: false },
}

export default function SiteMaintenance() {
  return (
    <ErrorLayout>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '4rem' }}>Under Maintenance</h1>
        <p style={{ fontSize: '1.5rem' }}>This website is under maintenance. Please check back soon.</p>
      </div>
    </ErrorLayout>
  )
}
```

> No `ReturnHomeButton` here: the home page is under maintenance too.

### `src/app/maintenance/page/page.tsx`

```tsx
/** ========================================================
 * MAINTENANCE PAGE: single page / section
 * Shown by `src/proxy.ts` (rewrite + 503) for paths in MAINTENANCE_PAGES
 ===========================================================*/

import type { Metadata } from "next"
import ErrorLayout from "@/shared/components/ErrorLayout/ErrorLayout"
import ReturnHomeButton from "@/shared/components/ErrorLayout/ReturnHomeButton"

export const metadata: Metadata = {
  title: "Under Maintenance",
  robots: { index: false, follow: false },
}

export default function PageMaintenance() {
  return (
    <ErrorLayout>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '4rem' }}>Under Maintenance</h1>
        <p style={{ fontSize: '1.5rem' }}>This page is under maintenance. Please check back soon.</p>
        <ReturnHomeButton />
      </div>
    </ErrorLayout>
  )
}
```

Style these to the hi-fi design later, the same way the 404 page was done.

## 3. Proxy: `src/proxy.ts` (modify)

Add the maintenance check **before** `updateSession()`, and add `maintenance` to the matcher's exclusions. Full file after the change:

```ts
import { NextResponse, type NextRequest } from 'next/server'

import { getMaintenanceState, isPageUnderMaintenance } from '@/lib/maintenance'
import { updateSession } from '@/lib/supabase/middleware'

const BYPASS_COOKIE = 'maintenance_bypass'

// Next.js 16 renamed the `middleware` convention to `proxy` (Node runtime, no edge config).
// 1. Maintenance mode: rewrites blocked requests to /maintenance/* with a 503.
// 2. Refreshes the Supabase auth session on every matched request and guards `/dashboard`.
export async function proxy(request: NextRequest) {
  const maintenance = handleMaintenance(request)
  if (maintenance) return maintenance

  return updateSession(request)
}

// Returns a response if the request is blocked (or is a bypass request), otherwise null.
function handleMaintenance(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl
  const { site, pages } = getMaintenanceState()

  if (!site && pages.length === 0) return null

  // Let the team through: visit any page with ?bypass=<secret> once to get a cookie
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
  if (secret && request.cookies.get(BYPASS_COOKIE)?.value === secret) return null

  const blocked = site || isPageUnderMaintenance(pathname, pages)
  if (!blocked) return null

  const target = site ? '/maintenance/site' : '/maintenance/page'
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
     * - api (route handlers do their own auth; also keeps Midtrans webhooks working)
     * - maintenance (the maintenance pages themselves)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|maintenance|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf)$).*)',
  ],
}
```

What changed compared to the current file:

- New imports: `NextResponse` and the two helpers from `@/lib/maintenance`.
- New `handleMaintenance()`, called first in `proxy()`.
- `maintenance` added to the matcher's negative lookahead.

### Why `/api` stays excluded

The existing matcher already skips `/api`, so **API routes stay up during maintenance**. That's intended: Midtrans payment webhooks (`/api/...`) keep working, and no payment notifications are lost. If you ever need to block APIs too, remove `api` from the matcher and add this before the rewrite, so APIs get JSON instead of HTML:

```ts
if (pathname.startsWith('/api')) {
  return NextResponse.json(
    { error: 'Under maintenance' },
    { status: 503, headers: { 'Retry-After': '3600', 'Cache-Control': 'no-store' } },
  )
}
```

If you do this, keep webhook and health paths out of the block. The existing `/api` routes also do their own auth, and removing `api` from the matcher means `updateSession()` will run on them too. Check that this is OK before changing it.

## 4. Env vars: `.env.local` (modify)

```bash
# MAINTENANCE
# Whole site: "true" to enable, anything else (or unset) to disable
MAINTENANCE_SITE=false
# Specific pages: comma-separated path prefixes, e.g. /competition,/seminar
MAINTENANCE_PAGES=
# Optional: secret for the team bypass (?bypass=<secret>). Leave empty to disable bypass.
MAINTENANCE_BYPASS_SECRET=
```

On Vercel, set the same variables in Project Settings → Environment Variables (or `vercel env add`) and redeploy.

### Toggling

| Want | Set |
|---|---|
| Whole site down | `MAINTENANCE_SITE=true` |
| Only some pages down | `MAINTENANCE_SITE=false`, `MAINTENANCE_PAGES=/competition,/seminar` |
| Everything back up | `MAINTENANCE_SITE=false`, `MAINTENANCE_PAGES=` |

`MAINTENANCE_SITE=true` takes precedence over `MAINTENANCE_PAGES`.

### When changes take effect

- **`next dev`**: Next reloads `.env.local` when it changes. Refresh the page; if it doesn't apply, restart the dev server.
- **`next start` / production**: env vars are read when the server starts, so **restart the server or redeploy**.
- These must **not** start with `NEXT_PUBLIC_`. Those are inlined at build time and would need a full rebuild.

## 5. Testing

1. Set `MAINTENANCE_SITE=true` and open `http://localhost:3000/` and `/competition`. Both should show "This website is under maintenance" and the URL should not change.
2. Check the status and headers:
   ```bash
   curl -I http://localhost:3000/competition
   # expect: HTTP/1.1 503, Retry-After: 3600, Cache-Control: no-store
   ```
3. Set `MAINTENANCE_SITE=false` and `MAINTENANCE_PAGES=/competition`:
   - `/competition` and `/competition/<anything>` → "This page is under maintenance"
   - `/`, `/seminar`, and `/competition2` → normal
4. Set `MAINTENANCE_BYPASS_SECRET=letmein`, visit `/competition?bypass=letmein`. You should land on `/competition` (without the query) and see the real page. Other browsers or incognito windows still see maintenance.
5. With maintenance on, check that an API route still responds (e.g. `curl -I http://localhost:3000/api/...`).
6. Turn everything off and confirm the site is back to normal. Use `curl -I` to confirm the 503 is gone and that no cached maintenance page is served.

## Gotchas

- **Server actions** are POSTs to the page URL, so they're blocked on a page under maintenance. Make sure the UI handles a 503 cleanly instead of showing a generic error.
- **Don't cache the 503.** `no-store` covers browsers. If a CDN sits in front, check that it isn't still serving the maintenance response after maintenance is turned off.
- **The bypass cookie holds the raw secret.** That's fine for a small team. Once roles are in place (`ADMIN_EMAILS` / `src/lib/admin.ts`), replace it with an "is admin session" check and drop the cookie.
- **The page-level maintenance page is standalone.** It shows the maintenance page with `ErrorLayout`'s navbar and footer, not inside that section's own layout. To keep a segment's own layout visible, do the check in that segment's `layout.tsx` and render `<PageMaintenance />` instead of `children`. That's less robust, because layouts don't re-render on client-side navigation within the segment.
- **`/maintenance/*` can be visited directly** even when maintenance is off. That's harmless (the pages are `noindex`), but don't add them to `sitemap.ts`.

## Later: moving off env vars

Env vars need a restart or redeploy to change. To toggle maintenance in seconds without a deploy, read the flags from an external store:

- **Vercel:** Global Config (formerly Edge Config), read with `get('maintenance')` from `@vercel/global-config`, with a toggle in the dashboard.
- **Self-hosted / Supabase:** a row in a settings table or a Redis key. Cache it for a few seconds, because it runs on every request. If the lookup fails, serve the site normally instead of blocking it.

Only `getMaintenanceState()` changes: it becomes `async`, and `handleMaintenance()` / `proxy()` `await` it.
