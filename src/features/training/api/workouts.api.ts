import { supabase } from '@/shared/lib/supabase';

import type { ActiveWorkoutExercise } from '../types/active-workout.types';

interface WorkoutDraft {
  name: string;
  notes: string;
  startedAt: string;
  routineId: string | null;
  exercises: ActiveWorkoutExercise[];
}

/**
 * Syncs the local workout draft to Supabase and calls finish_workout to compute
 * total_volume/duration_seconds and refresh personal_records server-side. Not wrapped in a DB
 * transaction (supabase-js's REST-based inserts can't span one) -- a network failure partway
 * through can leave a partial workout row, same accepted tradeoff as routines.api.ts's
 * delete-and-reinsert. Errors propagate to the caller to show as an alert.
 */
export async function finishActiveWorkout(userId: string, draft: WorkoutDraft): Promise<string> {
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      name: draft.name,
      notes: draft.notes || null,
      started_at: draft.startedAt,
      routine_id: draft.routineId,
    })
    .select('id')
    .single();
  if (workoutError) throw workoutError;

  for (const [index, exercise] of draft.exercises.entries()) {
    const { data: workoutExercise, error: exerciseError } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id: workout.id,
        exercise_id: exercise.exerciseId,
        order_index: index,
        notes: exercise.notes || null,
      })
      .select('id')
      .single();
    if (exerciseError) throw exerciseError;

    if (exercise.sets.length > 0) {
      const setRows = exercise.sets.map((workoutSet, setIndex) => ({
        workout_exercise_id: workoutExercise.id,
        set_number: setIndex + 1,
        weight: workoutSet.weight,
        reps: workoutSet.reps,
        completed: workoutSet.completed,
        completed_at: workoutSet.completed ? new Date().toISOString() : null,
      }));
      const { error: setsError } = await supabase.from('sets').insert(setRows);
      if (setsError) throw setsError;
    }
  }

  const { error: finishError } = await supabase.rpc('finish_workout', { p_workout_id: workout.id });
  if (finishError) throw finishError;

  return workout.id;
}
