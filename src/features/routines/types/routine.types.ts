export interface RoutineDraftExercise {
  exerciseId: string;
  name: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number | null;
  targetWeight: number | null;
  restSeconds: number | null;
}
