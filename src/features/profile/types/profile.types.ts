export interface Profile {
  displayName: string | null;
  unitPreference: string;
}

export interface ProfileStats {
  workoutCount: number;
  totalDurationSeconds: number;
  totalVolume: number;
}

export interface MuscleSplitEntry {
  muscle: string;
  volume: number;
}
