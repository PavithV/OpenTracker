import { supabase } from '@/shared/lib/supabase';

import type { WorkoutDetail } from '../types/workout-detail.types';
import type { WorkoutHistoryItem } from '../types/workout-history.types';

export async function getWorkoutHistory(userId: string): Promise<WorkoutHistoryItem[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, name, started_at, duration_seconds, total_volume, workout_exercises(count)')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false });
  if (error) throw error;

  return data.map((workout) => ({
    id: workout.id,
    name: workout.name,
    startedAt: workout.started_at,
    durationSeconds: workout.duration_seconds,
    totalVolume: workout.total_volume,
    exerciseCount: workout.workout_exercises[0]?.count ?? 0,
  }));
}

// Flat queries joined in JS rather than a nested workouts -> workout_exercises -> sets/exercises
// embed -- same reasoning as getRoutineForEdit in routines.api.ts (the generated Database type
// marks these FKs isOneToOne: false, which makes multi-level embed-shape inference risky to
// trust without a device to verify against).
export async function getWorkoutDetail(workoutId: string): Promise<WorkoutDetail> {
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .select('id, name, started_at, duration_seconds, total_volume')
    .eq('id', workoutId)
    .single();
  if (workoutError) throw workoutError;

  const { data: workoutExercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select('id, exercise_id')
    .eq('workout_id', workoutId)
    .order('order_index');
  if (exercisesError) throw exercisesError;

  const workoutExerciseIds = workoutExercises.map((row) => row.id);
  const { data: sets, error: setsError } =
    workoutExerciseIds.length > 0
      ? await supabase
          .from('sets')
          .select('id, workout_exercise_id, set_number, weight, reps, completed')
          .in('workout_exercise_id', workoutExerciseIds)
          .order('set_number')
      : { data: [] as { id: string; workout_exercise_id: string; set_number: number; weight: number | null; reps: number | null; completed: boolean }[], error: null };
  if (setsError) throw setsError;

  const exerciseIds = workoutExercises.map((row) => row.exercise_id);
  const { data: exerciseNames, error: namesError } =
    exerciseIds.length > 0
      ? await supabase.from('exercises').select('id, name').in('id', exerciseIds)
      : { data: [] as { id: string; name: string }[], error: null };
  if (namesError) throw namesError;

  const nameById = new Map(exerciseNames.map((exercise) => [exercise.id, exercise.name]));

  return {
    id: workout.id,
    name: workout.name,
    startedAt: workout.started_at,
    durationSeconds: workout.duration_seconds,
    totalVolume: workout.total_volume,
    exercises: workoutExercises.map((workoutExercise) => ({
      id: workoutExercise.id,
      exerciseId: workoutExercise.exercise_id,
      name: nameById.get(workoutExercise.exercise_id) ?? '',
      sets: sets
        .filter((set) => set.workout_exercise_id === workoutExercise.id)
        .map((set) => ({
          id: set.id,
          setNumber: set.set_number,
          weight: set.weight,
          reps: set.reps,
          completed: set.completed,
        })),
    })),
  };
}
