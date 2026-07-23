export interface ExerciseRecordSummary {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number | null;
  estimated1Rm: number | null;
  achievedAt: string;
}
