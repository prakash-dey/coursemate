create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.api_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (user_id, action, window_start)
);

create or replace function public.consume_api_rate_limit(requested_action text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  window_seconds integer;
  maximum_requests integer;
  bucket timestamptz;
  current_count integer;
begin
  if actor is null then return false; end if;

  select limits.seconds, limits.maximum into window_seconds, maximum_requests
  from (values
    ('chat', 60, 30),
    ('quiz', 300, 5),
    ('course_create', 3600, 20),
    ('document_upload', 3600, 10)
  ) as limits(action, seconds, maximum)
  where limits.action = requested_action;

  if window_seconds is null then return false; end if;
  bucket := to_timestamp(floor(extract(epoch from statement_timestamp()) / window_seconds) * window_seconds);

  insert into private.api_rate_limits (user_id, action, window_start, request_count)
  values (actor, requested_action, bucket, 1)
  on conflict (user_id, action, window_start)
  do update set request_count = private.api_rate_limits.request_count + 1
  returning request_count into current_count;

  delete from private.api_rate_limits
  where user_id = actor and window_start < statement_timestamp() - interval '2 days';

  return current_count <= maximum_requests;
end;
$$;

revoke all on function public.consume_api_rate_limit(text) from public, anon;
grant execute on function public.consume_api_rate_limit(text) to authenticated;
