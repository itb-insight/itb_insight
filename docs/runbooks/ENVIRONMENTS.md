schema_version: 2

# Environment runbook

## Current code boundaries

- `.env.local` is local-only. Do not commit secrets.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public configuration inputs.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and is required for privileged ticket/registration operations.
- The code currently has no payment runtime; do not document Midtrans environment variables as active configuration.

## Target environment categories

Separate local development, test/sandbox, preview, and production configuration. Production-only categories will include Supabase privileged access, payment webhook/server credentials, transactional email, analytics, monitoring/backup, and edge/WAF controls. Names and values are intentionally not recorded here; GSAP, Lenis, PostHog, Cloudflare, and Midtrans are not active runtime configuration.

## Safe operating rules

- Use a disposable or non-production Supabase project for development/testing.
- Keep production, test data, and secrets separated; do not place keys, raw exports, QR tokens, payment tokens, or PII in documentation or evidence.
- Confirm migrations `0001`–`0006` and exact deployment configuration with the owner before a remote change. This repository document does not establish a remote environment’s state.
- Apply the release/security checklists only to features that exist. The secure-admin and payment milestones require their own implementation and verification before release.

## Auth redirect check

For a configured Supabase environment, redirect URLs must match the deployed site and the existing `/auth/callback` route. The interactive login route is `/login`.
