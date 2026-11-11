- **Supabase auth plus a `profiles` table.** Every user has a unique `auth.users.id`.
- **A `visitor_tickets` table** ([0002_mvp_schema.sql:30](vscode-webview://1fcqtcojobat0gppkro2nbho36nkrg4q4on3fdvjbueov42phe81/supabase/migrations/0002_mvp_schema.sql#L30)). It has `user_id unique` and `qr_code text unique not null`, plus `checked_in`, `checked_in_at` and `checked_in_by` columns, which is the attendance shape you need.
- **A token generator.** [tickets.ts](vscode-webview://1fcqtcojobat0gppkro2nbho36nkrg4q4on3fdvjbueov42phe81/src/lib/tickets.ts) has `ensureVisitorTicket()`. It's idempotent, handles race conditions, and generates a 256-bit random token with `randomBytes(32)`. It's already called from [auth/callback/route.ts:22](vscode-webview://1fcqtcojobat0gppkro2nbho36nkrg4q4on3fdvjbueov42phe81/src/app/auth/callback/route.ts#L22) and from the individual registration route.
- **A QR renderer.** `qrcode.react` is installed, and [AccountQrCard.tsx](vscode-webview://1fcqtcojobat0gppkro2nbho36nkrg4q4on3fdvjbueov42phe81/src/features/dashboard/AccountQrCard.tsx) uses it.

You're closer than you think. Part of the backend already exists, so most of this is wiring.

## What's already in the repo
- **Supabase auth plus a `profiles` table.** Every user has a unique `auth.users.id`.
- **A `visitor_tickets` table** ([0002_mvp_schema.sql:30](supabase/migrations/0002_mvp_schema.sql#L30)). It has `user_id unique` and `qr_code text unique not null`, plus `checked_in`, `checked_in_at` and `checked_in_by` columns, which is the attendance shape you need.
- **A token generator.** [tickets.ts](src/lib/tickets.ts) has `ensureVisitorTicket()`. It's idempotent, handles race conditions, and generates a 256-bit random token with `randomBytes(32)`. It's already called from [auth/callback/route.ts:22](src/app/auth/callback/route.ts#L22) and from the individual registration route.
- **A QR renderer.** `qrcode.react` is installed, and [AccountQrCard.tsx](src/features/dashboard/AccountQrCard.tsx) uses it.

## The two gaps
1. **The profile page shows a static image.** [ProfileCard.tsx:124](src/features/profile/ProfileCard.tsx#L124) renders `/images/qr-placeholder.png`, so it isn't tied to any user.
2. **The dashboard QR encodes the raw Supabase user ID** ([AccountQrCard.tsx:42](src/features/dashboard/AccountQrCard.tsx#L42)), not the ticket token. User IDs aren't secret, because they show up in team and registration data. Anyone who learns a friend's UUID can draw a valid QR for them. It also can't be revoked.

## How to get unique, valid QRs now

**Encode `visitor_tickets.qr_code`, not the user ID.** It's already unique per user, unguessable and revocable by rotating the row. Because it lives in the database, a QR shown today is the same one the scanner will resolve later. Nothing needs regenerating.

1. In [dashboard/profile/page.tsx](src/app/dashboard/profile/page.tsx), call `ensureVisitorTicket(user.id)` on the server, right after `getUser()`. This covers users who signed up before the ticket logic existed. The row is created once and reused on every later visit.
2. Pass `ticket.qr_code` to `ProfileCard` and render it with `<QRCodeSVG value={...} />`. Use the same value in `AccountQrCard`, so the two screens show an identical code.
3. Optionally prefix the payload, e.g. `itbi:v1:<token>`. The scanner can then reject unrelated QRs and you can change the format later.
4. Optionally shorten the token. 64 hex characters makes a dense QR that's harder to scan on a cracked phone. `randomBytes(16)` as base64url is 22 characters and still unguessable. Also drop `level="H"` to `"M"`.

This needs no new service, and the QR is valid even though the scan backend doesn't exist.

**Alternative with no database lookup:** a signed payload, `v1.<userId>.<HMAC-SHA256(userId, SECRET)>`, verified statelessly by the scanner. I'd skip it. You already have the table, and the stateless version can't be revoked.

## Preparing for the scan backend
- **Scan endpoint** (`POST /api/staff/scan`). Check that the caller is staff, using the existing `is_admin` pattern or a new `staff` role. Then look up the ticket by `qr_code` with the service client. The service-role key must never reach the client.
- **Attendance.** Flip `checked_in` atomically, with `update ... where qr_code = $1 and checked_in = false returning *`. A second scan then returns "already checked in" instead of double-counting.
- **Points.** Use an append-only ledger rather than a counter column. For example, `point_events(id, user_id, booth_id, points, awarded_by, created_at)` with `unique(user_id, booth_id)` so one booth can't award the same person twice. The total is `sum(points)`.
- **Staff scanner UI.** Use `@yudiel/react-qr-scanner` or `html5-qrcode`. Both are free and use the phone camera. Modern browsers also have a native `BarcodeDetector`. The scanner page needs HTTPS (Vercel provides it) for camera access.

## Free?
Yes, all of it.
- `qrcode.react` runs in the browser, so there's no API call.
- Supabase's free tier covers the database, auth and RLS.
- The scanner libraries are open source.

Don't use hosted QR-generator APIs such as `api.qrserver.com`. They would see every user's token.

## Next step
The pre-backend piece is small: ensure the ticket on the profile page, then swap the placeholder image and the dashboard UUID for the real token. Want me to do that? I'd also add the scan endpoint and the `point_events` migration. Per [AGENTS.md](AGENTS.md), I'd read the Next 16 docs in `node_modules/next/dist/docs/` before writing any route code.