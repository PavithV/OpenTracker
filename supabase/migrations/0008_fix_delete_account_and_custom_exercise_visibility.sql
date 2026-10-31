-- Two bugs found by the PGlite migration tests (supabase/tests/migrations.test.ts), 2026-10-31.
--
-- 1. delete_account() failed for every user who had ever put one of their own custom exercises
--    into a routine or a workout -- i.e. exactly the users who used the feature. 0006 deleted the
--    user's custom exercises *first*, while their routine_exercises/workout_exercises rows still
--    referenced them through `on delete restrict` foreign keys:
--      update or delete on table "exercises" violates RESTRICT setting of foreign key constraint
--      "routine_exercises_exercise_id_fkey" on table "routine_exercises"
--    Deleting the other way round (auth.users first) does not work either: the cascade would set
--    exercises.created_by to null, which violates custom_exercise_requires_owner. Fix: delete the
--    user's routines and workouts first (their exercise rows cascade away with them), then the
--    custom exercises, then the auth user (everything else cascades from there as before).
--
-- 2. "exercises are readable by everyone" used `using (true)`, so every signed-in user could read
--    every other user's custom exercises (name, image URL, muscles) -- they even showed up in the
--    exercise picker, which queries the table unfiltered. Custom exercises are now readable only
--    by their creator; the shared library (is_custom = false) stays readable by everyone.

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

  -- Children (routine_exercises/_sets, workout_exercises, sets) cascade from these two.
  delete from public.routines where user_id = v_user_id;
  delete from public.workouts where user_id = v_user_id;

  delete from public.exercises where created_by = v_user_id and is_custom = true;

  delete from auth.users where id = v_user_id;
end;
$$;

-- `create or replace` keeps the grants from 0006, restated here so this file is self-contained.
revoke execute on function public.delete_account() from public;
revoke execute on function public.delete_account() from anon;
grant execute on function public.delete_account() to authenticated;

drop policy "exercises are readable by everyone" on public.exercises;
create policy "library and own custom exercises are readable" on public.exercises
  for select using (is_custom = false or created_by = auth.uid());
