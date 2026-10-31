export interface WorkoutSetEntry {
  id: string; // local-only id, not a DB id -- assigned when synced in Phase 2, Punkt 5
  weight: number | null;
  reps: number | null;
  completed: boolean;
  // Planned reps from the routine (routine_exercise_sets.target_reps). Shown as the reps field's
  // placeholder and used when a set is ticked off with an empty reps field; never synced itself.
  // Optional so drafts persisted before this field existed still load.
  targetReps?: number | null;
}

export interface ActiveWorkoutExercise {
  exerciseId: string;
  name: string;
  imageUrl: string | null;
  notes: string;
  sets: WorkoutSetEntry[];
  // Target rest between sets, carried over from routine_exercises.rest_seconds when started from a
  // routine. Null for ad-hoc-added exercises (no target captured) -- no rest timer fires for those.
  restSeconds: number | null;
}
