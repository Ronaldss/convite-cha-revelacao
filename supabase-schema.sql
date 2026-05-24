create extension if not exists pgcrypto;

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  attendance_confirmed boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.gender_votes (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  vote text not null check (vote in ('menina', 'menino')),
  created_at timestamptz not null default now()
);

alter table public.guests enable row level security;
alter table public.gender_votes enable row level security;

drop policy if exists "Guests can insert attendance" on public.guests;
create policy "Guests can insert attendance"
on public.guests
for insert
to anon
with check (true);

drop policy if exists "Guests can read attendance" on public.guests;
create policy "Guests can read attendance"
on public.guests
for select
to anon
using (true);

drop policy if exists "Guests can insert votes" on public.gender_votes;
create policy "Guests can insert votes"
on public.gender_votes
for insert
to anon
with check (true);

drop policy if exists "Guests can read votes" on public.gender_votes;
create policy "Guests can read votes"
on public.gender_votes
for select
to anon
using (true);
