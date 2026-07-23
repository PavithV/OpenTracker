export interface RoutineDraftExercise {
  exerciseId: string;
  name: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number | null;
  targetWeight: number | null;
  restSeconds: number | null;
}

export interface RoutineListItem {
  id: string;
  name: string;
  exerciseCount: number;
}
