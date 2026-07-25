import dayjs from 'dayjs';

import { GERMAN_MONTHS } from '@/shared/utils/format';

import type { ProfileWorkoutPoint } from '../types/profile.types';

export type ProfilePeriod = '3m' | '6m' | '1y';
export type ProfileMetric = 'duration' | 'volume' | 'reps';

const BUCKET_COUNT = 6;

const PERIOD_MONTHS: Record<ProfilePeriod, number> = { '3m': 3, '6m': 6, '1y': 12 };

export function getSinceIsoForPeriod(period: ProfilePeriod): string {
  return dayjs().subtract(PERIOD_MONTHS[period], 'month').toISOString();
}

function metricValue(point: ProfileWorkoutPoint, metric: ProfileMetric): number {
  if (metric === 'duration') return point.durationSeconds;
  if (metric === 'reps') return point.totalReps;
  return point.totalVolume;
}

// Divides [sinceIso, now] into BUCKET_COUNT equal-width intervals and sums the selected metric
// per bucket -- switching metrics re-maps already-fetched points instead of refetching.
export function bucketWorkoutSeries(
  points: ProfileWorkoutPoint[],
  sinceIso: string,
  metric: ProfileMetric,
): { label: string; value: number }[] {
  const start = dayjs(sinceIso);
  const end = dayjs();
  const totalMs = Math.max(end.diff(start), 1);
  const bucketMs = totalMs / BUCKET_COUNT;

  const buckets = Array.from({ length: BUCKET_COUNT }, (_, index) => {
    const bucketStart = start.add(index * bucketMs, 'millisecond');
    return { label: `${GERMAN_MONTHS[bucketStart.month()]} ${bucketStart.date()}`, value: 0 };
  });

  for (const point of points) {
    const offsetMs = dayjs(point.startedAt).diff(start);
    const index = Math.min(BUCKET_COUNT - 1, Math.max(0, Math.floor(offsetMs / bucketMs)));
    buckets[index].value += metricValue(point, metric);
  }

  return buckets;
}
