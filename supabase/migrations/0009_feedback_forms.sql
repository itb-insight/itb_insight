-- 0009 — Configurable feedback engine (FBK-01..05). See docs/FEEDBACK.md.
--
-- One engine, two tables. A form's questions live in `feedback_forms.questions` (jsonb);
-- answers live in `feedback_submissions.answers` (jsonb, keyed by question id) and are
-- validated against the form by the API (src/lib/feedback/schema.ts) before insert.
-- Analysts get a flat, per-form view named `feedback_<slug>` (see bottom of file).
--
-- Writes happen ONLY through the API with the service role: there is deliberately no
-- insert policy for anon/authenticated, so the public anon key cannot bypass validation,
-- rate limiting or Turnstile by posting straight to PostgREST.

-- ─── Legacy table ────────────────────────────────────────────────────────────
-- `feedback_responses` (0007) is superseded. Data is kept; direct anon inserts are closed.
drop policy if exists "Anyone can submit feedback" on public.feedback_responses;
comment on table public.feedback_responses is
  'LEGACY (superseded by feedback_forms / feedback_submissions in 0009). Read-only.';

-- ─── Forms ───────────────────────────────────────────────────────────────────
create table if not exists public.feedback_forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  description text,
  context text not null check (context in ('event', 'booth', 'inspirates', 'competition', 'pre_event')),
  questions jsonb not null check (jsonb_typeof(questions) = 'array'),
  opens_at timestamptz,
  closes_at timestamptz,
  is_active boolean not null default true,
  -- Name/email/user link are wiped this many days after closes_at (purge_expired_feedback_pii).
  pii_retention_days integer not null default 180 check (pii_retention_days between 1 and 730),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (opens_at is null or closes_at is null or opens_at < closes_at)
);

create trigger feedback_forms_set_updated_at
  before update on public.feedback_forms
  for each row execute function public.set_updated_at();

alter table public.feedback_forms enable row level security;

create policy "Admins can read feedback forms" on public.feedback_forms
  for select
  using (public.is_admin((select auth.uid())));

-- ─── Submissions ─────────────────────────────────────────────────────────────
create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.feedback_forms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  -- Nullable only so the retention purge can wipe them; the API always requires both.
  name text check (name is null or char_length(name) between 1 and 100),
  email text check (email is null or char_length(email) between 3 and 254),
  overall_rating smallint check (overall_rating between 1 and 5),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  consent_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- One submission per email per form (emails are stored lower-cased by the API; the
-- expression keeps this true even for manual inserts). NULLs (purged rows) never collide.
create unique index if not exists feedback_submissions_form_email_key
  on public.feedback_submissions (form_id, lower(email));
create unique index if not exists feedback_submissions_form_user_key
  on public.feedback_submissions (form_id, user_id) where user_id is not null;
create index if not exists feedback_submissions_form_created_idx
  on public.feedback_submissions (form_id, created_at desc);

alter table public.feedback_submissions enable row level security;

create policy "Admins can read feedback submissions" on public.feedback_submissions
  for select
  using (public.is_admin((select auth.uid())));

-- ─── Grants ──────────────────────────────────────────────────────────────────
-- Explicit, because newer Supabase versions no longer auto-grant table privileges to the
-- API roles (and older ones grant everything). The API writes as service_role; signed-in
-- users may only SELECT, which RLS narrows to admins; anon gets nothing.
grant select, insert, update, delete on public.feedback_forms, public.feedback_submissions to service_role;
revoke all on public.feedback_forms, public.feedback_submissions from anon;
revoke insert, update, delete, truncate on public.feedback_forms, public.feedback_submissions from authenticated;
grant select on public.feedback_forms, public.feedback_submissions to authenticated;

-- ─── Retention (privacy) ─────────────────────────────────────────────────────
-- Wipes name, email and user link from submissions whose form closed more than
-- pii_retention_days ago. Answers and ratings stay for reporting. Returns rows purged.
-- Run manually (`select private.purge_expired_feedback_pii();`) or schedule with pg_cron:
--   select cron.schedule('purge-feedback-pii', '0 3 * * *', 'select private.purge_expired_feedback_pii()');
--
-- Lives in `private`, a schema PostgREST does not expose, so it is unreachable over HTTP.
-- (A revoked function in `public` is still routable at /rest/v1/rpc/<name>; on the local
-- Supabase image 17.6.1.127 an anon call to any such function segfaults Postgres.)
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.purge_expired_feedback_pii()
returns integer
language sql
security definer
set search_path = public
as $$
  with purged as (
    update public.feedback_submissions s
    set name = null, email = null, user_id = null
    from public.feedback_forms f
    where s.form_id = f.id
      and f.closes_at is not null
      and now() > f.closes_at + make_interval(days => f.pii_retention_days)
      and (s.name is not null or s.email is not null or s.user_id is not null)
    returning 1
  )
  select count(*)::integer from purged;
