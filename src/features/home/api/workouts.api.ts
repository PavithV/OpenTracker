import { supabase } from '@/shared/lib/supabase';

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
