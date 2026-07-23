import dayjs from 'dayjs';
import { View } from 'react-native';

import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';

import type { WorkoutHistoryItem } from '../types/workout-history.types';

function formatDuration(durationSeconds: number | null): string {
  if (durationSeconds === null) return '–';
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.round((durationSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
}

export function WorkoutHistoryCard({ workout, onPress }: { workout: WorkoutHistoryItem; onPress?: () => void }) {
  return (
    <Card onPress={onPress}>
      <Typography variant="cardTitle">{workout.name}</Typography>
      <Typography variant="subtitle">{dayjs(workout.startedAt).format('DD.MM.YYYY')}</Typography>
      <View className="mt-sm flex-row gap-lg">
        <Typography variant="subtitle">{formatDuration(workout.durationSeconds)}</Typography>
        <Typography variant="subtitle">{workout.totalVolume} kg</Typography>
        <Typography variant="subtitle">
          {workout.exerciseCount} {workout.exerciseCount === 1 ? 'Übung' : 'Übungen'}
        </Typography>
      </View>
    </Card>
  );
}
