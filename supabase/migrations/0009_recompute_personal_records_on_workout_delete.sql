-- Deleting a workout left every personal record it had set in place: personal_records.set_id is
-- `on delete set null`, so the row survived the cascade with its value intact, pointing at nothing.
-- Records only ever rise in finish_workout, so a record from a deleted workout could never be
-- replaced -- in particular a mistyped one (e.g. 625 kg from the old "62.5" input bug, fixed
-- 2026-10-31) stayed on the records screen forever, even after the user deleted that workout.
--
-- Fix: when a record loses its set, recompute it from the user's remaining finished workouts with
-- the same rules as finish_workout (max_weight: heaviest completed set with a weight;
-- estimated_1rm: best Epley value of completed sets with weight and reps). A record with nothing
-- left to base it on is removed. Covered by supabase/tests/migrations.test.ts ("deleting a
-- workout").
--
-- Where the trigger hangs matters: an AFTER DELETE trigger on workouts fires *before* the FK
-- cascades (workout_exercises -> sets -> personal_records.set_id = null) have run, so it sees no
-- orphaned records yet (verified in PGlite). The cascade's own `set set_id = null` on
-- personal_records is the reliable signal -- by then the deleted sets are gone, so only the
-- remaining workouts are considered. If a candidate set is itself deleted a moment later in the
-- same cascade, its record is nulled again and recomputed again.

-- Recomputes one record in place (or deletes it). Shared by the trigger and the backfill below.
create or replace function public.refresh_personal_record(p_record_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_record public.personal_records;
  v_best record;
begin
  select * into v_record from public.personal_records where id = p_record_id;
  if not found then
    return;
  end if;

  select
    s.id as set_id,
    s.completed_at,
    case v_record.record_type
      when 'max_weight' then s.weight
      when 'estimated_1rm' then round(s.weight * (1 + s.reps / 30.0), 2)
    end as value
  into v_best
  from public.workouts w
  join public.workout_exercises we on we.workout_id = w.id
  join public.sets s on s.workout_exercise_id = we.id
  where w.user_id = v_record.user_id
    and w.ended_at is not null
    and we.exercise_id = v_record.exercise_id
    and s.completed = true
    and s.weight is not null
    and (v_record.record_type = 'max_weight' or s.reps is not null)
  order by 3 desc, s.completed_at asc
  limit 1;

  if v_best.set_id is null then
    delete from public.personal_records where id = p_record_id;
  else
    update public.personal_records
    set value = v_best.value, set_id = v_best.set_id, achieved_at = coalesce(v_best.completed_at, v_record.achieved_at)
    where id = p_record_id;
  end if;
end;
$$;

create or replace function public.recompute_orphaned_personal_record()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.refresh_personal_record(new.id);
  return null;
end;
$$;

-- Internal only: invoked by the trigger below and the one-off backfill.
revoke execute on function public.refresh_personal_record(uuid) from public, anon, authenticated;
revoke execute on function public.recompute_orphaned_personal_record() from public, anon, authenticated;

create trigger recompute_orphaned_personal_record
  after update of set_id on public.personal_records
  for each row
  when (old.set_id is not null and new.set_id is null)
  execute function public.recompute_orphaned_personal_record();

-- Backfill: records orphaned by workouts deleted before this migration.
select public.refresh_personal_record(id) from public.personal_records where set_id is null;
