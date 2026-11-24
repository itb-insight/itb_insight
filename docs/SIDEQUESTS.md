# Sidequest & Gamification Backend (PRD QRS-04, QRS-09..QRS-11)

Complete backend implementation of the ITB Insight D-Day Gamification system, combining:
1. **Main Quest (Booth Visits & Interactions)** via personal QR scanning (`src/lib/booths.ts`, `/api/booths/scan`, `/api/booths/progress`).
2. **Sidequests (Promotional Actions Verified by Admin on D-Day)** seeded from `Gamification.xlsx` (`src/lib/sidequests.ts`, `/api/sidequests`, `/api/admin/sidequests`).
3. **Time Window & Leaderboard Freeze (`05:00` – `17:00` WIB)** (`/api/sidequests/leaderboard`).
4. **Reward Tier Claims (`Poin Hadiah`)** with double-claim and Top-3 quota protection (`/api/sidequests/rewards`).

---

## 1. D-Day Window & 17:00 WIB Leaderboard Freeze

Per product specification:
- **Start**: `05:00 WIB` (`UTC+7`)
- **Close & Leaderboard Freeze**: `17:00 WIB` (`UTC+7`)

Behavior controlled by `getSidequestWindow()` in `src/lib/sidequests.ts`:
- Before `05:00 WIB` (`status: 'not_started'`): `POST /api/sidequests` returns `403 WINDOW_NOT_OPEN`.
- Between `05:00` and `17:00 WIB` (`status: 'open'`): Visitors can submit sidequest proofs.
- At/after `17:00 WIB` (`status: 'frozen'`):
  - `POST /api/sidequests` returns `403 WINDOW_CLOSED`.
  - `getLeaderboard()` automatically filters booth scans (`scanned_at <= closesAt`) and approved sidequest submissions (`submitted_at <= closesAt`) so the leaderboard is frozen as of `17:00 WIB`.
  - Ties on the leaderboard are broken by whoever reached their score earliest (`lastPointAt` ascending — supporting *"Limited Top 3 orang Tercepat"*).

### Environment Configuration (`.env.local`)
- `SIDEQUEST_DATE="YYYY-MM-DD"` — pins the D-Day date in WIB (defaults to the current WIB calendar date if omitted).
- `SIDEQUEST_START_HOUR=5` — opening hour in WIB (default `5`).
- `SIDEQUEST_CLOSE_HOUR=17` — closing & freeze hour in WIB (default `17`).
- `SIDEQUEST_FORCE_WINDOW=""` — optional override (`"open"`, `"frozen"`, `"not_started"`) for staging/testing.
- `BOOTH_HIGH_POINTS_THRESHOLD=100` — point threshold for the *"BANYAK BANGET!"* warning screen.

---

## 2. Main Quest & QR Point Award Rules (Wireframe Compliance)

`previewBoothAward()` and `awardBoothPoints()` in `src/lib/booths.ts` (`POST /api/booths/scan`) implement all screens from the gamification wireframe:

| Wireframe Screen | Backend Contract |
| --- | --- |
| **Screen Pemberian Poin** (Default value + optional extra) | Uses `booths.points` as default base + `bonusPoints` (`0..booths.max_bonus_points`). Logs delta and `awarded_by` in `booth_scan_events` + `audit_logs`. |
| **Ini Akun Panitia!** (`panitia / stakeholder / sponsor`) | Checks `profiles.role_a`. Any account with `role_a IS NOT NULL` (`staff`, `stakeholder`, `sponsor_partner`, `company`, `admin`) is rejected with `403 COMMITTEE_ACCOUNT` (and excluded from the leaderboard & reward claims). |
| **BANYAK BANGET!** (Exceeds threshold) | Sets `warnings.highPoints = true` when `pointsToAward > BOOTH_HIGH_POINTS_THRESHOLD` (default `100`). |
| **Yakin?** (Non-booth staff helper awarding points) | Sets `warnings.nonBoothStaff = true` when `!isAssignedBoothStaff`. Per wireframe note: if both `highPoints` and `nonBoothStaff` are true, `warnings.primaryWarning` is `'high_points'`. |
| **Berikan Bonus?** (Same booth within 5 hours) | Checks `booth_scan_events.scanned_at` within `RECENT_VISIT_WINDOW_MS` (5 hours) and sets `recentVisitWithin5h = true` / `warnings.recentVisitWithin5h = true`. |
| **HOORAY!** (Visitor screen after receiving points) | Resolves the scanning staff's profile name and returns `awardedByName` (e.g. `"Alya Rachma Ditha"`) so the UI can display *"Anda baru saja diberikan X points oleh kak Alya Rachma Ditha!"*. |
| **Manual Point Deduction** (Webdev error correction) | Migration `0016` relaxes `booth_scan_events_points_awarded_check` when `booth_id IS NULL` to allow `-1000..1000`. Admins can pass negative `points` without a `boothId` to deduct points with full audit logging (`BOOTH_POINTS_DEDUCTED`). |

---

## 3. Sidequest Catalog & Admin Verification Flow

Migration `0016_sidequests_and_gamification.sql` seeds all 13 sidequests across the 4 categories from `Gamification.xlsx`:
- **Marketing**: Follow IG (`10`), Follow TikTok/X (`5`), Share Poster ke Story (`5`), Registrasi D-Day (`20`), Add Yours Moment D-Day (`10`), Foto dengan Kyubi + Add Yours (`10`), Ajak 3 Teman Registrasi D-Day (`15`).
- **Acara**: Mengunjungi Booth Tech Show x/2 (`5`), Mengikuti Talkshow Seminar (`5`), Isi Kesan Pesanmu Hari Ini (`10`).
- **Competition**: Mengunjungi Booth Engineering Case Competition (`5`), Menonton Drone Soccer Competition (`5`).
- **Fundraise**: Beli Merch + Upload Foto (`15`), Mengunjungi Booth Sponsor x/2 (`5`).

### Endpoints
- `GET /api/sidequests` — lists active sidequests, the `05:00`–`17:00` WIB window state, and (if signed in) the visitor's submission status for each quest.
- `POST /api/sidequests` — authenticated visitor submits `{ questSlug | questId, proofUrl?, note? }`. Creates a `pending` row in `sidequest_submissions` (or re-submits if previously `rejected`).
- `GET /api/admin/sidequests?status=pending|approved|rejected|all` — admin queue of visitor submissions with profile & quest metadata.
- `POST /api/admin/sidequests` — admin verifies a submission (`{ submissionId, decision: "approved" | "rejected", reviewNote? }`), atomically setting `points_awarded = quest.points` on approval and recording `SIDEQUEST_APPROVED` / `SIDEQUEST_REJECTED` in `audit_logs`. Also supports updating quest metadata (`{ questId, shortcutUrl?, points?, isActive? }`).
- `GET /api/sidequests/leaderboard?limit=50` — returns window state and ranked leaderboard combining booth + approved sidequest points.
- `GET /api/sidequests/rewards` & `POST /api/sidequests/rewards` — lists or claims reward tiers (`100-150 Sticker`, `151-200`, `201-250`, `251-300`, `301-350 Top 3 Tercepat`) with `unique (tier_id, user_id)` double-claim protection and stock checks.
