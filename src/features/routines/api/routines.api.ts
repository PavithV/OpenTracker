import { supabase } from '@/shared/lib/supabase';

import type { RoutineDraftExercise, RoutineListItem } from '../types/routine.types';

const ROUTINE_PREVIEW_EXERCISE_COUNT = 3;

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

async function insertRoutineExercises(routineId: string, exercises: RoutineDraftExercise[]): Promise<void> {
  if (exercises.length === 0) return;

  const rows = exercises.map((exercise, index) => ({
    routine_id: routineId,
    exercise_id: exercise.exerciseId,
    order_index: index,
    target_sets: exercise.targetSets,
    target_reps_min: exercise.targetRepsMin,
    target_reps_max: exercise.targetRepsMax,
    target_weight: exercise.targetWeight,
    rest_seconds: exercise.restSeconds,
  }));

  const { error } = await supabase.from('routine_exercises').insert(rows);
  if (error) throw error;
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
    .select('exercise_id, target_sets, target_reps_min, target_reps_max, target_weight, rest_seconds')
    .eq('routine_id', routineId)
    .order('order_index');
  if (exercisesError) throw exercisesError;

  const exerciseIds = routineExercises.map((row) => row.exercise_id);
  const { data: exerciseNames, error: namesError } =
    exerciseIds.length > 0
      ? await supabase.from('exercises').select('id, name').in('id', exerciseIds)
      : { data: [] as { id: string; name: string }[], error: null };
  if (namesError) throw namesError;

  const nameById = new Map(exerciseNames.map((exercise) => [exercise.id, exercise.name]));

  return {
    name: routine.name,
    notes: routine.notes ?? '',
    exercises: routineExercises.map((row) => ({
      exerciseId: row.exercise_id,
      name: nameById.get(row.exercise_id) ?? '',
      targetSets: row.target_sets,
      targetRepsMin: row.target_reps_min,
      targetRepsMax: row.target_reps_max,
      targetWeight: row.target_weight,
      restSeconds: row.rest_seconds,
    })),
  };
}
