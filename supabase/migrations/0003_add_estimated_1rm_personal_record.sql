-- Adds `estimated_1rm` personal-record tracking to finish_workout (Phase 3, item 2 -- One Rep
-- Max, see TODO.md). Uses the Epley formula (weight * (1 + reps/30)). Requires both weight and
-- reps (unlike max_weight, which only needs weight), since the formula needs both -- sets with a
-- null reps value are excluded from this second upsert but still count for max_weight.
--
-- The set that wins max_weight need not be the same set that wins estimated_1rm: a heavier
-- low-rep set can lose to a lighter higher-rep set under Epley (e.g. 100kg x 1 = 103.3 estimated
-- vs. 80kg x 8 = 101.3 -- close, but a higher-rep set can still win depending on the numbers).
-- Both are computed independently with their own DISTINCT ON per exercise, same pattern as
-- 0002_fix_finish_workout_personal_records.sql.
create or replace function public.finish_workout(p_workout_id uuid)
returns public.workouts
language plpgsql
security definer set search_path = public
as $$
declare
  v_workout public.workouts;
  v_user_id uuid;
begin
  select user_id into v_user_id from public.workouts where id = p_workout_id;
  if v_user_id is null or v_user_id <> auth.uid() then
    raise exception 'not authorized';
  end if;

  update public.workouts w
  set
    ended_at = now(),
    duration_seconds = extract(epoch from (now() - w.started_at))::int,
    total_volume = coalesce((
      select sum(s.weight * s.reps)
      from public.sets s
      join public.workout_exercises we on we.id = s.workout_exercise_id
      where we.workout_id = w.id and s.completed = true and s.weight is not null and s.reps is not null
    ), 0)
  where w.id = p_workout_id
  returning * into v_workout;

  insert into public.personal_records (user_id, exercise_id, record_type, value, set_id, achieved_at)
  select distinct on (we.exercise_id)
    v_user_id,
    we.exercise_id,
    'max_weight',
    s.weight,
    s.id,
    s.completed_at
  from public.sets s
  join public.workout_exercises we on we.id = s.workout_exercise_id
  where we.workout_id = p_workout_id and s.completed = true and s.weight is not null
  order by we.exercise_id, s.weight desc
  on conflict (user_id, exercise_id, record_type) do update
    set value = excluded.value, set_id = excluded.set_id, achieved_at = excluded.achieved_at
    where excluded.value > public.personal_records.value;

  insert into public.personal_records (user_id, exercise_id, record_type, value, set_id, achieved_at)
  select distinct on (we.exercise_id)
    v_user_id,
    we.exercise_id,
    'estimated_1rm',
    round(s.weight * (1 + s.reps / 30.0), 2),
    s.id,
    s.completed_at
  from public.sets s
  join public.workout_exercises we on we.id = s.workout_exercise_id
  where we.workout_id = p_workout_id and s.completed = true and s.weight is not null and s.reps is not null
  order by we.exercise_id, (s.weight * (1 + s.reps / 30.0)) desc
  on conflict (user_id, exercise_id, record_type) do update
    set value = excluded.value, set_id = excluded.set_id, achieved_at = excluded.achieved_at
    where excluded.value > public.personal_records.value;

  return v_workout;
end;
$$;
