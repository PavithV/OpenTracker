import type { UnitPreference } from '@/shared/utils/units';

export interface Profile {
  displayName: string | null;
  unitPreference: UnitPreference;
}

export interface ProfileStats {
  workoutCount: number;
  totalDurationSeconds: number;
  totalVolume: number;
}

export interface ProfileWorkoutPoint {
  startedAt: string;
  durationSeconds: number;
  totalVolume: number;
  totalReps: number;
}
