import { supabase } from '@/shared/lib/supabase';

import type { WorkoutDetail } from '../types/workout-detail.types';
import type { WorkoutHistoryItem } from '../types/workout-history.types';

// Flat queries joined in JS -- same pattern as getWorkoutDetail below. Needed so each Home card
// can show its exercise thumbnails/names/set counts (previously just an aggregate count via a
// workout_exercises(count) embed), matching the Hevy reference screenshots.
export async function getWorkoutHistory(userId: string): Promise<WorkoutHistoryItem[]> {
  const { data: workouts, error: workoutsError } = await supabase
    .from('workouts')
    .select('id, name, started_at, duration_seconds, total_volume')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false });
  if (workoutsError) throw workoutsError;
  if (workouts.length === 0) return [];

  const workoutIds = workouts.map((workout) => workout.id);
  const { data: workoutExercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select('id, workout_id, exercise_id')
    .in('workout_id', workoutIds)
    .order('order_index');
  if (exercisesError) throw exercisesError;

  const workoutExerciseIds = workoutExercises.map((row) => row.id);
  const { data: sets, error: setsError } =
    workoutExerciseIds.length > 0
      ? await supabase.from('sets').select('workout_exercise_id').in('workout_exercise_id', workoutExerciseIds)
      : { data: [] as { workout_exercise_id: string }[], error: null };
  if (setsError) throw setsError;

  const exerciseIds = Array.from(new Set(workoutExercises.map((row) => row.exercise_id)));
  const { data: exercises, error: namesError } =
    exerciseIds.length > 0
      ? await supabase.from('exercises').select('id, name, image_url').in('id', exerciseIds)
      : { data: [] as { id: string; name: string; image_url: string | null }[], error: null };
  if (namesError) throw namesError;

  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const setCountByWorkoutExerciseId = new Map<string, number>();
  for (const set of sets) {
    setCountByWorkoutExerciseId.set(
      set.workout_exercise_id,
      (setCountByWorkoutExerciseId.get(set.workout_exercise_id) ?? 0) + 1,
    );
  }

  return workouts.map((workout) => ({
    id: workout.id,
    name: workout.name,
    startedAt: workout.started_at,
    durationSeconds: workout.duration_seconds,
    totalVolume: workout.total_volume,
    exercises: workoutExercises
      .filter((row) => row.workout_id === workout.id)
      .map((row) => {
        const exercise = exerciseById.get(row.exercise_id);
        return {
          exerciseId: row.exercise_id,
          name: exercise?.name ?? '',
          imageUrl: exercise?.image_url ?? null,
          setCount: setCountByWorkoutExerciseId.get(row.id) ?? 0,
        };
      }),
  }));
}

// Flat queries joined in JS rather than a nested workouts -> workout_exercises -> sets/exercises
// embed -- same reasoning as getRoutineForEdit in routines.api.ts (the generated Database type
// marks these FKs isOneToOne: false, which makes multi-level embed-shape inference risky to
// trust without a device to verify against).
export async function getWorkoutDetail(workoutId: string): Promise<WorkoutDetail> {
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .select('id, name, notes, started_at, duration_seconds, total_volume')
    .eq('id', workoutId)
    .single();
  if (workoutError) throw workoutError;

  const { data: workoutExercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select('id, exercise_id, notes')
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
  const { data: exerciseDetails, error: namesError } =
    exerciseIds.length > 0
      ? await supabase.from('exercises').select('id, name, image_url').in('id', exerciseIds)
      : { data: [] as { id: string; name: string; image_url: string | null }[], error: null };
  if (namesError) throw namesError;

  const exerciseById = new Map(exerciseDetails.map((exercise) => [exercise.id, exercise]));

  return {
    id: workout.id,
    name: workout.name,
    notes: workout.notes,
    startedAt: workout.started_at,
    durationSeconds: workout.duration_seconds,
    totalVolume: workout.total_volume,
    exercises: workoutExercises.map((workoutExercise) => ({
      id: workoutExercise.id,
      exerciseId: workoutExercise.exercise_id,
      name: exerciseById.get(workoutExercise.exercise_id)?.name ?? '',
      imageUrl: exerciseById.get(workoutExercise.exercise_id)?.image_url ?? null,
      notes: workoutExercise.notes,
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
