# QR Features — Missing Front-End Work

Companion to [QR-FEATURES.md](./QR-FEATURES.md) (product behaviour) and [QR-BE.md](./QR-BE.md) (backend checklist).

The backend for personal QR, attendance, gate confirmation and booth points is implemented (`src/lib/tickets.ts`, `src/lib/check-in.ts`, `src/lib/booths.ts`, `src/app/api/{tickets,check-in,booths}`). Typed client helpers already exist in `src/features/dashboard/apiClient.ts`, but **nothing in the UI calls them yet**. This doc lists what has to be built.

> Before writing any page/route, read the relevant guide in `node_modules/next/dist/docs/` — this Next.js version has breaking changes (see `AGENTS.md`).

## What already exists

| Piece | Location | Notes |
| --- | --- | --- |
| Personal QR on profile | `src/features/profile/ProfileCard.tsx` (via `src/app/dashboard/profile/page.tsx`) | Encodes `visitor_tickets.qr_code` (random token). ✅ correct value. |
| "Account ID" QR on dashboard home | `src/features/dashboard/AccountQrCard.tsx` | Encodes the **raw user UUID**. ⚠️ should encode the ticket token instead (see FE-1). |
| API client helpers | `src/features/dashboard/apiClient.ts` | `allocateVisitorBoothPoints`, `updateBoothPerimeterStatus`, `fetchBoothAdminView`, `fetchUserBoothProgress`, `reportCampusGeoAttendance`, `scanVisitorGateQr`. All unused. |
| Event map | `src/features/event-map/EventMap.tsx` | Booth list is **hardcoded**; not wired to `GET /api/booths`. |
| QR rendering lib | `qrcode.react` | No QR **scanning** library is installed. |

## Components to build

### FE-1 — Unify the visitor QR value
- Change `AccountQrCard` to receive and encode `visitor_tickets.qr_code` (fetch with `ensureVisitorTicket` server-side, like the profile page does) instead of `user.id`.
- Both QR surfaces must show the **same** value. Once done, the backend can drop the UUID fallback (see BE checklist).

### FE-2 — Shared QR scanner component
`src/features/qr-scanner/QrScanner.tsx` (client component)
- Camera-based scanning. Options: native `BarcodeDetector` (Chromium/Android) with a library fallback for iOS Safari (e.g. `@zxing/browser` or `qr-scanner`). Needs a new dependency.
- Props: `onScan(value: string)`, `paused`, `facingMode` (default rear camera).
- Handles: permission denied, no camera, insecure context (HTTPS required), debounce of repeated reads of the same code (~2s).
- **Manual entry fallback**: text input for pasting/typing the code when the camera fails.
- Used by FE-3 and FE-4.

### FE-3 — Gate Staff scanner page
Route suggestion: `/staff/gate` (or `/admin/gate`, already named in `docs/API-CONTRACTS.md`). Roles: `gate_staff`, `field_staff`, `admin`.
- Gate selector (stored in `localStorage`) → sent as `gateName`.
- `QrScanner` → `scanVisitorGateQr({ qrCode, gateName })`.
- Result card: visitor name / institution, `alreadyCheckedIn`, `gateConfirmed`, and the **tutorial message** (big, readable — staff show it to the visitor: "use this same QR at every booth").
- Error states: `TICKET_NOT_FOUND`, `FORBIDDEN`, network error with retry.
- **Manual lookup tab**: search by name/email (`POST /api/check-in/manual` `action: "search"`), then confirm (`action: "check_in"`). Needs a new helper in `apiClient.ts`.

### FE-4 — Booth Staff admin view (scan & award points)
Route suggestion: `/staff/booth` (or `/admin/booth`). Roles: `booth_staff`, `exhibitor`, `field_staff`, `admin`.
- **Header**: booth name, standard points value, max bonus (`fetchBoothAdminView()`). Admin/field staff get a booth picker (`GET /api/booths`).
- **Scan flow**:
  1. `QrScanner` reads visitor QR.
  2. Confirmation sheet: optional **bonus points** stepper (0 … `remainingBonusAllowance`/`maxBonusPoints`) + optional **activity note** ("Menang kuis", etc.).
  3. Submit → `allocateVisitorBoothPoints({ visitorQrCode, boothId, bonusPoints, activityNote })`.
  4. Result: visitor name, `pointsAwarded` split into standard/bonus, `alreadyVisited`, remaining bonus allowance, `withinPerimeter` badge (informational only — never block).
