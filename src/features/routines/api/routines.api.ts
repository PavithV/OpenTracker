import { supabase } from '@/shared/lib/supabase';

import type { RoutineDraftExercise, RoutineListItem } from '../types/routine.types';

export async function getRoutines(userId: string): Promise<RoutineListItem[]> {
  const { data, error } = await supabase
    .from('routines')
    .select('id, name, routine_exercises(count)')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return data.map((routine) => ({
    id: routine.id,
    name: routine.name,
    exerciseCount: routine.routine_exercises[0]?.count ?? 0,
  }));
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
  exercises: RoutineDraftExercise[],
): Promise<string> {
  const { data, error } = await supabase.from('routines').insert({ user_id: userId, name }).select('id').single();
  if (error) throw error;

  await insertRoutineExercises(data.id, exercises);
  return data.id;
}

export async function updateRoutine(routineId: string, name: string, exercises: RoutineDraftExercise[]): Promise<void> {
  const { error: updateError } = await supabase
    .from('routines')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', routineId);
  if (updateError) throw updateError;

  const { error: deleteError } = await supabase.from('routine_exercises').delete().eq('routine_id', routineId);
  if (deleteError) throw deleteError;

  await insertRoutineExercises(routineId, exercises);
}

export async function getRoutineForEdit(routineId: string): Promise<{ name: string; exercises: RoutineDraftExercise[] }> {
  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .select('name')
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
