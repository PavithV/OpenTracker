import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { FilterChip } from '@/features/exercises/components/FilterChip';
import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';
import { VerticalBarChart } from '@/shared/components/VerticalBarChart';
import { formatDuration } from '@/shared/utils/format';

import { getProfileWorkoutSeries } from '../api/profile.api';
import { bucketWorkoutSeries, getSinceIsoForPeriod, type ProfileMetric, type ProfilePeriod } from '../utils/chart-buckets';

const PERIOD_OPTIONS: { value: ProfilePeriod; label: string }[] = [
  { value: '3m', label: 'Letzte 3 Monate' },
  { value: '6m', label: 'Letzte 6 Monate' },
  { value: '1y', label: 'Letztes Jahr' },
];

const METRIC_OPTIONS: { value: ProfileMetric; label: string }[] = [
  { value: 'duration', label: 'Dauer' },
  { value: 'volume', label: 'Volumen' },
  { value: 'reps', label: 'Wiederholungen' },
];

function formatTotal(total: number, metric: ProfileMetric): string {
  if (metric === 'duration') return formatDuration(total);
  if (metric === 'reps') return `${Math.round(total)} Wiederholungen`;
  return `${Math.round(total)} kg`;
}

export function ProfileVolumeChart({ userId }: { userId: string }) {
  const [period, setPeriod] = useState<ProfilePeriod>('3m');
  const [metric, setMetric] = useState<ProfileMetric>('volume');

  const sinceIso = getSinceIsoForPeriod(period);
  const { data: points } = useQuery({
    queryKey: ['profile', 'series', userId, period],
    queryFn: () => getProfileWorkoutSeries(userId, sinceIso),
  });

  const buckets = useMemo(() => bucketWorkoutSeries(points ?? [], sinceIso, metric), [points, sinceIso, metric]);
  const total = useMemo(() => buckets.reduce((sum, entry) => sum + entry.value, 0), [buckets]);
  const periodLabel = PERIOD_OPTIONS.find((option) => option.value === period)!.label;

  return (
    <Card>
      <View className="flex-row flex-wrap gap-xs">
        {PERIOD_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={period === option.value}
            onPress={() => setPeriod(option.value)}
          />
        ))}
      </View>

      <View className="mt-sm flex-row flex-wrap gap-xs">
        {METRIC_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={metric === option.value}
            onPress={() => setMetric(option.value)}
          />
        ))}
      </View>

      <Typography variant="cardTitle" className="mt-md mb-sm">
        {formatTotal(total, metric)} · {periodLabel}
      </Typography>

      <VerticalBarChart data={buckets} />
    </Card>
  );
}
