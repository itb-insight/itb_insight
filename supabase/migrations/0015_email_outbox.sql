-- Email campaigns + outbox (PRD ACC-06: one central transactional email service).
--
-- An admin creates a campaign (subject, body, audience filter); one outbox row is queued per
-- recipient and delivered in batches by src/lib/email/campaigns.ts. The outbox is the source of
-- truth for delivery state, so a failed send never rolls anything else back and can be retried.
--
-- Server-only: both tables have RLS enabled and NO policies, and only service_role has grants.
-- Nothing here is readable or writable from the browser.

create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  subject text not null check (char_length(subject) between 1 and 150),
  body text not null check (char_length(body) between 1 and 10000),
  -- The audience filter exactly as the admin submitted it (audit trail of who was targeted).
  filter jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'sending', 'completed', 'partial', 'failed')),
  recipient_count integer not null default 0 check (recipient_count >= 0),
  sent_count integer not null default 0 check (sent_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  to_email text not null check (char_length(to_email) between 3 and 254),
  to_name text,
  -- Per-recipient template variables (e.g. juara, gdrive_link, team_name, team_uid, password).
  variables jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  next_attempt_at timestamptz not null default now(),
  provider_message_id text,
  -- "<campaign id>:<lower(email)>": a recipient can be queued only once per campaign.
  idempotency_key text not null unique,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_outbox_campaign_status_idx
  on public.email_outbox (campaign_id, status);
create index if not exists email_outbox_due_idx
  on public.email_outbox (status, next_attempt_at);
create index if not exists email_campaigns_created_at_idx
  on public.email_campaigns (created_at desc);

drop trigger if exists email_outbox_set_updated_at on public.email_outbox;
create trigger email_outbox_set_updated_at
  before update on public.email_outbox
  for each row execute function public.set_updated_at();

alter table public.email_campaigns enable row level security;
alter table public.email_outbox enable row level security;

revoke all on public.email_campaigns from anon, authenticated;
revoke all on public.email_outbox from anon, authenticated;
grant select, insert, update, delete on public.email_campaigns to service_role;
grant select, insert, update, delete on public.email_outbox to service_role;
