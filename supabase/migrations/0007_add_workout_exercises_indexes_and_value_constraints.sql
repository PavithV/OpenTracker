-- workout_exercises had no index beyond its primary key, forcing a sequential scan on every
-- workout-detail/history/profile-series/exercise-history query that filters by workout_id or
-- exercise_id (PRODUCT_AUDIT.md 6.1). Separately, no CHECK constraint stopped a buggy or
-- manipulated client from writing negative weight/reps into sets or target_weight/target_reps
-- into routine_exercise_sets -- values finish_workout's total_volume/personal_records
-- calculations trust at face value (6.2; not a security issue, RLS still scopes everything to
-- its owner -- a data-integrity gap). Pre-checked: zero existing rows violate either constraint.

create index workout_exercises_workout_id_idx on public.workout_exercises (workout_id);
create index workout_exercises_exercise_id_idx on public.workout_exercises (exercise_id);

alter table public.sets
  add constraint sets_weight_nonnegative check (weight is null or weight >= 0),
  add constraint sets_reps_nonnegative check (reps is null or reps >= 0);

alter table public.routine_exercise_sets
  add constraint routine_exercise_sets_target_weight_nonnegative check (target_weight is null or target_weight >= 0),
  add constraint routine_exercise_sets_target_reps_nonnegative check (target_reps is null or target_reps >= 0);
