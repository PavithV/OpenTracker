export interface WorkoutDetailSet {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
}

export interface WorkoutDetailExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: WorkoutDetailSet[];
}

export interface WorkoutDetail {
  id: string;
  name: string;
  startedAt: string;
  durationSeconds: number | null;
  totalVolume: number;
  exercises: WorkoutDetailExercise[];
}
