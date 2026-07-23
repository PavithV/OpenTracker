import { supabase } from '@/shared/lib/supabase';

import type { Profile, ProfileStats } from '../types/profile.types';

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
