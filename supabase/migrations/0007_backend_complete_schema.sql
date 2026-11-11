-- Complete backend schema addressing PRD requirements (QRS, EVT, CMP, PRT, FBK, PRE, ADM, SEC)

-- 1. Expand admin_roles constraint for scoped staff/exhibitor roles
alter table public.admin_roles
  drop constraint if exists admin_roles_role_check;

alter table public.admin_roles
  add constraint admin_roles_role_check
  check (role in ('admin', 'field_staff', 'gate_staff', 'booth_staff', 'exhibitor'));

-- Scoped role helper function
create or replace function public.has_role(p_user_id uuid, p_role text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_roles
    where admin_roles.user_id = p_user_id
      and (admin_roles.role = 'admin' or admin_roles.role = p_role)
  );
$$;

-- 2. Expand payments status check constraint to include 'refunded' (PRD CMP-12, D-11)
alter table public.payments
  drop constraint if exists payments_status_check;

alter table public.payments
  add constraint payments_status_check
  check (status in ('pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded'));

-- 3. Booths & Zones (EVT-05, MAP-02, QRS-04)
create table if not exists public.booths (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null, -- 'ai', 'energy', 'robotics', 'interactive_games', 'sponsor', etc.
  description text,
  location_name text,
  coordinate_x double precision,
  coordinate_y double precision,
  qr_code text not null unique,
  points integer not null default 10 check (points >= 0),
  exhibitor_user_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booths_category_idx on public.booths (category);
create index if not exists booths_qr_code_idx on public.booths (qr_code);

create trigger booths_set_updated_at
  before update on public.booths
  for each row execute function public.set_updated_at();

alter table public.booths enable row level security;

create policy "Anyone can read active booths" on public.booths
  for select
  using (is_active = true or public.is_admin((select auth.uid())));

create policy "Admins can manage booths" on public.booths
  for all
  using (public.is_admin((select auth.uid())));

-- 4. Booth Scan Events & Gamification (QRS-04, QRS-05, QRS-09, QRS-10)
create table if not exists public.booth_scan_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  booth_id uuid not null references public.booths(id) on delete cascade,
  points_awarded integer not null default 10 check (points_awarded >= 0),
  scanned_at timestamptz not null default now(),
  unique (user_id, booth_id)
);

create index if not exists booth_scan_events_user_id_idx on public.booth_scan_events (user_id);
create index if not exists booth_scan_events_booth_id_idx on public.booth_scan_events (booth_id);

alter table public.booth_scan_events enable row level security;

create policy "Users can read own booth scans" on public.booth_scan_events
  for select
  using (
    user_id = (select auth.uid())
    or public.is_admin((select auth.uid()))
    or exists (
      select 1 from public.booths
      where booths.id = booth_scan_events.booth_id
        and booths.exhibitor_user_id = (select auth.uid())
    )
  );

-- 5. Gate Check-Ins (QRS-02, QRS-03, QRS-06, QRS-07)
create table if not exists public.gate_check_ins (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.visitor_tickets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  checked_in_by uuid references public.profiles(id) on delete set null,
  gate_name text not null default 'main_gate',
  check_in_type text not null default 'staff_scan' check (check_in_type in ('staff_scan', 'self_scan', 'manual_lookup')),
  checked_in_at timestamptz not null default now()
);

create index if not exists gate_check_ins_user_id_idx on public.gate_check_ins (user_id);
create index if not exists gate_check_ins_ticket_id_idx on public.gate_check_ins (ticket_id);
create index if not exists gate_check_ins_checked_in_at_idx on public.gate_check_ins (checked_in_at);

alter table public.gate_check_ins enable row level security;

create policy "Users can read own gate check-ins" on public.gate_check_ins
  for select
  using (
    user_id = (select auth.uid())
    or public.has_role((select auth.uid()), 'gate_staff')
  );

