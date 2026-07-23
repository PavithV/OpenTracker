export interface WorkoutHistoryItem {
  id: string;
  name: string;
  startedAt: string;
  durationSeconds: number | null;
  totalVolume: number;
  exerciseCount: number;
}
