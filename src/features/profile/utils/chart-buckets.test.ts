import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { bucketWorkoutSeries } from './chart-buckets';

describe('bucketWorkoutSeries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-31T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('labels six buckets in short German day-first form', () => {
    const buckets = bucketWorkoutSeries([], '2026-07-31T12:00:00', 'volume');
    // exact bucket boundaries depend on the time zone/DST; the format is what matters here
    expect(buckets).toHaveLength(6);
    expect(buckets[0].label).toBe('31. Juli');
    for (const bucket of buckets) expect(bucket.label).toMatch(/^\d{1,2}\. (Juli|Aug|Sep|Okt)$/);
  });

  it('sums the chosen metric into the bucket the workout started in', () => {
    const point = (startedAt: string, totalVolume: number) => ({
      startedAt,
      durationSeconds: 3600,
      totalVolume,
      totalReps: 10,
    });
    const buckets = bucketWorkoutSeries(
      [
        point('2026-08-01T10:00:00', 100),
        point('2026-08-02T10:00:00', 50),
        point('2026-10-30T10:00:00', 200),
      ],
      '2026-07-31T12:00:00',
      'volume',
    );
    expect(buckets.map((bucket) => bucket.value)).toEqual([150, 0, 0, 0, 0, 200]);
  });
});