-- 6. RSVP Invites for VIPs and Alumni (EVT-09, EVT-10, J-4)
create table if not exists public.rsvp_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  invitee_name text not null,
  institution text not null,
  position text,
  email text not null,
  phone text,
  attendance_status text not null default 'pending' check (attendance_status in ('pending', 'attending', 'not_attending', 'represented')),
  substitute_name text,
  e_ticket_code text unique,
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rsvp_invites_token_idx on public.rsvp_invites (token);
create index if not exists rsvp_invites_email_idx on public.rsvp_invites (email);

create trigger rsvp_invites_set_updated_at
  before update on public.rsvp_invites
  for each row execute function public.set_updated_at();

alter table public.rsvp_invites enable row level security;

create policy "Admins can manage RSVP invites" on public.rsvp_invites
  for all
  using (public.is_admin((select auth.uid())));

-- 7. Feedback Responses (FBK-01..05)
create table if not exists public.feedback_responses (
  id uuid primary key default gen_random_uuid(),
  context text not null check (context in ('event', 'booth', 'inspirates')),
  booth_id uuid references public.booths(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  category text,
  comment text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists feedback_responses_context_idx on public.feedback_responses (context);
create index if not exists feedback_responses_booth_id_idx on public.feedback_responses (booth_id);

alter table public.feedback_responses enable row level security;

create policy "Anyone can submit feedback" on public.feedback_responses
  for insert
  to anon, authenticated
  with check (rating between 1 and 5);

create policy "Staff and admins can read feedback" on public.feedback_responses
  for select
  using (public.is_admin((select auth.uid())));

-- 8. Partners & Sponsorship Wall (PRT-01..04)
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier text not null check (tier in ('diamond', 'gold', 'silver', 'bronze', 'media_partner')),
  logo_url text not null,
  website_url text,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partners_tier_idx on public.partners (tier);

create trigger partners_set_updated_at
  before update on public.partners
  for each row execute function public.set_updated_at();

alter table public.partners enable row level security;

create policy "Anyone can read active partners" on public.partners
  for select
  using (is_active = true or public.is_admin((select auth.uid())));

create policy "Admins can manage partners" on public.partners
  for all
  using (public.is_admin((select auth.uid())));

-- 9. Integrated Partnership Inquiry Form (PRT-05)
create table if not exists public.partnership_inquiries (
  id uuid primary key default gen_random_uuid(),
  cooperation_type text not null check (cooperation_type in ('sponsorship', 'media_partner', 'other')),
  institution_name text not null,
  contact_person text not null,
  job_title text,
  industry text,
  scale text,
  email text not null,
  phone text,
  description text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partnership_inquiries_status_idx on public.partnership_inquiries (status);

create trigger partnership_inquiries_set_updated_at
  before update on public.partnership_inquiries
  for each row execute function public.set_updated_at();

alter table public.partnership_inquiries enable row level security;

create policy "Anyone can submit inquiry" on public.partnership_inquiries
  for insert
  to anon, authenticated
  with check (true);

create policy "Admins can read and manage inquiries" on public.partnership_inquiries
  for select
  using (public.is_admin((select auth.uid())));

-- 10. Inspirates Activity Records (PRE-01..03)
create table if not exists public.inspirates_records (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  activity_date date not null default current_date,
  participant_count integer not null default 0 check (participant_count >= 0),
  dissemination_members text[] not null default '{}',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger inspirates_records_set_updated_at
  before update on public.inspirates_records
  for each row execute function public.set_updated_at();

alter table public.inspirates_records enable row level security;

create policy "Staff and admins can read and manage inspirates records" on public.inspirates_records
  for all
  using (public.is_admin((select auth.uid())) or public.has_role((select auth.uid()), 'field_staff'));

-- 11. Security Audit Logs (SEC-04, ADM-06)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  record_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_action_idx on public.audit_logs (action);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at);

alter table public.audit_logs enable row level security;

create policy "Only admins can read audit logs" on public.audit_logs
  for select
  using (public.is_admin((select auth.uid())));
