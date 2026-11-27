# Simultaneous Email Campaigns (ACC-06)

Admin-triggered bulk/announcement email delivery backed by `email_campaigns`, `email_outbox`, and Resend's batch API. Designed to be reusable across ITB Insight editions for:

1. **Winner & Finalist Announcements**: formatted-string emails announcing `Juara 1 / 2 / 3` with personalized Google Drive certificate links (`{{juara}}`, `{{gdrive_link}}`, `{{nama_tim}}`, `{{kompetisi}}`).
2. **Shadow Account Onboarding**: sending initial credentials/passwords or claim instructions to participants whose accounts/team slots were created in bulk (`shadowOnly: true` / `includeShadowSlots: true` + `{{password}}`, `{{email}}`, `{{kode_tim}}`).
3. **General Broadcasts**: filtered announcements by competition, registration/payment status, gate attendance, or staff role.

## Architecture & Guarantees

1. **Outbox-First Persistence**: Every recipient and their per-recipient `variables` (JSONB) are persisted to `public.email_outbox` (`status = 'pending'`, unique `idempotency_key = "<campaign_id>:<email>"`) before any external network call is made.
2. **Secret Hygiene**: Any variable key matching `pass|secret|token|pwd` is automatically redacted (`[REDACTED]`) in `email_campaigns.filter` immediately and scrubbed from `email_outbox.variables` as soon as the email is marked `sent`.
3. **Non-Blocking Execution**: `POST /api/admin/email` queues the campaign and schedules `processCampaign(campaignId)` via Next.js `after()` (`next/server`), returning `202 Accepted` immediately so the admin request does not time out.
4. **Batching & Concurrency**: Delivery claims pending rows atomically (`update ... where status = 'pending'`) and sends in batches of up to 100 emails (`POST https://api.resend.com/emails/batch`) with bounded concurrency (2 batches in flight) and deterministic `Idempotency-Key` headers.
5. **Fault Isolation & Retry**:
   - Email failures never roll back database state.
   - Transient failures (`429`, `5xx`, network timeout) increment `attempts`, compute exponential backoff (`next_attempt_at`, honoring `Retry-After`), and return the row to `pending` up to `MAX_ATTEMPTS = 4`.
   - Permanent payload errors (`400`, `422`) bisect the batch recursively to isolate the offending address so sibling recipients in the same batch still succeed.
   - Stale `sending` rows (older than 10 minutes from an interrupted worker) are automatically re-queued to `pending` on the next run.

## Formatted-String Placeholders (`{{...}}`)

Placeholders are case-insensitive, HTML-escaped in the HTML part, and stripped of control characters in `subject`:

| Placeholder (and aliases) | Source |
| --- | --- |
| `{{nama}}` / `{{name}}` | Profile full name, shadow slot name, or `customRecipients[].name` (fallback: `Sahabat ITB Insight`). |
| `{{email}}` | Recipient email address. |
| `{{nama_tim}}` / `{{team_name}}` | Team name from `competition_teams` or `customRecipients[].variables`. |
| `{{kode_tim}}` / `{{team_uid}}` | Team UID (e.g. `OE-1234`) from `competition_teams` or `customRecipients[].variables`. |
| `{{kompetisi}}` / `{{competition}}` | Competition name from `competitions` or `customRecipients[].variables`. |
| `{{institusi}}` / `{{sekolah}}` / `{{institution}}` | School/institution from profile, team member slot, or `customRecipients[].variables`. |
| `{{juara}}` / `{{peringkat}}` | Per-recipient rank/award from `customRecipients[].variables`. |
| `{{gdrive_link}}` / `{{link_sertifikat}}` / `{{sertifikat}}` | Per-recipient certificate link from `customRecipients[].variables`. |
| `{{password}}` (or any `[a-zA-Z0-9_]` key) | Per-recipient custom variable from `customRecipients[].variables` (auto-redacted after send). |

## Environment Variables (Server-Only)

Configure in `.env.local` / Vercel project settings (never prefix with `NEXT_PUBLIC_`):

- `RESEND_API_KEY` — Resend secret API key.
- `EMAIL_FROM` — Verified sender address, e.g. `ITB Insight <noreply@itbinsight.com>`.
- `EMAIL_REPLY_TO` — Optional reply-to address.

When `RESEND_API_KEY` or `EMAIL_FROM` is unset, `dryRun: true` previews still work and live sends return `503 EMAIL_NOT_CONFIGURED`.

## API Contract (`/api/admin/email`)

Requires an authenticated `admin` session (`getScopedUser(request, ['admin'])`).

### Example 1 — Announce Juara 1 / 2 / 3 with Google Drive Certificates (`POST`)

```json
{
  "dryRun": false,
  "subject": "Selamat {{juara}} {{kompetisi}} — {{nama_tim}}",
  "body": "Halo {{nama}} ({{nama_tim}}),\n\nSelamat telah meraih {{juara}} pada {{kompetisi}} ITB Insight 2026!\nUnduh e-sertifikat melalui tautan Google Drive berikut:\n{{gdrive_link}}\n\nTerima kasih atas partisipasinya.",
  "filter": {
    "customRecipients": [
      {
        "email": "ketua1@example.com",
        "name": "Alya Putri",
        "variables": {
          "nama_tim": "Garuda Robotics",
          "kompetisi": "Olimpiade Engineering",
          "juara": "Juara 1",
          "gdrive_link": "https://drive.google.com/drive/folders/juara-1"
        }
      },
      {
        "email": "ketua2@example.com",
        "name": "Bima Pratama",
        "variables": {
          "nama_tim": "Aero Lab",
          "kompetisi": "Olimpiade Engineering",
          "juara": "Juara 2",
          "gdrive_link": "https://drive.google.com/drive/folders/juara-2"
        }
      }
    ]
  }
}
```

### Example 2 — Send Credentials to Bulk-Created Shadow Accounts (`POST`)

Targets unclaimed shadow slots (`competition_team_members` where `user_id IS NULL`) and/or supplies each shadow user's generated password:

```json
{
  "dryRun": false,
  "subject": "Akses Akun ITB Insight 2026 — {{nama_tim}} ({{kode_tim}})",
  "body": "Halo {{nama}} dari {{institusi}},\n\nAkun tim {{nama_tim}} ({{kode_tim}}) untuk {{kompetisi}} telah disiapkan.\n\nEmail Login: {{email}}\nPassword Sementara: {{password}}\n\nSilakan masuk di https://itbinsight.com/login untuk mengakses dashboard tim Anda.",
  "filter": {
    "competitionSlugs": ["olimpiade-engineering"],
    "teamSources": ["form_import"],
    "shadowOnly": true,
    "customRecipients": [
      {
        "email": "ketua.oe1@example.com",
        "variables": { "password": "OE-2026-TempPassword1" }
      }
    ]
  }
}
```

### 3. Resume or Retry Failed Rows (`POST`)

```json
{
  "campaignId": "uuid",
  "retryFailed": true
}
```

### 4. Inspect Campaigns (`GET`)

- `GET /api/admin/email` — lists the 20 most recent campaigns.
- `GET /api/admin/email?campaignId=<uuid>` — returns campaign metadata, live `{ pending, sending, sent, failed }` counts, and recent failure details.
