-- Self-service account deletion (Google Play requires an in-app deletion path for any app
-- with account creation, see LAUNCH_PLAN.md). Everything user-owned already cascades from
-- auth.users -> profiles -> routines/workouts/personal_records/favorite_exercises and their
-- children (confirmed against 0001_init.sql). The one exception is exercises.created_by, which
-- is `on delete set null` rather than cascade (0001_init.sql), so custom exercises would
-- otherwise survive orphaned -- deleted explicitly below instead.
--
-- Deleting directly from auth.users (rather than calling the JS `auth.admin.deleteUser()`
-- API) is intentional here: that API requires a service_role key, which must never reach the
-- client, so it would need a new Edge Function just to hold that key. This project has no
-- Edge Functions yet, and a security definer RPC (same pattern as finish_workout) lets the
-- client call this directly via supabase.rpc(), consistent with every other write path in
-- this codebase. Supabase's own auth.identities/auth.sessions/auth.refresh_tokens etc. already
-- reference auth.users with cascading deletes internally.
create or replace function public.delete_account()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authorized';
  end if;

  delete from public.exercises where created_by = v_user_id and is_custom = true;

  delete from auth.users where id = v_user_id;
end;
$$;

-- Supabase grants EXECUTE on every new public-schema function to anon/authenticated by
-- default (via ALTER DEFAULT PRIVILEGES), independent of the plain `revoke ... from public`
-- below -- both anon and authenticated must be addressed explicitly, or anon keeps access.
revoke execute on function public.delete_account() from public;
revoke execute on function public.delete_account() from anon;
grant execute on function public.delete_account() to authenticated;
