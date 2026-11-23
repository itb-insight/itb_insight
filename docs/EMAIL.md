# Simultaneous Email Campaigns (ACC-06)

Admin-triggered bulk/announcement email delivery backed by `email_campaigns`, `email_outbox`, and Resend's batch API.

## Architecture & Guarantees

1. **Outbox-First Persistence**: Every recipient is persisted to `public.email_outbox` (`status = 'pending'`, unique `idempotency_key = "<campaign_id>:<email>"`) before any external network call is made.
2. **Non-Blocking Execution**: `POST /api/admin/email` queues the campaign and schedules `processCampaign(campaignId)` via Next.js `after()` (`next/server`), returning `202 Accepted` immediately so the admin request does not time out.
3. **Batching & Concurrency**: Delivery claims pending rows atomically (`update ... where status = 'pending'`) and sends in batches of up to 100 emails (`POST https://api.resend.com/emails/batch`) with bounded concurrency (2 batches in flight) and deterministic `Idempotency-Key` headers.
4. **Fault Isolation & Retry**:
   - Email failures never roll back database state.
   - Transient failures (`429`, `5xx`, network timeout) increment `attempts`, compute exponential backoff (`next_attempt_at`, honoring `Retry-After`), and return the row to `pending` up to `MAX_ATTEMPTS = 4`.
   - Permanent payload errors (`400`, `422`) bisect the batch recursively to isolate the offending address so sibling recipients in the same batch still succeed.
   - Stale `sending` rows (older than 10 minutes from an interrupted worker) are automatically re-queued to `pending` on the next run.

## Environment Variables (Server-Only)

Configure in `.env.local` / Vercel project settings (never prefix with `NEXT_PUBLIC_`):

- `RESEND_API_KEY` — Resend secret API key.
- `EMAIL_FROM` — Verified sender address, e.g. `ITB Insight <noreply@itbinsight.com>`.
- `EMAIL_REPLY_TO` — Optional reply-to address.

When `RESEND_API_KEY` or `EMAIL_FROM` is unset, `dryRun: true` previews still work and live sends return `503 EMAIL_NOT_CONFIGURED`.

## API Contract (`/api/admin/email`)

Requires an authenticated `admin` session (`getScopedUser(request, ['admin'])`).

### 1. Preview Audience & Rendered Email (`POST`)

```json
{
  "dryRun": true,
  "subject": "Pengumuman untuk {{nama}}",
  "body": "Halo {{nama}},\n\nBerikut informasi terbaru ITB Insight 2026.",
  "filter": {
    "competitionSlugs": ["business-plan-competition"],
    "registrationStatus": ["verified"],
    "paymentStatus": ["paid"],
    "checkedIn": true,
    "roleA": ["staff"],
    "manualEmails": ["tamu@example.com"]
  }
}
```

- Criteria inside `filter` are combined with `AND` (`manualEmails` is unioned on top).
- An empty filter is rejected; targeting all accounts requires `"allUsers": true`.
- Competition criteria automatically include both individual registrants and all members of matching teams.

### 2. Queue & Send Campaign (`POST`)

Same payload as above with `"dryRun": false` (or omitted). Returns `202`:

```json
{
  "success": true,
  "data": {
    "campaignId": "uuid",
    "status": "sending",
    "recipientCount": 240
  },
  "error": null
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
