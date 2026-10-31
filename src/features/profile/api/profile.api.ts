import { fetchAllIn, fetchAllPages } from '@/shared/lib/fetch-all';
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
  const data = await fetchAllPages(() =>
    supabase
      .from('workouts')
      .select('id, duration_seconds, total_volume')
      .eq('user_id', userId)
      .not('ended_at', 'is', null)
      .order('id'),
  );

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
  // Up to a year of history: paged and id-chunked, see shared/lib/fetch-all.ts.
  const workouts = await fetchAllPages(() =>
    supabase
      .from('workouts')
      .select('id, started_at, duration_seconds, total_volume')
      .eq('user_id', userId)
      .not('ended_at', 'is', null)
      .gte('started_at', sinceIso)
      .order('id'),
  );
  if (workouts.length === 0) return [];

  const workoutIds = workouts.map((workout) => workout.id);
  const workoutExercises = await fetchAllIn(workoutIds, (chunk) =>
    supabase.from('workout_exercises').select('id, workout_id').in('workout_id', chunk).order('id'),
  );

  const workoutExerciseIds = workoutExercises.map((row) => row.id);
  const sets = await fetchAllIn(workoutExerciseIds, (chunk) =>
    supabase
      .from('sets')
      .select('workout_exercise_id, reps')
      .in('workout_exercise_id', chunk)
      .eq('completed', true)
      .order('id'),
  );

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
