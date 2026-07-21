-- Lightweight web analytics. Events are batched client-side and inserted in bulk to avoid
-- fan-out (one INSERT per flush, not per event). See src/lib/analytics/.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  event_name text not null,
  path text,
  props jsonb not null default '{}'::jsonb,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at);
create index if not exists analytics_events_event_name_idx on public.analytics_events (event_name);
create index if not exists analytics_events_session_id_idx on public.analytics_events (session_id);

alter table public.analytics_events enable row level security;

-- Write-only from the browser: anon + authenticated may INSERT, nobody may SELECT with those
-- roles. Reading is done by admins (service role) or via the admin policy below.
drop policy if exists "Anyone can insert analytics events" on public.analytics_events;
create policy "Anyone can insert analytics events" on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can read analytics events" on public.analytics_events;
create policy "Admins can read analytics events" on public.analytics_events
  for select
  to authenticated
  using (public.is_admin((select auth.uid())));
