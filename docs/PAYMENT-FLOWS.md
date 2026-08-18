schema_version: 3

# Payment flows

**PRD Must target; not operational.** Migration `0004` has payment tables only.

1. Server validates a submitted registration and derives the amount from competition configuration; the client never supplies an amount.
2. Server creates/records a Midtrans payment attempt and sends the user to hosted/Snap payment.
3. Redirect return is informational only. A verified Midtrans webhook updates payment state idempotently.
4. Handle duplicate/delayed notifications, retryable expired/failed attempts, scheduled/API reconciliation, and authorized manual correction with audit logs.
5. Expose order ID, registration/team, amount, method, status, and settlement time for treasury export.
6. Do not auto-change `competition_registrations` verification after payment. Refund/cancellation rules remain D-11.

Server keys are server-only; card/bank data never enters this application. Midtrans merchant ownership (D-09) and MDR (D-10) are unresolved.
