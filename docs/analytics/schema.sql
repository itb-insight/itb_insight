-- ITB Insight analytics schema — REFERENCE ONLY.
--
-- Nothing in the MVP executes this file. It is kept as .sql (rather than a TS
-- constant) so it stays copy-pasteable into psql and can never accidentally
-- become a runtime import. The DTOs in src/features/admin/data/types.ts mirror
-- these column names one-to-one so the adapters become near-literal SELECTs.
--
-- Division tags used by the application are CPT, EV, SP, MKT, CB, MISC —
-- see src/lib/analytics/divisions.ts, which is the source of truth.

-- Core event log
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    user_id UUID,                       -- nullable, only set if logged in (e.g. admin previewing)
    event_type TEXT NOT NULL,           -- 'sponsor_click', 'reg_started', 'reg_completed',
                                        -- 'qr_checkin', 'scroll_depth', 'page_view'
    division TEXT NOT NULL,             -- 'CPT', 'EV', 'SP', 'MKT', 'CB', 'MISC'
    page_path TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',        -- flexible per-event-type payload
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_type_division ON events (event_type, division);
CREATE INDEX idx_events_created_at ON events (created_at);
CREATE INDEX idx_events_session ON events (session_id);
-- GIN index only if you'll query inside metadata often (e.g. sponsorId)
CREATE INDEX idx_events_metadata_gin ON events USING GIN (metadata);

-- Registrations (structured, not just events — you need this as source of truth)
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    competition_id TEXT,                -- nullable if it's a general event, not competition
    division TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'started', -- 'started', 'completed', 'checked_in'
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    checked_in_at TIMESTAMPTZ
);

-- Sponsors (source of truth for the dashboard join)
CREATE TABLE sponsors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tier TEXT NOT NULL -- 'platinum', 'gold', 'silver'
);

-- Materialized view for the sponsor dashboard (refresh on a schedule, not live)
CREATE MATERIALIZED VIEW sponsor_stats AS
SELECT
    s.id AS sponsor_id,
    s.name,
    s.tier,
    COUNT(*) FILTER (WHERE e.event_type = 'sponsor_impression') AS impressions,
    COUNT(*) FILTER (WHERE e.event_type = 'sponsor_click') AS clicks,
    ROUND(
        COUNT(*) FILTER (WHERE e.event_type = 'sponsor_click')::numeric
        / NULLIF(COUNT(*) FILTER (WHERE e.event_type = 'sponsor_impression'), 0) * 100, 2
    ) AS ctr_percent
FROM sponsors s
LEFT JOIN events e ON e.metadata->>'sponsorId' = s.id
GROUP BY s.id, s.name, s.tier;

-- Refresh via cron / pg_cron:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY sponsor_stats;


-- ============================================================
-- Example dashboard queries
-- ============================================================

-- Registration funnel drop-off (per competition):
SELECT
    competition_id,
    COUNT(*) FILTER (WHERE status IN ('started','completed','checked_in')) AS started,
    COUNT(*) FILTER (WHERE status IN ('completed','checked_in')) AS completed,
    COUNT(*) FILTER (WHERE status = 'checked_in') AS checked_in,
    ROUND(
        COUNT(*) FILTER (WHERE status IN ('completed','checked_in'))::numeric
        / NULLIF(COUNT(*) FILTER (WHERE status IN ('started','completed','checked_in')), 0) * 100, 1
    ) AS completion_rate_pct
FROM registrations
GROUP BY competition_id
ORDER BY started DESC;

-- Scroll depth bail-out on the 3D flythrough (by device class):
SELECT
    metadata->>'deviceClass' AS device_class,
    ROUND(AVG((metadata->>'scrollDepthPct')::numeric), 1) AS avg_scroll_depth,
    COUNT(*) FILTER (WHERE (metadata->>'scrollDepthPct')::numeric < 20) AS early_bailouts,
    COUNT(*) AS total_sessions
FROM events
WHERE event_type = 'scroll_depth' AND page_path = '/flythrough'
GROUP BY device_class;

-- Daily traffic + top pages (general admin overview):
SELECT
    DATE_TRUNC('day', created_at) AS day,
    page_path,
    COUNT(*) AS views
FROM events
WHERE event_type = 'page_view'
GROUP BY day, page_path
ORDER BY day DESC, views DESC;


-- ============================================================
-- MVP deviations to reconcile before adopting this schema
-- ============================================================
-- 1. The app stores parsed device_type / browser / os columns instead of a raw
--    user_agent string, deliberately — a full UA is a fingerprinting surface.
--    Either add those columns or drop the parsed values into metadata.
-- 2. session_id is UUID here, but the client falls back to a non-UUID random
--    id when crypto.randomUUID is unavailable (insecure context). Use TEXT, or
--    validate server-side before insert.
-- 3. Sampled event types (scroll_depth at 1-in-10) are undercounted by design.
--    Any aggregate over them must scale by the sample rate — see
--    src/lib/analytics/config.ts.
