import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import type { WorkoutHistoryItem } from '../types/workout-history.types';
import { buildMonthGrid, groupWorkoutsByDate, weeklyStreak } from './calendar';

function makeWorkout(id: string, startedAt: string): WorkoutHistoryItem {
  return {
    id,
    name: `Workout ${id}`,
    startedAt,
    durationSeconds: 1800,
    totalVolume: 1000,
    exercises: [],
  };
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

describe('weeklyStreak', () => {
  // Saturday, 31 Oct 2026; its Monday-based week starts on Mon 26 Oct.
  const now = dayjs('2026-10-31T12:00:00');

  it('counts consecutive Monday-based weeks with a workout, including this one', () => {
    expect(
      weeklyStreak(['2026-10-26T18:00:00', '2026-10-21T18:00:00', '2026-10-12T18:00:00'], now),
    ).toBe(3);
  });

  it('keeps the streak alive while the current week has no workout yet', () => {
    expect(weeklyStreak(['2026-10-25T18:00:00', '2026-10-13T18:00:00'], now)).toBe(2);
  });

  it('breaks on a week without training', () => {
    expect(weeklyStreak(['2026-10-30T18:00:00', '2026-10-12T18:00:00'], now)).toBe(1);
  });

  it('treats Sunday as the end of the week, not the start', () => {
    // Sun 25 Oct belongs to the week of Mon 19 Oct
    expect(weeklyStreak(['2026-10-25T18:00:00'], now)).toBe(1);
    expect(weeklyStreak(['2026-10-18T18:00:00'], now)).toBe(0);
  });

  it('is 0 without workouts', () => {
    expect(weeklyStreak([], now)).toBe(0);
  });
});