$$;

revoke execute on function private.purge_expired_feedback_pii() from public, anon, authenticated;

-- ─── Seed: Inspirates 2026 (first use case) ──────────────────────────────────
-- Source: docs/references/CPWR_INSPIRATES.pdf (section "FORM FEEDBACK", school timeline).
-- URL / QR: /feedback/inspirates-2026 (one link for every school; students pick their school).
insert into public.feedback_forms (slug, title, description, context, opens_at, closes_at, questions)
values (
  'inspirates-2026',
  'Feedback Inspirates ITB Insight 2026',
  'Terima kasih sudah ikut Inspirates! Ceritakan pengalamanmu hari ini, cuma butuh 1 menit.',
  'inspirates',
  '2026-11-11 00:00:00+07',
  '2026-11-24 23:59:59+07',
  $json$[
    {"id": "school", "type": "choice", "label": "Asal sekolah", "required": true, "options": [
      {"value": "sman-1-dayeuhkolot", "label": "SMAN 1 Dayeuhkolot"},
      {"value": "sma-muhammadiyah-1-cimahi", "label": "SMA Muhammadiyah 1 Cimahi"},
      {"value": "sman-1-bandung", "label": "SMAN 1 Bandung"},
      {"value": "sman-1-ngamprah", "label": "SMAN 1 Ngamprah"},
      {"value": "sman-4-cimahi", "label": "SMAN 4 Cimahi"},
      {"value": "sman-16-bandung", "label": "SMAN 16 Bandung"}
    ]},
    {"id": "fun", "type": "stars", "label": "Seberapa seru kegiatan Inspirates hari ini?", "required": true, "overall": true},
    {"id": "favorite_part", "type": "choice", "label": "Bagian mana yang paling kamu suka?", "required": true, "options": [
      {"value": "demo_alat", "label": "Demo alat"},
      {"value": "mini_eksperimen", "label": "Mini eksperimen"},
      {"value": "kuis", "label": "Kuis"},
      {"value": "tanya_jawab", "label": "Tanya jawab"},
      {"value": "pengenalan_tf", "label": "Pengenalan Teknik Fisika"}
    ]},
    {"id": "clarity", "type": "scale", "label": "Apakah materi hari ini mudah dipahami?", "required": true,
     "min": 1, "max": 5, "minLabel": "Sulit dipahami", "maxLabel": "Sangat mudah"},
    {"id": "clarity_comment", "type": "short", "label": "Komentar singkat tentang materi", "required": false},
    {"id": "interest", "type": "choice", "label": "Setelah kegiatan ini, apakah kamu jadi lebih tertarik dengan sains dan teknologi?", "required": true, "options": [
      {"value": "ya", "label": "Ya"},
      {"value": "sedikit", "label": "Sedikit"},
      {"value": "belum", "label": "Belum"}
    ]},
    {"id": "suggestion", "type": "long", "label": "Apa saran kamu supaya kegiatan ini lebih seru lagi?", "required": false}
  ]$json$::jsonb
)
on conflict (slug) do nothing;

-- ─── Per-form flat views (naming convention: feedback_<slug with _>) ─────────
-- security_invoker makes the view obey the caller's RLS (admins only); without it a view
-- runs as its owner and would expose PII through the public REST API. Grants are revoked
-- from the API roles as a second lock.
create or replace view public.feedback_inspirates_2026
with (security_invoker = true) as
select
  s.id,
  s.created_at,
  s.name,
  s.email,
  s.user_id,
  s.overall_rating,
  s.answers ->> 'school' as school,
  (s.answers ->> 'fun')::smallint as fun,
  s.answers ->> 'favorite_part' as favorite_part,
  (s.answers ->> 'clarity')::smallint as clarity,
  s.answers ->> 'clarity_comment' as clarity_comment,
  s.answers ->> 'interest' as interest,
  s.answers ->> 'suggestion' as suggestion
from public.feedback_submissions s
join public.feedback_forms f on f.id = s.form_id
where f.slug = 'inspirates-2026';

revoke all on public.feedback_inspirates_2026 from anon, authenticated;
grant select on public.feedback_inspirates_2026 to service_role;
