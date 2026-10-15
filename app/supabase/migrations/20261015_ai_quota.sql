-- PRODUCT ONLY, prepared for review. Never apply to SCA Matrix.
begin;
create table public.ai_quota_buckets (
  scope text not null check (scope in ('user_window', 'user_daily', 'global_daily')),
  subject text not null,
  bucket_start timestamptz not null,
  used integer not null check (used >= 0),
  primary key (scope, subject, bucket_start)
);
alter table public.ai_quota_buckets enable row level security;
revoke all on public.ai_quota_buckets from public, anon, authenticated;

-- Only the application server may reserve quota. Clients cannot choose their user or limits.
create function public.reserve_ai_quota(
  p_user_id uuid, p_window_seconds integer, p_window_limit integer,
  p_user_daily_limit integer, p_global_daily_limit integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz := now();
  v_day timestamptz := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  v_window timestamptz;
  v_item record;
  v_used integer;
begin
  if p_user_id is null or p_window_seconds is null or p_window_seconds not between 1 and 86400
     or p_window_limit is null or p_window_limit not between 1 and 100
     or p_user_daily_limit is null or p_user_daily_limit not between 1 and 1000
     or p_global_daily_limit is null or p_global_daily_limit not between 1 and 10000 then
    raise exception 'Invalid quota configuration';
  end if;
  v_window := to_timestamp(floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds);
  -- Serialize check-and-increment across users and server replicas.
  perform pg_advisory_xact_lock(7101533, 1);
  delete from public.ai_quota_buckets where bucket_start < v_day - interval '2 days';
  for v_item in select * from (values
    ('user_window', p_user_id::text, v_window, p_window_limit, v_window + make_interval(secs => p_window_seconds)),
    ('user_daily', p_user_id::text, v_day, p_user_daily_limit, v_day + interval '1 day'),
    ('global_daily', 'all', v_day, p_global_daily_limit, v_day + interval '1 day')
  ) as limits(scope, subject, bucket_start, ceiling, expires_at)
  loop
    select used into v_used from public.ai_quota_buckets
      where scope = v_item.scope and subject = v_item.subject and bucket_start = v_item.bucket_start;
    if coalesce(v_used, 0) >= v_item.ceiling then
      return jsonb_build_object('allowed', false, 'retry_after_seconds', greatest(1, ceil(extract(epoch from (v_item.expires_at - v_now)))::integer));
    end if;
  end loop;
  insert into public.ai_quota_buckets(scope, subject, bucket_start, used) values
    ('user_window', p_user_id::text, v_window, 1),
    ('user_daily', p_user_id::text, v_day, 1),
    ('global_daily', 'all', v_day, 1)
  on conflict (scope, subject, bucket_start) do update set used = public.ai_quota_buckets.used + 1;
  return jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
end;
$$;
revoke all on function public.reserve_ai_quota(uuid, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.reserve_ai_quota(uuid, integer, integer, integer, integer) to service_role;
commit;
