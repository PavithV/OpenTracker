import { supabase } from '@/shared/lib/supabase';

import type { RoutineDraftExercise, RoutineListItem } from '../types/routine.types';

const ROUTINE_PREVIEW_EXERCISE_COUNT = 3;

export async function archiveRoutine(routineId: string): Promise<void> {
  const { error } = await supabase
    .from('routines')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', routineId);
  if (error) throw error;
}

export async function unarchiveRoutine(routineId: string): Promise<void> {
  const { error } = await supabase.from('routines').update({ archived_at: null }).eq('id', routineId);
  if (error) throw error;
}

// Flat queries joined in JS rather than a nested routines -> routine_exercises -> exercises embed --
// same reasoning as getRoutineForEdit below (the generated Database type marks the
// routine_exercises -> exercises FK isOneToOne: false, which makes multi-level embed-shape
// inference risky to trust without a device to verify against).
export async function getRoutines(userId: string): Promise<RoutineListItem[]> {
  const { data: routines, error: routinesError } = await supabase
    .from('routines')
    .select('id, name')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });
  if (routinesError) throw routinesError;
  if (routines.length === 0) return [];

  const routineIds = routines.map((routine) => routine.id);
  const { data: routineExercises, error: exercisesError } = await supabase
    .from('routine_exercises')
    .select('routine_id, exercise_id, order_index')
    .in('routine_id', routineIds)
    .order('order_index');
  if (exercisesError) throw exercisesError;

  const exerciseIds = Array.from(new Set(routineExercises.map((row) => row.exercise_id)));
  const { data: exercises, error: namesError } =
    exerciseIds.length > 0
      ? await supabase.from('exercises').select('id, name').in('id', exerciseIds)
      : { data: [] as { id: string; name: string }[], error: null };
  if (namesError) throw namesError;

  const nameById = new Map(exercises.map((exercise) => [exercise.id, exercise.name]));

  return routines.map((routine) => {
    const namesForRoutine = routineExercises
      .filter((row) => row.routine_id === routine.id)
      .map((row) => nameById.get(row.exercise_id))
      .filter((name): name is string => !!name);

    return {
      id: routine.id,
      name: routine.name,
      exerciseCount: namesForRoutine.length,
      exercisePreview: namesForRoutine.slice(0, ROUTINE_PREVIEW_EXERCISE_COUNT).join(', '),
    };
  });
}

// Two-level insert (routine_exercises, then routine_exercise_sets) rather than a nested
// PostgREST embed insert -- keeps the "flat queries joined in JS" convention used everywhere
// else in this codebase instead of relying on multi-level embed-shape inference.
async function insertRoutineExercises(routineId: string, exercises: RoutineDraftExercise[]): Promise<void> {
  if (exercises.length === 0) return;

  const rows = exercises.map((exercise, index) => ({
    routine_id: routineId,
    exercise_id: exercise.exerciseId,
    order_index: index,
    rest_seconds: exercise.restSeconds,
  }));

  // `order_index` must be part of the select projection -- PostgREST orders the *returned*
  // representation of an insert, and can't sort by a column that isn't in it (was previously
  // select('id').order('order_index'), which Postgres rejected with "column ...order_index does
  // not exist" on every save). Matching back to `exercises` via the returned order_index (rather
  // than assuming positional correspondence) also makes this robust regardless of return order.
  const { data: insertedRoutineExercises, error } = await supabase
    .from('routine_exercises')
    .insert(rows)
    .select('id, order_index')
    .order('order_index');
  if (error) throw error;

  const routineExerciseIdByIndex = new Map(
    insertedRoutineExercises.map((row) => [row.order_index, row.id]),
  );

  const setRows = exercises.flatMap((exercise, index) => {
    const routineExerciseId = routineExerciseIdByIndex.get(index);
    if (!routineExerciseId) throw new Error(`Missing inserted routine_exercises row for index ${index}`);
    return exercise.sets.map((set, setIndex) => ({
      routine_exercise_id: routineExerciseId,
      set_number: setIndex + 1,
      target_weight: set.targetWeight,
      target_reps: set.targetReps,
    }));
  });
  if (setRows.length === 0) return;

  const { error: setsError } = await supabase.from('routine_exercise_sets').insert(setRows);
  if (setsError) throw setsError;
}

export async function createRoutine(
  userId: string,
  name: string,
  notes: string,
  exercises: RoutineDraftExercise[],
): Promise<string> {
  const { data, error } = await supabase
    .from('routines')
    .insert({ user_id: userId, name, notes: notes || null })
    .select('id')
    .single();
  if (error) throw error;

  await insertRoutineExercises(data.id, exercises);
  return data.id;
}

export async function updateRoutine(
  routineId: string,
  name: string,
  notes: string,
  exercises: RoutineDraftExercise[],
): Promise<void> {
  const { error: updateError } = await supabase
    .from('routines')
    .update({ name, notes: notes || null, updated_at: new Date().toISOString() })
    .eq('id', routineId);
  if (updateError) throw updateError;

  const { error: deleteError } = await supabase.from('routine_exercises').delete().eq('routine_id', routineId);
  if (deleteError) throw deleteError;

  await insertRoutineExercises(routineId, exercises);
}

export async function getRoutineForEdit(
  routineId: string,
): Promise<{ name: string; notes: string; exercises: RoutineDraftExercise[] }> {
  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .select('name, notes')
    .eq('id', routineId)
    .single();
  if (routineError) throw routineError;

  const { data: routineExercises, error: exercisesError } = await supabase
    .from('routine_exercises')
    .select('id, exercise_id, rest_seconds')
    .eq('routine_id', routineId)
    .order('order_index');
  if (exercisesError) throw exercisesError;

  const routineExerciseIds = routineExercises.map((row) => row.id);
  const { data: routineExerciseSets, error: setsError } =
    routineExerciseIds.length > 0
      ? await supabase
          .from('routine_exercise_sets')
          .select('id, routine_exercise_id, target_weight, target_reps')
          .in('routine_exercise_id', routineExerciseIds)
          .order('set_number')
      : { data: [] as { id: string; routine_exercise_id: string; target_weight: number | null; target_reps: number | null }[], error: null };
  if (setsError) throw setsError;

  const exerciseIds = routineExercises.map((row) => row.exercise_id);
  const { data: exerciseDetails, error: namesError } =
    exerciseIds.length > 0
      ? await supabase.from('exercises').select('id, name, image_url').in('id', exerciseIds)
      : { data: [] as { id: string; name: string; image_url: string | null }[], error: null };
  if (namesError) throw namesError;

  const exerciseById = new Map(exerciseDetails.map((exercise) => [exercise.id, exercise]));

  return {
    name: routine.name,
    notes: routine.notes ?? '',
    exercises: routineExercises.map((row) => ({
      exerciseId: row.exercise_id,
      name: exerciseById.get(row.exercise_id)?.name ?? '',
      imageUrl: exerciseById.get(row.exercise_id)?.image_url ?? null,
      restSeconds: row.rest_seconds,
      sets: routineExerciseSets
        .filter((set) => set.routine_exercise_id === row.id)
        .map((set) => ({ id: set.id, targetWeight: set.target_weight, targetReps: set.target_reps })),
    })),
  };
}
