import { supabase } from '@/shared/lib/supabase';
import type { UnitPreference } from '@/shared/utils/units';

import type { Profile, ProfileStats, ProfileWorkoutPoint } from '../types/profile.types';

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, unit_preference')
    .eq('id', userId)
    .single();
  if (error) throw error;

  // `database.types.ts` widens the CHECK-constrained column to plain `string` -- the DB
  // guarantees only 'kg'/'lb' can ever be stored, so this cast is safe at the fetch boundary.
  return { displayName: data.display_name, unitPreference: data.unit_preference as UnitPreference };
}

export async function updateProfile(userId: string, updates: { unitPreference: UnitPreference }): Promise<void> {
  const { error } = await supabase.from('profiles').update({ unit_preference: updates.unitPreference }).eq('id', userId);
  if (error) throw error;
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const { data, error } = await supabase
    .from('workouts')
    .select('duration_seconds, total_volume')
    .eq('user_id', userId)
    .not('ended_at', 'is', null);
  if (error) throw error;

  return {
    workoutCount: data.length,
    totalDurationSeconds: data.reduce((sum, workout) => sum + (workout.duration_seconds ?? 0), 0),
    totalVolume: data.reduce((sum, workout) => sum + workout.total_volume, 0),
  };
}

// Flat queries joined in JS -- same pattern as computeWorkoutMuscleSplit/getWorkoutDetail. Reps
// are summed per workout from completed sets only, mirroring the completed-only convention
// finish_workout already uses for total_volume.
export async function getProfileWorkoutSeries(userId: string, sinceIso: string): Promise<ProfileWorkoutPoint[]> {
  const { data: workouts, error: workoutsError } = await supabase
    .from('workouts')
    .select('id, started_at, duration_seconds, total_volume')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .gte('started_at', sinceIso);
  if (workoutsError) throw workoutsError;
  if (workouts.length === 0) return [];

  const workoutIds = workouts.map((workout) => workout.id);
  const { data: workoutExercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select('id, workout_id')
    .in('workout_id', workoutIds);
  if (exercisesError) throw exercisesError;

  const workoutExerciseIds = workoutExercises.map((row) => row.id);
  const { data: sets, error: setsError } =
    workoutExerciseIds.length > 0
      ? await supabase
          .from('sets')
          .select('workout_exercise_id, reps')
          .in('workout_exercise_id', workoutExerciseIds)
          .eq('completed', true)
      : { data: [] as { workout_exercise_id: string; reps: number | null }[], error: null };
  if (setsError) throw setsError;

  const workoutIdByWorkoutExerciseId = new Map(workoutExercises.map((row) => [row.id, row.workout_id]));
  const repsByWorkoutId = new Map<string, number>();
  for (const set of sets) {
    if (set.reps === null) continue;
    const workoutId = workoutIdByWorkoutExerciseId.get(set.workout_exercise_id);
    if (!workoutId) continue;
    repsByWorkoutId.set(workoutId, (repsByWorkoutId.get(workoutId) ?? 0) + set.reps);
  }

  return workouts.map((workout) => ({
    startedAt: workout.started_at,
    durationSeconds: workout.duration_seconds ?? 0,
    totalVolume: workout.total_volume,
    totalReps: repsByWorkoutId.get(workout.id) ?? 0,
  }));
}
