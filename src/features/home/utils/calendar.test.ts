import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import type { WorkoutHistoryItem } from '../types/workout-history.types';
import { buildMonthGrid, groupWorkoutsByDate } from './calendar';

function makeWorkout(id: string, startedAt: string): WorkoutHistoryItem {
  return { id, name: `Workout ${id}`, startedAt, durationSeconds: 1800, totalVolume: 1000, exercises: [] };
}

describe('buildMonthGrid', () => {
  it('pads July 2026 (starts on a Wednesday) to 2 leading + 2 trailing blanks', () => {
    const cells = buildMonthGrid(dayjs('2026-07-01'));

    expect(cells).toHaveLength(35);
    expect(cells[0]).toBeNull();
    expect(cells[1]).toBeNull();
    expect(cells[2]?.date()).toBe(1);
    expect(cells[32]?.date()).toBe(31);
    expect(cells[33]).toBeNull();
    expect(cells[34]).toBeNull();
  });

  it('always returns a length that is a multiple of 7 with exactly daysInMonth real cells', () => {
    for (const month of ['2026-01-01', '2026-02-01', '2026-08-01', '2025-12-01']) {
      const monthRef = dayjs(month);
      const cells = buildMonthGrid(monthRef);

      expect(cells.length % 7).toBe(0);
      expect(cells.filter((cell) => cell !== null)).toHaveLength(monthRef.daysInMonth());
    }
  });
});

describe('groupWorkoutsByDate', () => {
  it('groups same-day workouts together and keeps other days separate, preserving order', () => {
    const morning = makeWorkout('a', '2026-07-10T08:00:00.000Z');
    const evening = makeWorkout('b', '2026-07-10T18:00:00.000Z');
    const otherDay = makeWorkout('c', '2026-07-12T08:00:00.000Z');

    const grouped = groupWorkoutsByDate([morning, evening, otherDay]);

    expect(grouped.size).toBe(2);
    expect(grouped.get('2026-07-10')).toEqual([morning, evening]);
    expect(grouped.get('2026-07-12')).toEqual([otherDay]);
  });
});
