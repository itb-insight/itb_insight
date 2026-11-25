@AGENTS.md

# Before you commit

Run `npm run check` (typecheck + lint + unit tests + guardrails). CI (`.github/workflows/ci.yml`)
runs the same plus `next build` and `npm run audit:prod`; every step is blocking.

- Lint: pre-existing errors are baselined in `eslint-suppressions.json`. New errors fail. After you
  fix a baselined one, run `npm run lint:prune`. Never re-run `--suppress-all` to hide new errors.
- Dependency audit: high/critical advisories in production deps fail CI. An exception goes in
  `audit-allowlist.json` with a reason and a short expiry date, never without one.
- The repo is public. Never commit `.env*` (except `.env.example`), `supabase/.temp/`, keys, or
  personal data.

# Guardrails (tests/guardrails)

Repo-wide checks that run with `npm test`. Their baselines record today's known offenders; they
may only shrink. When you fix an offender, delete its baseline entry (the test tells you). Do not
add entries to make a failing test pass unless the user agreed to that exception, and write why.

| File | Enforces |
| --- | --- |
| `api-auth.test.ts` | Every API handler calls `getAuthenticatedUser`/`getScopedUser`, or is in `PUBLIC_HANDLERS` with what protects it. Staff/admin handlers use `getScopedUser` with explicit roles. |
| `migrations.test.ts` | RLS on every public table, no write policy without an `auth.uid()`-bound condition, no anon write grants, SECURITY DEFINER pins `search_path`, views are not exposed, unique migration numbers. |
| `server-boundary.test.ts` | `'use client'` files never import server modules or read non-`NEXT_PUBLIC_` env; server modules touching secrets `import 'server-only'`. |
| `postgrest-filters.test.ts` | No template literals inside `.or()`/`.filter()`/`.not()`/`.textSearch()`/`.match()`. |
| `secrets.test.ts` | No credentials in tracked files; local-only files not tracked. |
| `assets.test.ts` | Files in `public/` < 5 MB, code references no asset > 1 MB, no Google Fonts `@import`. |
| `dev-routes.test.ts` | No new preview/test/dev routes unless they `notFound()` in production. |

Shared test helpers: `tests/support/fake-supabase.ts` (chainable Supabase fake for mocking
`@/lib/supabase/server`), `tests/support/repo.ts`.

# Security rules

- Identity, roles and money come from the server: the user from the session, roles from
  `admin_roles` / `profiles.role_a`, amounts from `src/lib/competitions.ts`. Never from the body.
- A feature that is closed in the UI must be closed in its API too. Registration APIs check
  `isRegistrationSwitchOn(slug)` (the same `REGISTER_OPEN_<code>` switch as the button).
- `/admin` is admin-only in `src/app/admin/layout.tsx`; the proxy redirects signed-out visitors
  from `/dashboard` and `/admin` (`isProtectedPath` in `src/lib/supabase/middleware.ts`).
- Database writes go through API routes with the service role. New tables get
  `enable row level security` in the same migration; user-editable columns use column-level grants.
- Never interpolate user input into PostgREST filter strings: use `.eq()`, or `ilikeAnyFilter()` /
  `escapeLike()` from `src/lib/postgrest.ts`.
- Read JSON body strings with `parseTextFields()` (`src/lib/input.ts`): types and length caps,
  never `.trim()` on a raw body value.
- Client IPs come from `getClientIp()` / `clientIpFromHeaders()` (`src/lib/client-ip.ts`), which
  trusts `cf-connecting-ip` only from Cloudflare's ranges. Don't read forwarding headers directly.
- Redirect targets from the request go through `safeNext()`.
- Inline `<script>` (JSON-LD) content goes through `jsonLd()` from `src/lib/json-ld.ts`.
- Location-gated features use `src/lib/geofence.ts` (venue from `VENUE_LAT`/`VENUE_LNG`, off when
  unset). Client GPS can be faked: never make it the only check for anything valuable.
- Security headers live in `next.config.ts` (checked by `src/next-config.test.ts`).
- Public endpoints need an abuse control: rate limit, Turnstile, capability token or signature.

# Performance rules

- Raster images: `next/image` with `sizes`; resize and convert to WebP/AVIF before adding. No large
  rasters in CSS `background-image` (it bypasses optimization).
- Video: respect `prefers-reduced-motion` and Save-Data before downloading; keep mobile encodes small.
- Fonts: `next/font` only (`--font-primary`, `--font-roboto-mono`), no Google Fonts `@import`.
- Scroll/resize handlers: throttle with `requestAnimationFrame` and write CSS variables or refs;
  don't `setState` on every scroll event. Keep per-second timers in tiny leaf components.
- Don't ship `@supabase/supabase-js` to public pages for UI-only checks: use `useHasSession()`
  (`src/shared/hooks/useHasSession.ts`) and `import()` the client only when it's needed.
- Assets that are not loaded by the site (originals, raw exports) go in `design-sources/`, not
  `public/`. Versioned files in `public/itb-model/` and `public/fonts/` are cached as immutable:
  rename on change.
- Route handlers: run independent Supabase queries with `Promise.all`; use `after()` from
  `next/server` for fire-and-forget work so it isn't dropped when the function freezes.

# Feedback triggers when building PWA / geofencing

The PWA (push notifications, service worker) is deliberately not implemented yet. Opt-in booth
presence (geofencing while the page is open) is, in `src/features/onsite/`, and already wires the
in-app triggers below. When you build the PWA, add the push versions, as described in
`docs/FEEDBACK.md` ("Triggers — status"):
- Time trigger: notify / pop up `/feedback/<slug>` when a form opens (`feedback_forms.opens_at`)
  for users who attended and have not submitted.
- Geofence exit: prompt for feedback when leaving the event area. Browsers give no background
  geolocation (iOS PWAs especially), so treat this as best-effort while the app is open and keep
  the QR + time trigger as the reliable paths.
