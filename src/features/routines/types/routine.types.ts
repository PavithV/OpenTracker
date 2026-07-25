export interface RoutineDraftSet {
  id: string; // local id (draft-only) or DB uuid (after hydrate) -- React keys + update targeting
  targetWeight: number | null;
  targetReps: number | null;
}

export interface RoutineDraftExercise {
  exerciseId: string;
  name: string;
  imageUrl: string | null;
  sets: RoutineDraftSet[];
  restSeconds: number | null;
}

export interface RoutineListItem {
  id: string;
  name: string;
  exerciseCount: number;
  exercisePreview: string;
}
