-- finish_workout's personal_records upsert inserted one row per completed set for an exercise.
-- Any workout with >1 completed set of the same exercise (the normal case) produced two rows
-- targeting the same (user_id, exercise_id, record_type) unique constraint within one INSERT,
-- which Postgres rejects: "ON CONFLICT DO UPDATE command cannot affect row a second time".
-- Fix: DISTINCT ON (exercise_id) ordered by weight desc picks exactly one (the best) candidate
-- row per exercise before the upsert, matching the intent (record the workout's best set).
--
-- Found and verified 2026-07-23 by simulating finishActiveWorkout()'s insert sequence + this RPC
-- against the live project with a multi-set-per-exercise test workout, then cleaned up.
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

  return v_workout;
end;
$$;
