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
