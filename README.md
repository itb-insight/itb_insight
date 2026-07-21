# ITB Insight — MVP

The integrated MVP app for the ITB Insight exhibition & competition platform. Built on **Next.js 16**
(App Router) + **Supabase**. This repo is the single runnable app — it merges the work from three
originally-separate repos (see [docs/MVP-STATUS.md](./docs/MVP-STATUS.md)).

## What works

- **Auth** — email magic link + Google OAuth (Supabase Auth).
- **Team & individual competition registration** — create a team, share its UID, teammates join,
  leader submits — all persisted to Supabase.
- **Participant dashboard** — registrations, status, and the submit action.
- **Batched web analytics** — page views/events buffered client-side and bulk-inserted to Supabase.

## Getting started

1. **Install**
   ```bash
   npm install
   ```

2. **Configure environment** — copy the example and fill in your Supabase keys:
   ```bash
   cp .env.example .env.local
   # edit .env.local — see .env.example for where each value comes from
   ```

3. **Apply the database schema** to your Supabase project:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
   (Alternatively, paste the files in `supabase/migrations/` into the Supabase SQL editor in order.)

4. **Enable auth providers** in the Supabase dashboard: turn on **Google** and/or **email (magic
   link)**, and add `http://localhost:3000/auth/callback` to the allowed redirect URLs.

5. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server (Turbopack). |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | ESLint (Next 16 does not lint during build). |

## Project structure

See [docs/NAMING-CONVENTIONS.md](./docs/NAMING-CONVENTIONS.md) for the full layout and rules. In short:
`src/app` (thin routes + API) · `src/features` (UI modules) · `src/lib` (Supabase clients, domain
logic, analytics) · `src/shared` (Navbar/Footer) · `src/proxy.ts` (session guard) · `supabase/`
(migrations).

## Docs

- [docs/MVP-STATUS.md](./docs/MVP-STATUS.md) — what's done and what's deferred.
- [docs/ERD.md](./docs/ERD.md) — data model + diagram.
- [docs/NAMING-CONVENTIONS.md](./docs/NAMING-CONVENTIONS.md) — conventions.

> **Note:** This project runs a bleeding-edge Next.js 16 — see [AGENTS.md](./AGENTS.md). Key
> differences: async `cookies()`/`params`, `middleware` renamed to `proxy`, no `next lint`.
