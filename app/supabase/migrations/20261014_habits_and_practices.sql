-- Product database migration: habits and habit_practices
-- Never apply to SCA Matrix.
begin;

-- 1. Tabla de hábitos definidos por el usuario (3R: Recordatorio, Rutina, Recompensa)
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  reminder text not null,      -- Recordatorio (Disparador / Gatillo)
  routine text not null,       -- Rutina (Acción simple)
  reward text not null,        -- Recompensa (Frase / sensación / premio positivo)
  is_keystone boolean not null default false, -- Hábito clave
  substitute_for text,         -- Mal hábito que sustituye (si aplica)
  is_active boolean not null default true
);

-- RLS para habits
alter table public.habits enable row level security;
revoke all on public.habits from anon, authenticated;
grant select, insert, update, delete on public.habits to authenticated;

drop policy if exists habits_read_own on public.habits;
create policy habits_read_own on public.habits for select to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists habits_insert_own on public.habits;
create policy habits_insert_own on public.habits for insert to authenticated with check ((select auth.uid()) = owner_id);

drop policy if exists habits_update_own on public.habits;
create policy habits_update_own on public.habits for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

drop policy if exists habits_delete_own on public.habits;
create policy habits_delete_own on public.habits for delete to authenticated using ((select auth.uid()) = owner_id);

-- 2. Tabla de prácticas diarias de hábitos (acumulativas, sin penalizaciones)
create table if not exists public.habit_practices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  practiced_at date not null default current_date,
  created_at timestamptz not null default now(),
  note text,
  unique (owner_id, habit_id, practiced_at)
);

-- RLS para habit_practices
alter table public.habit_practices enable row level security;
revoke all on public.habit_practices from anon, authenticated;
grant select, insert, update, delete on public.habit_practices to authenticated;

drop policy if exists habit_practices_read_own on public.habit_practices;
create policy habit_practices_read_own on public.habit_practices for select to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists habit_practices_insert_own on public.habit_practices;
create policy habit_practices_insert_own on public.habit_practices for insert to authenticated with check ((select auth.uid()) = owner_id);

drop policy if exists habit_practices_update_own on public.habit_practices;
create policy habit_practices_update_own on public.habit_practices for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

drop policy if exists habit_practices_delete_own on public.habit_practices;
create policy habit_practices_delete_own on public.habit_practices for delete to authenticated using ((select auth.uid()) = owner_id);

commit;
