export interface WorkoutSetEntry {
  id: string; // local-only id, not a DB id -- assigned when synced in Phase 2, Punkt 5
  weight: number | null;
  reps: number | null;
  completed: boolean;
}

export interface ActiveWorkoutExercise {
  exerciseId: string;
  name: string;
  notes: string;
  sets: WorkoutSetEntry[];
}
