import { supabase } from '@/shared/lib/supabase';

import type { MuscleSplitEntry, Profile, ProfileStats } from '../types/profile.types';

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, unit_preference')
    .eq('id', userId)
    .single();
  if (error) throw error;

  return { displayName: data.display_name, unitPreference: data.unit_preference };
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

// Flat queries joined in JS -- same pattern as getWorkoutDetail/getExerciseHistory. Volume per
// set mirrors finish_workout's own total_volume definition (weight * reps, completed sets only).
export async function getMuscleSplit(userId: string): Promise<MuscleSplitEntry[]> {
  const { data: workouts, error: workoutsError } = await supabase
    .from('workouts')
    .select('id')
    .eq('user_id', userId)
    .not('ended_at', 'is', null);
  if (workoutsError) throw workoutsError;
  if (workouts.length === 0) return [];

  const workoutIds = workouts.map((workout) => workout.id);
  const { data: workoutExercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select('id, exercise_id')
    .in('workout_id', workoutIds);
  if (exercisesError) throw exercisesError;
  if (workoutExercises.length === 0) return [];

  const workoutExerciseIds = workoutExercises.map((row) => row.id);
  const { data: sets, error: setsError } = await supabase
    .from('sets')
    .select('workout_exercise_id, weight, reps')
    .in('workout_exercise_id', workoutExerciseIds)
    .eq('completed', true)
    .not('weight', 'is', null)
    .not('reps', 'is', null);
  if (setsError) throw setsError;
  if (sets.length === 0) return [];

  const exerciseIds = Array.from(new Set(workoutExercises.map((row) => row.exercise_id)));
  const { data: exercises, error: musclesError } = await supabase
    .from('exercises')
    .select('id, target_muscle')
    .in('id', exerciseIds);
  if (musclesError) throw musclesError;

  const muscleByExerciseId = new Map(exercises.map((exercise) => [exercise.id, exercise.target_muscle]));
  const exerciseIdByWorkoutExerciseId = new Map(workoutExercises.map((row) => [row.id, row.exercise_id]));

  const volumeByMuscle = new Map<string, number>();
  for (const set of sets) {
    const exerciseId = exerciseIdByWorkoutExerciseId.get(set.workout_exercise_id);
    const muscle = exerciseId ? muscleByExerciseId.get(exerciseId) : undefined;
    if (!muscle || set.weight === null || set.reps === null) continue;
    volumeByMuscle.set(muscle, (volumeByMuscle.get(muscle) ?? 0) + set.weight * set.reps);
  }

  return Array.from(volumeByMuscle.entries())
    .map(([muscle, volume]) => ({ muscle, volume }))
    .sort((a, b) => b.volume - a.volume);
}
