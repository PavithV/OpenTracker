export interface WorkoutHistoryExercisePreview {
  exerciseId: string;
  name: string;
  imageUrl: string | null;
  setCount: number;
}

export interface WorkoutHistoryItem {
  id: string;
  name: string;
  startedAt: string;
  durationSeconds: number | null;
  totalVolume: number;
  exercises: WorkoutHistoryExercisePreview[];
}
