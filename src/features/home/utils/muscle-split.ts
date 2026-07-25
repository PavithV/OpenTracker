import type { WorkoutDetailExercise } from '../types/workout-detail.types';

export interface WorkoutMuscleSplitEntry {
  muscle: string;
  percentage: number;
}

// Mirrors the volume rule used elsewhere (weight * reps, completed sets only). Exercises with no
// target_muscle are excluded from both the numerator and the denominator so the visible
// percentages sum to ~100% across the muscles that are actually shown.
export function computeWorkoutMuscleSplit(exercises: WorkoutDetailExercise[]): WorkoutMuscleSplitEntry[] {
  const volumeByMuscle = new Map<string, number>();

  for (const exercise of exercises) {
    if (!exercise.targetMuscle) continue;
    for (const set of exercise.sets) {
      if (!set.completed || set.weight === null || set.reps === null) continue;
      const current = volumeByMuscle.get(exercise.targetMuscle) ?? 0;
      volumeByMuscle.set(exercise.targetMuscle, current + set.weight * set.reps);
    }
  }

  const totalVolume = Array.from(volumeByMuscle.values()).reduce((sum, volume) => sum + volume, 0);
  if (totalVolume === 0) return [];

  return Array.from(volumeByMuscle.entries())
    .map(([muscle, volume]) => ({ muscle, percentage: Math.round((volume / totalVolume) * 100) }))
    .sort((a, b) => b.percentage - a.percentage);
}
