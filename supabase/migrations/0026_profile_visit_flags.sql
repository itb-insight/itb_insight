-- D-day visit flags on profiles. Both only ever go false -> true: leaving the area later does not
-- reset them.
--   entered_gate: a gate staff member (role_a 'staff', role_b 'human_resource', role_c 'gate_staff')
--                 or an admin scanned the visitor's profile QR at the gate (/admin/gate,
--                 POST /api/gate/scan; the older /api/check-in/scan and /manual too).
--   visited_itb:  the visitor's phone was seen inside the event zone: a consented presence ping
--                 (POST /api/presence/ping) or a geofenced self check-in (POST /api/check-in/self).
-- Written by the server with the service role only. 0023 grants authenticated users update on
-- (full_name, phone, institution) alone, so these columns are not user-writable.

alter table public.profiles
  add column if not exists entered_gate boolean not null default false,
  add column if not exists visited_itb boolean not null default false;
