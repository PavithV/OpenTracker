// Mirrors the `category` check constraint in supabase/migrations/0001_init.sql.
export const EXERCISE_CATEGORIES = [
  'back',
  'cardio',
  'chest',
  'lower arms',
  'lower legs',
  'neck',
  'shoulders',
  'upper arms',
  'upper legs',
  'waist',
] as const;

// `equipment` isn't check-constrained (free text) — this is the distinct set observed in the
// seeded exercises-dataset-main data. If custom (`is_custom`) exercises are introduced later with
// new equipment values, this list should be revisited.
export const EXERCISE_EQUIPMENT = [
  'assisted',
  'band',
  'barbell',
  'body weight',
  'bosu ball',
  'cable',
  'dumbbell',
  'elliptical machine',
  'ez barbell',
  'hammer',
  'kettlebell',
  'leverage machine',
  'medicine ball',
  'olympic barbell',
  'resistance band',
  'roller',
  'rope',
  'skierg machine',
  'sled machine',
  'smith machine',
  'stability ball',
  'stationary bike',
  'stepmill machine',
  'tire',
  'trap bar',
  'upper body ergometer',
  'weighted',
  'wheel roller',
] as const;

export interface ExerciseListItem {
  id: string;
  name: string;
  category: string;
  equipment: string;
  targetMuscle: string;
  imageUrl: string | null;
}

export interface ExerciseFilters {
  search?: string;
  category?: string;
  equipment?: string;
}

export interface CreateCustomExerciseInput {
  name: string;
  category: string;
  equipment: string;
  targetMuscle: string;
  imageUrl: string | null;
}

export interface ExerciseDetail {
  id: string;
  name: string;
  targetMuscle: string;
  secondaryMuscles: string[];
  imageUrl: string | null;
  gifUrl: string | null;
  attribution: string | null;
  // Keyed by ISO 639-1 language code (e.g. "en", "es") -- the seeded dataset has no "de" key,
  // callers fall back to "en".
  instructions: Record<string, string>;
}

export interface ExercisePersonalRecord {
  value: number;
  achievedAt: string;
}

export interface ExercisePersonalRecords {
  maxWeight: ExercisePersonalRecord | null;
  // Epley formula (weight * (1 + reps/30)), computed server-side in finish_workout. Independent
  // of maxWeight -- a lighter, higher-rep set can win here even though it loses on maxWeight.
  estimated1Rm: ExercisePersonalRecord | null;
}

export interface ExerciseHistorySet {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
}

export interface ExerciseHistoryEntry {
  workoutId: string;
  workoutName: string;
  startedAt: string;
  sets: ExerciseHistorySet[];
}
