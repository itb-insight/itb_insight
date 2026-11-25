# D-day booth presence

Opt-in location on event days: which booths a visitor stood at, and for how long. It feeds the
D-day live panels. **It never awards points**, because client GPS can be faked; points stay with QR
scans.

Code: `src/lib/presence.ts` (settings), `src/lib/presence-geo.ts` (geometry),
`src/app/api/presence/*`, `src/features/onsite/` (browser), migration `0016_booth_presence.sql`.

## What is stored

`booth_presence`: user, booth (or none = in the venue at no booth), first seen, last seen, ping
count. **Never coordinates.** Pings less than 3 minutes apart extend the same visit.
A visit of **5 minutes or more** counts as visiting that booth; dwell = last seen − first seen.
Service role only (RLS on, no client grants). Consent is `profiles.presence_consent_at`, written only
by the API.

## Zones

| Zone | Configured by | Role |
| --- | --- | --- |
| Event zone (ITB Ganesha) | `VENUE_LAT`, `VENUE_LNG`, `VENUE_RADIUS_M` (300), `VENUE_MAX_ACCURACY_M` (100) | Nothing is sent or stored outside it. Unset = presence off. Shared with self check-in. |
| Booth zone | `BOOTH_ZONE_LAT`, `BOOTH_ZONE_LNG`, `BOOTH_ZONE_RADIUS_M` | Where burst sampling runs. Optional. |
| Booth | `booths.lat`, `booths.lng`, `booths.presence_radius_m` (15) | A fix whose centre is within the radius matches; nearest wins. |

A fix counts as inside a zone when its accuracy circle overlaps it. Booth matching uses only fixes
with accuracy ≤ `BOOTH_MAX_ACCURACY_M` (25 m); a less precise fix inside the venue records venue
time with no booth.

## When it runs

- Presence days: `PRESENCE_DATES` (comma-separated, Jakarta), else D-Day plus dated events.
- Presence hours: `PRESENCE_HOURS` (`start-end`, Jakarta, end exclusive).
- **Test mode**: `PRESENCE_TEST_MODE=true` lets admin and staff accounts (field, gate, booth) run it
  any day and hour, get the opt-in card without a gate check-in, and see the debug readout.
  Consent and zones still apply. Turn it off in production after testing.

## Who is asked

The browser can't know where someone is before they grant location, so our card ("Catat kunjungan
booth-mu?") appears only to signed-in visitors on a presence day who either checked in at the gate
today or whose IP Vercel places in Bandung/Cimahi. Then the browser's own prompt. Consent is saved
only after the browser grants location. "Nanti saja" hides the card for the day.

## The browser loop (`PresenceTracker.tsx`)

| Where | What happens |
| --- | --- |
| Outside the event zone | One local position check every 3 min (30 s in test mode). Nothing is sent. |
| Event zone | One ping a minute (`POST /api/presence/ping`). |
| Booth zone, `PRESENCE_BURST=true` | **Experimental**: 8 fixes 2 s apart per ping. The server drops outliers (> 2σ from the median), takes an accuracy-weighted mean, then matches. |
| Leaving the zone | Sending stops at once; the geofence-exit feedback prompt may show. |
| Tab hidden | Paused. |

The server re-checks everything on every ping: sign-in, rate limit (4/min per user), presence day,
consent, event zone, accuracy. The chip shows "Booth X: ± N menit lagi" until the visit counts, and
**Matikan** withdraws consent, which deletes the user's presence rows.

## Field test and tuning

Use an admin or staff account (the readout shows zone, booth, dwell, fixes used/received, spread
and accuracy) on a deploy with HTTPS. Phones can't get location from a LAN dev server over HTTP.

1. Set `lat`/`lng` per booth: stand at it and read the coordinates, or take them from the map.
2. Stand at booths for 6+ minutes; walk between neighbours; lock the screen once to see the gap.
3. If neighbouring booths cross-match, shrink `presence_radius_m` or lower `BOOTH_MAX_ACCURACY_M`.
   If a booth never matches, raise them.
4. Compare `PRESENCE_BURST` on and off. Keep it only if spread and matching are clearly better:
   averaging cancels jitter but not multipath bias near buildings.

## Retention

The privacy page promises deletion **within 30 days after the event**, or at once when a visitor
turns it off. After the event, run in the Supabase SQL editor (production):

```sql
delete from public.booth_presence;
update public.profiles set presence_consent_at = null where presence_consent_at is not null;
```

Export the aggregates you want to keep first (e.g. the booth leaderboard from `/admin/analytics`).
