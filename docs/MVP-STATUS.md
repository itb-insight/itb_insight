# MVP Status — What's Done & What's Cut

This is the integration of three separate repos (built by different people) into **one** runnable
app, `itb_insight`. Scope was the MVP: a working ERD, Supabase integrated, and a real end-to-end
feature to show the committee "it works!".

## Repos that were merged

| Original repo | What it contributed | Where it lives now |
| --- | --- | --- |
| `itb_insight` (Next.js 16) | The app shell, styling/design tokens, landing/event/map pages. | **This repo** (integration target). |
| `web` (Next.js 14) | Supabase backend: schema/migrations, auth, team registration, admin, payments. | Backend ported into `src/lib`, `src/app/api`, `supabase/`. Original archived at `../reference/web`. |
| `itb-insight` (Vite) | Booth-staff demo: QR registration, booth scan, geo-lock. | **Deferred** (not wired). Original archived at `../reference/itb-insight`. |

## ✅ Done for the MVP

- **Supabase integrated** — `@supabase/ssr` browser/server/service clients, session refresh + route
  guard via `src/proxy.ts`, OAuth/magic-link callback route.
- **Working ERD** — 6 migrations in `supabase/migrations/` (see [ERD.md](./ERD.md)), incl. profiles,
  visitor tickets, competitions (seeded), teams, members, registrations, admin roles, analytics.
- **Auth (flagship)** — email **magic link** + **Google OAuth** wired into the existing Login/SignUp
  pages. Sign-out in the navbar. `/dashboard` is protected.
- **Team registration (flagship)** — full create → share UID → join → leader submits flow against
  Supabase, plus individual registration. Service-role API routes with validation + rate limiting.
- **Participant dashboard** — dark-themed feature module showing registrations, stats, and the
  team-submit action.
- **Batched web analytics** — client queue → single bulk INSERT into `analytics_events`
  (no per-event fan-out).
- **Housekeeping** — fixed the `Auth/`→`auth/` case-sensitivity bug; naming conventions documented;
  builds and typechecks clean on Next.js 16.

## ✂️ Corners cut (plug during full implementation)

1. **Booth QR + Geo-lock demo** — the entire `itb-insight` Vite app (personal QR, booth scan,
   Haversine geo-fence, points/leaderboard) is **not ported**. It ran on `localStorage`. Full impl:
   port to Next client components and back it with Supabase (e.g. `booths`, `visits`, `points`
   tables). Reference code preserved at `../reference/itb-insight`.
2. **Payments** — `payments` + `midtrans_transactions` tables exist in the schema but no payment
   routes/UI were ported. Registration currently completes without payment.
3. **Admin dashboard** — `admin_roles` + `is_admin()` exist and API auth supports admins, but the
   admin pages (registration review, check-in, visitor list) from `web` were not ported.
4. **RLS write policies** — by design there are **no** INSERT/UPDATE/DELETE RLS policies; all writes
   use the service-role key inside API routes. Hardening option: add scoped write policies and move
   some writes to the anon/authenticated client.
5. **Sanity CMS** — dropped. Competition content is a hardcoded list in `src/lib/competitions.ts`
   (kept in sync with the seed migration). Re-add Sanity if editors need to manage content.
6. **Email (Resend)** — not wired. Magic-link email is handled by Supabase Auth's built-in mailer.
7. **Rate limiting** — in-memory (per server instance). Move to a shared store (Upstash/Redis)
   before running multiple instances.
8. **Event map** — still renders hardcoded dummy locations; not yet driven by Supabase data.
9. **Pre-existing lint issues** — several `itb_insight` components (e.g. `EventMap`, `HeroSection`)
   have lint errors that predate this work. Next 16 no longer lints during `build`, so they don't
   block, but they should be cleaned up.

## Setup required to run the demo live

1. Fill `.env.local` with your Supabase project's URL + anon + service-role keys
   (see `.env.example`).
2. `supabase link --project-ref <ref>` then `supabase db push` to apply all migrations.
3. In the Supabase dashboard: enable the **Google** auth provider and/or **email** (magic link), and
   add `http://localhost:3000/auth/callback` (and your prod URL) to the allowed redirect URLs.
4. `npm run dev`.
