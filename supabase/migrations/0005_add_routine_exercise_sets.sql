-- Per-set target model for routine exercises: replaces the single aggregate
-- target_sets/target_reps_min/target_reps_max/target_weight columns with one
-- row per planned set, each with its own target weight + reps.

create table public.routine_exercise_sets (
  id uuid primary key default gen_random_uuid(),
  routine_exercise_id uuid not null references public.routine_exercises (id) on delete cascade,
  set_number int not null,
  target_weight numeric,
  target_reps int
);

create index routine_exercise_sets_parent_order_idx
  on public.routine_exercise_sets (routine_exercise_id, set_number);

alter table public.routine_exercise_sets enable row level security;

create policy "routine_exercise_sets follow parent routine" on public.routine_exercise_sets
  for all using (
    exists (
      select 1 from public.routine_exercises re
      join public.routines r on r.id = re.routine_id
      where re.id = routine_exercise_id and r.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.routine_exercises re
      join public.routines r on r.id = re.routine_id
      where re.id = routine_exercise_id and r.user_id = auth.uid()
    )
  );

-- Backfill: every existing routine_exercise's aggregate target_sets count becomes
-- that many individual set rows, carrying over the old shared weight/reps-min as
-- each row's initial target. Must run before the old columns are dropped below.
insert into public.routine_exercise_sets (routine_exercise_id, set_number, target_weight, target_reps)
select re.id, gs.n, re.target_weight, re.target_reps_min
from public.routine_exercises re
cross join lateral generate_series(1, greatest(re.target_sets, 1)) as gs(n);

alter table public.routine_exercises
  drop column target_sets,
  drop column target_reps_min,
  drop column target_reps_max,
  drop column target_weight;
