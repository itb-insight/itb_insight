-- Admin manual point awards without a booth (testing / corrections via /admin/qr-points).
-- booth_scan_events.booth_id NULL = manual award. unique (user_id, booth_id) treats NULLs as
-- distinct, so manual awards are not deduplicated; booth awards stay once per visitor per booth.
alter table public.booth_scan_events
  alter column booth_id drop not null;
