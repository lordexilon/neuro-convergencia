-- Product database only. Never apply to SCA Matrix.
begin;
create table if not exists public.journal_entries (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  context text not null check (length(btrim(context)) between 1 and 500),
  battery integer not null check (battery between 0 and 100 and battery % 5 = 0),
  reactivity text not null check (reactivity in ('impulso','emocion','mente','observador')),
  bias text not null check (bias in ('pasado','futuro','creencia','realidad')),
  tags text[] not null default '{}' check (tags <@ array['control','duda','limites','aislamiento','perfeccionismo','empatia']::text[] and cardinality(tags)<=6 and array_position(tags,null) is null),
  calib1 text not null check (length(btrim(calib1)) between 1 and 1000),
  calib2 text not null check (length(btrim(calib2)) between 1 and 1000),
  calib3 text not null check (length(btrim(calib3)) between 1 and 1000),
  learning text not null default '' check (length(learning)<=1000)
);
create index if not exists journal_entries_owner_date on public.journal_entries(owner_id,created_at desc,id desc);
alter table public.journal_entries enable row level security;
revoke all on public.journal_entries from anon,authenticated;
grant select,insert on public.journal_entries to authenticated;
drop policy if exists journal_read_own on public.journal_entries;
create policy journal_read_own on public.journal_entries for select to authenticated using ((select auth.uid())=owner_id);
drop policy if exists journal_insert_own on public.journal_entries;
create policy journal_insert_own on public.journal_entries for insert to authenticated with check ((select auth.uid())=owner_id);
commit;
