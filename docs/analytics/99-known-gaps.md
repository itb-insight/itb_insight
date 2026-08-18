# Analytics known gaps

1. **Public admin demo:** `/admin` and `GET /api/admin/events` are not authorized. `noindex` is not access control.
2. **Volatile ingest:** accepted events stay in a 500-item, per-process memory buffer and disappear on restart/redeploy.
3. **No persistence wiring:** `analytics_events` exists in migration `0006`, but `/api/track` does not insert into it.
4. **Mock metrics:** all dashboard figures except the recent-event feed are mock/non-authoritative.
5. **Per-process rate limiting:** the ingest guard is not globally enforced across instances.
6. **Reference-only SQL:** [schema.sql](schema.sql) is proposed/reference SQL, not a migration or a runtime source.

Do not make operational, sponsor, security, or capacity claims from current dashboard values. Address authorization, persistence, and query/rollup design together before treating analytics as an operational system.
