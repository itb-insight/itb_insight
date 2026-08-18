schema_version: 3

# Current delivery phase / MVP slice

This phase is a delivery slice under [PRD(v1.0).md](PRD(v1.0).md), not product authority. Deferred PRD Must requirements remain required targets.

## Included now

- ACC identity/profile foundations, Google OAuth, protected participant dashboard, visitor QR ticket, and competition registration/team submission.
- CMP registration baseline and the schema foundations for payment.
- MAP base interactive map implementation and public competition/event content where source supplies it.
- Volatile analytics ingest as a development capability only.

## Deferred required targets and prerequisites

| PRD area | Required target or prerequisite | Current phase position |
| --- | --- | --- |
| ACC/ADM/QRS | Scoped RBAC, protected `/admin/*`, audit logs, operational check-in and exports | Must target; requires server authorization and audit schema/runtime. |
| CMP | CMP-05 uploads and CMP-10–CMP-16 Midtrans payments | Must target; requires private storage, merchant decisions D-09–D-11, API/UI/webhook/reconciliation. |
| EVT/FBK/PRT/PRE/GAL/INF | RSVP, programs, feedback, partnership, gallery, privacy/consent | Required target; staged by dependencies/content. |
| QRS | gate/manual/self check-in, booth scans and idempotency | Required target; needs planned entities and scoped staff access. |
| LND/EVT/MAP | final content, performance/accessibility gates, map owner/assets | Required target; blocked in part by D-05, D-06, D-08 and assets. |
| ADM analytics | durable analytics and PostHog | PRD Should target; current analytics is not persistent. |

## Boundaries

- `visitor_tickets`, not legacy `rsvp`, remains the current ticket table.
- Registration status is separate from payment status; team membership locks after final submission.
- Service-role credentials stay server-only.
- Native mobile apps, full bilingual delivery, complex Inspirates registration, and live streaming remain PRD won't-haves.
