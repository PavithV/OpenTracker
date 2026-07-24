import { supabase } from '@/shared/lib/supabase';

import type {
  CreateCustomExerciseInput,
  ExerciseDetail,
  ExerciseFilters,
  ExerciseHistoryEntry,
  ExerciseListItem,
  ExercisePersonalRecords,
} from '../types/exercise.types';

const PAGE_SIZE = 50;

export async function getExercises(filters: ExerciseFilters): Promise<ExerciseListItem[]> {
  let query = supabase
    .from('exercises')
    .select('id, name, category, equipment, target_muscle, image_url')
    .order('name')
    .limit(PAGE_SIZE);

  if (filters.search) query = query.ilike('name', `%${filters.search}%`);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.equipment) query = query.eq('equipment', filters.equipment);

  const { data, error } = await query;
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    equipment: row.equipment,
    targetMuscle: row.target_muscle,
    imageUrl: row.image_url,
  }));
}

// Requires is_custom: true and created_by: userId together -- both the DB check constraint
// (custom_exercise_requires_owner) and the "custom exercises are owner-writable" RLS policy
// enforce this pairing, so a non-custom or other-user insert is rejected server-side either way.
export async function createCustomExercise(
  userId: string,
  input: CreateCustomExerciseInput,
): Promise<ExerciseListItem> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      name: input.name,
      category: input.category,
      equipment: input.equipment,
      target_muscle: input.targetMuscle,
      image_url: input.imageUrl,
      is_custom: true,
      created_by: userId,
    })
    .select('id, name, category, equipment, target_muscle, image_url')
    .single();
  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    category: data.category,
    equipment: data.equipment,
    targetMuscle: data.target_muscle,
    imageUrl: data.image_url,
  };
}

export async function getExerciseDetail(exerciseId: string): Promise<ExerciseDetail> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, target_muscle, secondary_muscles, image_url, gif_url, attribution, instructions')
    .eq('id', exerciseId)
    .single();
  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    targetMuscle: data.target_muscle,
    secondaryMuscles: data.secondary_muscles,
    imageUrl: data.image_url,
    gifUrl: data.gif_url,
    attribution: data.attribution,
    instructions: (data.instructions ?? {}) as Record<string, string>,
  };
}

export async function getExercisePersonalRecords(
  userId: string,
  exerciseId: string,
): Promise<ExercisePersonalRecords> {
  const { data, error } = await supabase
    .from('personal_records')
    .select('record_type, value, achieved_at')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .in('record_type', ['max_weight', 'estimated_1rm']);
  if (error) throw error;

  const byType = new Map(data.map((row) => [row.record_type, { value: row.value, achievedAt: row.achieved_at }]));
  return {
    maxWeight: byType.get('max_weight') ?? null,
    estimated1Rm: byType.get('estimated_1rm') ?? null,
  };
}

// Flat queries joined in JS rather than a nested embed -- same reasoning as getWorkoutDetail in
// home/api/workouts.api.ts. active-workout.store.ts's addExercises dedupes by exerciseId before
// sync, so a given workout has at most one workout_exercises row per exercise -- safe to match
// with find() below instead of handling multiple rows per workout.
export async function getExerciseHistory(userId: string, exerciseId: string): Promise<ExerciseHistoryEntry[]> {
  const { data: workouts, error: workoutsError } = await supabase
    .from('workouts')
    .select('id, name, started_at')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false });
  if (workoutsError) throw workoutsError;
  if (workouts.length === 0) return [];

  const workoutIds = workouts.map((workout) => workout.id);
  const { data: workoutExercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select('id, workout_id')
    .eq('exercise_id', exerciseId)
    .in('workout_id', workoutIds);
  if (exercisesError) throw exercisesError;
  if (workoutExercises.length === 0) return [];

  const workoutExerciseIds = workoutExercises.map((row) => row.id);
  const { data: sets, error: setsError } = await supabase
    .from('sets')
    .select('id, workout_exercise_id, set_number, weight, reps')
    .in('workout_exercise_id', workoutExerciseIds)
    .order('set_number');
  if (setsError) throw setsError;

  return workouts
    .map((workout) => {
      const workoutExercise = workoutExercises.find((row) => row.workout_id === workout.id);
      if (!workoutExercise) return null;
      return {
        workoutId: workout.id,
        workoutName: workout.name,
        startedAt: workout.started_at,
        sets: sets
          .filter((set) => set.workout_exercise_id === workoutExercise.id)
          .map((set) => ({ id: set.id, setNumber: set.set_number, weight: set.weight, reps: set.reps })),
      };
    })
    .filter((entry): entry is ExerciseHistoryEntry => entry !== null);
}
