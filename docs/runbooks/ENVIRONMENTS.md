schema_version: 2

# Environment runbook

## Current code boundaries

- `.env.local` is local-only. Do not commit secrets.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public configuration inputs.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and is required for privileged ticket/registration operations.
- The code currently has no payment runtime; do not document Midtrans environment variables as active configuration.

## Target environment categories

Separate local development, test/sandbox, preview, and production configuration. Production-only categories will include Supabase privileged access, payment webhook/server credentials, transactional email, monitoring/backup, and edge/WAF controls. Values are never recorded here; `.env.example` lists every name.

## Analytics and presence

- PostHog: `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_REGION` (public), `POSTHOG_PROJECT_ID` and `POSTHOG_PERSONAL_API_KEY` (server-only, `query:read`). One project serves every environment; `/admin` on production counts only `app_env = 'production'`. See [../analytics/02-posthog-setup.md](../analytics/02-posthog-setup.md).
- Booth presence: `VENUE_*` (also turns on self check-in), `BOOTH_ZONE_*`, `BOOTH_MAX_ACCURACY_M`, `PRESENCE_BURST`, `PRESENCE_DATES`, `PRESENCE_HOURS`, `PRESENCE_TEST_MODE`. Set `PRESENCE_DATES` to a test day on Preview for a field test; keep `PRESENCE_TEST_MODE` off in Production after testing. See [../analytics/06-dday-presence.md](../analytics/06-dday-presence.md).

## Safe operating rules

- Use a disposable or non-production Supabase project for development/testing.
- Keep production, test data, and secrets separated; do not place keys, raw exports, QR tokens, payment tokens, or PII in documentation or evidence.
- Confirm migrations `0001`–`0017` and exact deployment configuration with the owner before a remote change. This repository document does not establish a remote environment’s state.
- Apply the release/security checklists only to features that exist. The secure-admin and payment milestones require their own implementation and verification before release.

## Auth redirect check

For a configured Supabase environment, redirect URLs must match the deployed site and the existing `/auth/callback` route. The interactive login route is `/login`.
