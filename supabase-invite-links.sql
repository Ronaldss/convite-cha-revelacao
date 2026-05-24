alter table public.guests
  add column if not exists display_name text,
  add column if not exists phone text,
  add column if not exists invite_code text,
  add column if not exists voted_at timestamptz;

drop index if exists guests_invite_code_key;
create unique index if not exists guests_invite_code_key
on public.guests (invite_code);

alter table public.gender_votes
  add column if not exists guest_id uuid references public.guests(id) on delete cascade,
  add column if not exists guest_display_name text;

drop index if exists gender_votes_guest_id_key;
create unique index if not exists gender_votes_guest_id_key
on public.gender_votes (guest_id);
