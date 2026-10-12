-- Product database migration: user_profiles and journal extensions
-- Never apply to SCA Matrix.
begin;

-- 1. Create user_profiles table
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  initial_battery integer check (initial_battery between 0 and 100 and initial_battery % 5 = 0),
  polarity text check (polarity in ('activo', 'pasivo', 'positiva', 'preventiva')),
  primary_layer text check (primary_layer in ('temperamento', 'caracter', 'personalidad')),
  gamification_enabled boolean not null default true,
  onboarding_completed boolean not null default false
);

-- RLS for user_profiles
alter table public.user_profiles enable row level security;
revoke all on public.user_profiles from anon, authenticated;
grant select, insert, update on public.user_profiles to authenticated;

drop policy if exists profiles_read_own on public.user_profiles;
create policy profiles_read_own on public.user_profiles for select to authenticated using ((select auth.uid()) = id);

drop policy if exists profiles_insert_own on public.user_profiles;
create policy profiles_insert_own on public.user_profiles for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.user_profiles;
create policy profiles_update_own on public.user_profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- 2. Add optional extensions to journal_entries for spheres & sefirot
alter table public.journal_entries 
  add column if not exists sphere text check (sphere is null or sphere in ('personal', 'profesional', 'social', 'familiar', 'pareja'));

alter table public.journal_entries 
  add column if not exists sefira text check (sefira is null or sefira in ('jesed', 'guevura', 'tiferet', 'netzaj-hod', 'yesod-maljut'));

-- Grants on journal_entries already cover authenticated users for select, insert
grant update on public.journal_entries to authenticated;
drop policy if exists journal_update_own on public.journal_entries;
create policy journal_update_own on public.journal_entries for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

commit;