- **"Add bonus" to a returning visitor**: re-scan with bonus > 0 (backend supports it).
- **Recent visitors list** + totals (standard / bonus / visitors) from `fetchBoothAdminView`, refresh after each award.
- Error states: `BONUS_EXCEEDS_MAX` (show remaining allowance), `VISITOR_NOT_FOUND`, `BOOTH_NOT_FOUND` (account not linked to a booth), `FORBIDDEN`.

### FE-5 — Visitor points & booth progress
- Dashboard card (and/or section on `/dashboard/profile`): total points, booths visited (`x / N` using `GET /api/booths` count), standard vs bonus breakdown, recent scans with activity notes — `fetchUserBoothProgress()`.
- Refresh on focus / interval while the event is live so points appear after a booth scan.

### FE-6 — Campus geofence client (attendance + live count)
`src/features/geofence/useCampusGeofence.ts` (hook) + a mount point in the dashboard layout.
- Explicit opt-in prompt explaining why location is needed (attendance & live visitor count). Do not request permission on page load.
- `navigator.geolocation.watchPosition` → send to `reportCampusGeoAttendance({ latitude, longitude })` **only on state change** (outside → inside = `enter`, inside → outside = `exit`) plus a low-frequency heartbeat (see BE heartbeat item).
- Bandwidth-tolerant: queue the last unsent event and retry with backoff; never spam.
- Show a small status pill ("Kamu tercatat hadir di ITB Ganesha").
- Only active during event dates (reuse `src/features/home/serverClock.ts` / event config).

### FE-7 — Booth perimeter client
- Extend the geofence hook: when inside campus, call `updateBoothPerimeterStatus({ latitude, longitude })` at a throttled rate (e.g. ≥30s and only when position moved > ~10m).
- Purely best-effort — failures are silent.

### FE-8 — Gate poster QR landing page (alternative attendance)
Per QR-FEATURES.md: a QR printed at each gate that any QR tool can open.
- Route suggestion: `/gate/[gateSlug]` (public URL encoded in the poster QR).
- If not logged in → redirect to `/login?next=/gate/[gateSlug]`.
- If logged in → call `reportCampusGeoAttendance({ event: "enter", gateName: gateSlug })` (with coordinates if permission granted), then redirect to `/dashboard/profile?from=gate`.
- On the profile page, when `from=gate`: show **pop-ups** —
  1. "Tunjukkan QR ini saat mengunjungi booth untuk mengumpulkan poin."
  2. "Buka peta untuk memandu petualanganmu" → link to `/event-map`.
- Admin utility (optional): page that renders printable poster QRs per gate.

### FE-9 — Event map wiring
- Replace hardcoded booths in `EventMap.tsx` with `GET /api/booths` (`coordinate_y` = lat, `coordinate_x` = lng).
- Mark booths the visitor has already visited (`visitedBoothIds` from progress) and highlight `currentBoothId`.

### FE-10 — Admin dashboard: attendance & booth stats
- Surface `liveVisitorCount`, `gateConfirmedCount`, check-in rate and `booths.totalScans` from `GET /api/admin/stats` in the admin KPI strip (`src/features/admin/components/KpiStrip`), replacing mock data where applicable.

### FE-11 — Staff routing & access
- Staff pages need role gating for non-admin roles (`gate_staff`, `booth_staff`, `exhibitor`, `field_staff`). Check whether `src/app/admin/layout.tsx` is admin-only; if so put scanner pages under a separate `/staff` layout with its own role check.
- Mobile-first layouts — staff will use phones.

## Suggested order
FE-1 → FE-2 → FE-4 → FE-3 → FE-5 → FE-8 → FE-6/FE-7 → FE-9 → FE-10.
