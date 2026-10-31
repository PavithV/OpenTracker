import type { WorkoutSetEntry } from '../types/active-workout.types';

// Ticking off a set whose reps field is still empty takes the routine's target reps (shown as the
// field's placeholder) -- "done as planned". Without this the set was saved with reps = null and
// silently left out of the volume and the 1RM estimate. Un-ticking never clears anything.
export function toggleSetCompletion(set: WorkoutSetEntry): WorkoutSetEntry {
  if (set.completed) return { ...set, completed: false };
  const reps = set.reps ?? set.targetReps ?? null;
  return { ...set, reps, completed: true };
}
