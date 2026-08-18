schema_version: 3

# Decisions

## Historical decisions — 2026-08-19

| Decision | Historical context |
| --- | --- |
| Narrow MVP plus future scope as baseline | Superseded as product authority; retained as the prior delivery framing. |
| Secure operational admin milestone | Superseded as the sole framing; retained as a staged delivery area. |
| Volatile analytics status | Still accurate for current runtime. |

## Supersession record — 2026-08-19

- Final [PRD(v1.0).md](PRD(v1.0).md) supersedes “narrow MVP + broad future” as product authority.
- The earlier secure-admin-only milestone is one staged delivery area in the full PRD.
- Payments, full RBAC/audit/retention, analytics outcomes, and wider modules are final requirements; current runtime is unchanged until implemented.
- D-01 through D-03 are decided; D-04 through D-11 below remain unresolved.

## Standing implementation decisions

- `src/lib/competitions.ts` is current competition content; Google OAuth is current auth capability.
- Use `visitor_tickets`, not legacy `rsvp`; keep service-role access server-only.
- Payment state is separate from registration verification; team membership locks after final submit.

## Open PRD decisions

| ID | Decision |
| --- | --- |
| D-04 | Backend/database stack; Supabase is current implementation, but the final PRD decision remains open. |
| D-05 | Scroll-narration output format. |
| D-06 | Interactive-map content owner. |
| D-07 | Partnership inquiry company-domain verification. |
| D-08 | Main-event and registration deadline dates. |
| D-09 | Midtrans merchant account/legal entity owner. |
| D-10 | Midtrans MDR bearer. |
| D-11 | Registration cancellation/refund policy. |
