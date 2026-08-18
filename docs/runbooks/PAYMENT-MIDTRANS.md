schema_version: 2

# Planned Midtrans runbook

**Not operational yet.** `payments` and `midtrans_transactions` are present in migration `0004`, but this repository has no payment routes, Mock-payment controls, Snap creation, UI, or notification webhook.

## Before any implementation or sandbox operation

1. Approve the payment API and ownership model in [PAYMENT-FLOWS.md](../PAYMENT-FLOWS.md).
2. Define a server-only secret boundary for any Midtrans server key; never use `NEXT_PUBLIC_*` for it.
3. Implement server-side amount calculation, transaction creation, signature verification, idempotent notification handling, retry/expiry behavior, reconciliation, authorized correction/refund handling, and tests.
4. Verify sandbox behavior in an approved non-production environment before considering production configuration.
5. Record a separate production go-live decision and release verification.

`paid` must not automatically change a registration to `verified`. Until the preceding work exists, do not configure operational payment routes or assert that a mock or Midtrans flow works.
