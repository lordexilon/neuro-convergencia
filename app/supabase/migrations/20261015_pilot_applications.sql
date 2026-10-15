-- PRODUCT ONLY. Prepared for review; do not apply to SCA Matrix.
begin;

create table public.pilot_applications (
  id uuid primary key,
  created_at timestamptz not null default now(),
  name text not null check (name = btrim(name) and length(name) between 1 and 100 and name !~ '[[:cntrl:]]'),
  email text not null check (email = lower(btrim(email)) and length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  role text not null check (role in ('participante', 'facilitador')),
  contact_consent boolean not null check (contact_consent),
  consent_version text not null default 'pilot-contact-v1' check (consent_version = 'pilot-contact-v1')
);
alter table public.pilot_applications enable row level security;
revoke all on public.pilot_applications from public, anon, authenticated;

-- Public callers may submit, but cannot list, read or edit prospects.
-- The random request UUID permits retries after a lost response without duplicating a lead.
create function public.submit_pilot_application(p_id uuid, p_name text, p_email text, p_role text, p_contact_consent boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  if p_id is null or p_name is null or p_email is null or p_role is null or p_contact_consent is distinct from true then
    raise exception 'Invalid application';
  end if;
  insert into public.pilot_applications(id, name, email, role, contact_consent)
  values(p_id, p_name, p_email, p_role, p_contact_consent)
  on conflict (id) do nothing;
  if not exists (select 1 from public.pilot_applications where id = p_id and name = p_name and email = p_email and role = p_role and contact_consent) then
    raise exception 'Application conflict';
  end if;
  return p_id;
end;
$$;
revoke all on function public.submit_pilot_application(uuid, text, text, text, boolean) from public;
grant execute on function public.submit_pilot_application(uuid, text, text, text, boolean) to anon, authenticated;

commit;
