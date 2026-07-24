import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import type { WorkoutHistoryItem } from '../types/workout-history.types';

// Vielfaches von 7 (5 oder 6 Wochen, je nach Monat) -- `null` für Füll-Tage vor dem 1. bzw. nach
// dem Monatsende, damit `numColumns={7}` im FlatList-Grid immer vollständige Zeilen ergibt. Woche
// startet Montag: dayjs().day() ist Sonntag-basiert (0 = Sonntag), daher (day() + 6) % 7 für einen
// Montag-basierten Index.
export function buildMonthGrid(monthRef: Dayjs): (Dayjs | null)[] {
  const startOfMonth = monthRef.startOf('month');
  const daysInMonth = monthRef.daysInMonth();
  const leadingBlanks = (startOfMonth.day() + 6) % 7;

  const cells: (Dayjs | null)[] = Array.from({ length: leadingBlanks }, () => null);
  for (let day = 0; day < daysInMonth; day++) {
    cells.push(startOfMonth.add(day, 'day'));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export function groupWorkoutsByDate(workouts: WorkoutHistoryItem[]): Map<string, WorkoutHistoryItem[]> {
  const byDate = new Map<string, WorkoutHistoryItem[]>();
  for (const workout of workouts) {
    const key = dayjs(workout.startedAt).format('YYYY-MM-DD');
    const existing = byDate.get(key);
    if (existing) {
      existing.push(workout);
    } else {
      byDate.set(key, [workout]);
    }
  }
  return byDate;
}
