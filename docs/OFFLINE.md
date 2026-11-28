# Offline and PWA

The event venue has a weak signal. The site is an installable PWA, so the parts people need on
site keep working without one:

| Feature | Offline behaviour |
|---|---|
| Booth scanner `/admin/booth` | Awards are stored on the phone and sent automatically when the signal returns. |
| Gate scanner `/admin/gate` | Check-ins are stored the same way. The visitor can walk in. |
| Visitor QR `/arcade/qr` | The last copy is shown. The token never changes, so it still scans. |
| Arcade hub `/arcade` | Last-known points and quests, with an "Offline · data terakhir hh:mm" banner. The banner also shows online when the page is a copy more than 5 minutes old (the worker serves the cached copy when the network takes over 4 s). |
| Event map `/event-map` | The basemap around the venue, zones, paths and pins come from the cache. With nothing cached, it shows a plain map: zones, paths and pins, no labels. |

A page must be opened online once on that phone before it works offline. The scanners and the map
also cache themselves in the background. Signed-in visitors get `/arcade` and `/arcade/qr`
cached on any page. Each warm-up renders the page on the server, so a browser refreshes each page
at most every 15 minutes, and never with Save-Data on.

## Staff checklist (D-day)

1. Before the event, while on Wi-Fi or a good signal:
   - Open `/admin/booth` (or `/admin/gate`) and `/event-map` once.
   - Install the site to the home screen ("Add to Home Screen" / "Install app"). On iPhone this
     matters: Safari may delete stored data of sites that are not installed.
2. Without signal, keep scanning. A scan that can't reach the server shows **Tersimpan di HP**,
   and the **Koneksi & antrean** panel lists what is waiting.
3. When the signal returns, the queue sends itself. This happens on reconnect, when the page is
   reopened, every 10 seconds while anything is waiting, or when you press **Kirim sekarang**.
4. **Ditolak saat dikirim** lists scans the server refused, with the reason: already given,
   unknown QR, the game had closed. Note them in the paper log if needed, then remove them.
5. Don't sign out with scans still waiting. They can only be sent by the same account, and
   sign-out asks for confirmation.

## How the queue decides (`src/features/offline-queue/`)

- `store.ts` keeps entries in IndexedDB (`itbi-offline` / `scans`), or in memory if IndexedDB is
  unavailable.
- `useOfflineQueue.ts` sends entries oldest first, one tab at a time (Web Locks).
- `queue.ts` `classifyResult` decides what happens to each entry after a send:
  - **done**: the entry was written, or is a duplicate replay. It is removed.
  - **retry**: no network, timeout, 5xx, `PAUSED` (kill switch) or an expired session. The entry
    stays pending, and the flush stops until the next trigger.
  - **failed**: any other refusal. The entry is shown to staff.
- **Booth award** entries carry a `clientRef`, which `arcade_award_booth` writes once, so a resend
  never counts twice. A live request that timed out is queued with the same `clientRef`.
- **Gate check-in** entries rely on a ticket checking in only once, and the arcade gate quest is
  `on conflict`, so a resend changes nothing.
- **Capture time:** every entry carries `capturedAt`, the phone time corrected by the server's
  `Date` header (`send.ts`). The routes validate it with `parseCapturedAt()` (`src/lib/input.ts`):
  at most 12 hours old, future times clamped to now.
- **Game window (migration 0040):** a queued award counts if it was captured between `opens_at`
  and `freezes_at` and reaches the server before `freezes_at + sync_grace_minutes` (60 by
  default). There is no shorter age limit.

## Service worker (`public/sw.js`)

Hand-written, with no build step. Its headers are set in `next.config.ts` (`no-store` and its own
CSP), and `src/proxy.ts` never rewrites it.

| Request | Strategy | Cache |
|---|---|---|
| `/_next/static/*` | cache first | `itbi-static-*` |
| Navigations to `OFFLINE_PAGES` | network first; cached copy if offline or slower than 4 s | `itbi-pages-*` (cleared on sign-out) |
| Other navigations | network, else `/offline.html` | `itbi-shell-*` |
| `/images`, `/map-pin`, `/events`, `/fonts`, `/icons`, `/_next/image`, manifest | stale-while-revalidate | `itbi-assets-*` |
| Carto basemap (style, tiles, sprites, glyphs) | stale-while-revalidate | `itbi-map-*` |
| `/api`, `/ingest`, `/auth`, RSC, non-GET, other origins | not touched | none |

Pages send it messages through `src/shared/components/Pwa/swClient.ts`:
- `WARM` caches pages, plus the scripts they name or already loaded.
- `WARM_MAP` caches the style, plus tiles z12–15 around the venue from `offlineTiles.ts`.
- `CLEAR_USER` deletes the cached pages on sign-out.

Changing it:
- Bump `VERSION` in `sw.js` whenever the rules or `OFFLINE_PAGES` change. Old caches are deleted
  on activate.
- Phones pick up a new `sw.js` on their next visit (`updateViaCache: 'none'`, `no-store`).
- Only cache full `200` same-origin page responses. Never cache redirects (login), maintenance
  503s or anything under `/api`.

**Kill switch:** set `NEXT_PUBLIC_PWA_DISABLED=1` and redeploy. On their next online visit,
browsers unregister the worker and delete the `itbi-*` caches. The offline scan queue itself
still works without the worker.

## Testing

- Build and serve production locally: `npm run build && npm start` (`localhost` counts as a secure
  context).
- In DevTools → Application, check the manifest and the service worker. Use Network → Offline to
  simulate no signal.
- To test the map's plain fallback, delete the `itbi-map-*` cache and reload while offline.
- Not implemented yet: push notifications (see `docs/FEEDBACK.md`), and Background Sync. Queued
  scans send while a scanner page is open.
