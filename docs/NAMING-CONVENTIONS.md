# Naming conventions

## Markdown filenames

- Root canonical docs use uppercase hyphenated names, for example `MVP-STATUS.md` and `API-CONTRACTS.md`.
- Runbooks use uppercase hyphenated names under `docs/runbooks/`.
- Analytics documentation uses two-digit lowercase-kebab names, for example `00-overview.md`.
- `PRD(v1.0).md` is the required explicit versioned exception.
- `README.md` remains the conventional index name.

Existing retained names comply; do not rename them merely for churn.

## Historical repository conventions

Canonical conventions for the integrated **itb_insight** app. These follow the patterns already
present in `itb_insight` (the main repo) — when the merged-in code from `web`/`itb-insight`
disagreed, itb_insight wins.

## Directory layout

```
src/
  app/                      # Next.js App Router. Thin route files only.
    <route>/page.tsx        # imports and renders a feature component
    api/<resource>/route.ts # route handlers (backend)
    auth/callback/route.ts  # OAuth / magic-link landing
  features/                 # Feature modules — the bulk of the UI lives here
    <feature>/Component.tsx + Component.module.css
  shared/                   # Cross-cutting UI (Navbar, Footer) + hooks/utils
  lib/                      # Framework-agnostic logic: supabase clients, domain helpers, analytics
  proxy.ts                  # Session refresh + route guard (Next 16's renamed "middleware")
supabase/
  migrations/               # SQL migrations, applied in filename order
  config.toml
docs/                       # This folder
```

**Route files are thin.** A file in `src/app/**/page.tsx` should import a component from
`src/features/**` and render it (optionally after fetching data). Business/UI logic does not live in
`app/`.

## Casing rules

| Thing | Convention | Example |
| --- | --- | --- |
| Route segment folders (`src/app`) | lowercase, kebab-case | `event-map/`, `register-competition/` |
| Feature folders (`src/features`) | lowercase, kebab-case | `event-map/`, `dashboard/`, `auth/` |
| Component files | PascalCase, default export | `DashboardHome.tsx`, `Navbar.tsx` |
| Component folders inside a feature | PascalCase (matches the component) | `auth/Login/Login.tsx` |
| CSS Modules | co-located, `<Component>.module.css` | `Login.module.css` |
| Non-component lib files | kebab / camel, named exports | `team-registration.ts`, `api-response.ts` |
| Supabase migrations | `NNNN_snake_case.sql` | `0002_mvp_schema.sql` |
| DB tables & columns | `snake_case` | `competition_team_members` |
| API error codes | `SCREAMING_SNAKE_CASE` | `TEAM_ALREADY_EXISTS` |

> **Fixed during integration:** the auth feature folder was `Auth/` while the route files imported
> `@/features/auth/...`. This is a silent breakage on case-sensitive (Linux) filesystems. The folder
> was renamed to lowercase `auth/` to match the imports and the convention above.

## Styling

- **Design tokens** live in `src/app/globals.css` under `:root` (dark theme, `--color-*`,
  `--space-*`, `--radius-*`, `--font-primary`). Prefer these over hard-coded values.
- **CSS Modules** are the default styling mechanism (one `.module.css` per component).
- **Tailwind v4** is available (utility classes, no `tailwind.config.js`) for quick layout, but is
  not the primary system.
- The primary font is **Gabarito** (`--font-primary`), loaded via `next/font` in the root layout.
  `Roboto Mono` is used for code/mono contexts. Avoid introducing new font families ad hoc.

## Imports

- Use the `@/*` path alias (→ `src/*`) for all cross-module imports. No deep relative chains
  (`../../../`).
- Client components must start with `"use client"`. Anything using hooks, browser APIs
  (`localStorage`, `navigator`, `window`) or event handlers is a client component.

## Next.js 16 specifics

This repo runs **Next.js 16** (see `AGENTS.md`). Notable differences from older Next:

- `cookies()`, `headers()`, and route `params` / `searchParams` are **async** — always `await` them.
- The `middleware` convention is renamed to **`proxy`** (`src/proxy.ts`, Node runtime).
- `next lint` is removed; lint via the ESLint CLI (`npm run lint`).
