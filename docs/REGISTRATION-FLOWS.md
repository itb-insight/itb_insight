schema_version: 3

# Registration flows

## Current flow

Guests browse public pages; `/dashboard*` redirects to `/login?next=…`. Authenticated users ensure a `visitor_tickets` ticket, submit individual registration, or create/join a draft team then submit it. Submission locks membership. Current submission creates no payment attempt.

## Final PRD target flow

The CMP flow auto-prefills profile data, collects the CMP-05 documents in private storage (identity, follow/share evidence, and robot sketch when applicable), then creates Midtrans payment server-side. **Proof-of-transfer upload is not required or collected.** Webhook-verified payment state, not redirect state, drives the dashboard. Expired/failed payment can be retried without resubmitting registration. Registration review remains separate from payment.

Target RSVP, pre-registration, and QRS flows are separate PRD targets and need their planned entities/APIs. See [PAYMENT-FLOWS.md](PAYMENT-FLOWS.md).
