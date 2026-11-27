-- Insight Arcade: the teams a watcher can vote for in "Nonton Drone Soccer Competition".
--
-- Before: the vote listed competition_teams of `microdrone-obstacle-race`, but the Drone Soccer
-- teams registered outside the site, so that list was empty and the quest could not be submitted.
-- Now: drone_soccer_teams holds the official roster (temp/Daftar Peserta Drone Soccer.xlsx, 32
-- teams) and sidequest_submissions.vote_team_id points at it. Read by the server only.
-- To change the roster later: a new migration that inserts / deletes rows here (deleting a team
-- clears its votes, on delete set null).

create table if not exists public.drone_soccer_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);

alter table public.drone_soccer_teams enable row level security;
revoke all on public.drone_soccer_teams from anon, authenticated;
grant select, insert, update, delete on public.drone_soccer_teams to service_role;

insert into public.drone_soccer_teams (name) values
  ('(PP) Pencari Pengalaman'),
  ('Orbital X'),
  ('SkyForge'),
  ('Grim Reapers'),
  ('Sky Strikers'),
  ('Nevara'),
  ('Biosync'),
  ('Anak Papa'),
  ('ITB IM''COMING'),
  ('JETE aku mau drone'),
  ('MAUNG TSK'),
  ('AEROTECH'),
  ('RAGUL ( Raja Gula)'),
  ('MdB'),
  ('Aetherion'),
  ('SkyDuo'),
  ('ARS Drone'),
  ('yang penting ikut'),
  ('FlyForge'),
  ('Java Skyward'),
  ('AeroJava'),
  ('Squadrone'),
  ('Chrisyel'),
  ('rekter 100'),
  ('BACAMENANG'),
  ('Ya, op op'),
  ('Sparkling'),
  ('Rakatuy Quidditch'),
  ('Barudak Livies'),
  ('Hawks'),
  ('Mini Pekka'),
  ('Durian Has Fallen')
on conflict (name) do nothing;

-- Votes cast against the old list referenced competition_teams; they cannot map to this roster.
alter table public.sidequest_submissions
  drop constraint if exists sidequest_submissions_vote_team_id_fkey;
update public.sidequest_submissions
set vote_team_id = null
where vote_team_id is not null
  and vote_team_id not in (select id from public.drone_soccer_teams);
alter table public.sidequest_submissions
  add constraint sidequest_submissions_vote_team_id_fkey
  foreign key (vote_team_id) references public.drone_soccer_teams(id) on delete set null;
