import dayjs from 'dayjs';
import { Text, View } from 'react-native';

import { Card } from '@/shared/components/Card';

import type { WorkoutHistoryItem } from '../types/workout-history.types';

function formatDuration(durationSeconds: number | null): string {
  if (durationSeconds === null) return '–';
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.round((durationSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
}

export function WorkoutHistoryCard({ workout }: { workout: WorkoutHistoryItem }) {
  return (
    <Card>
      <Text className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
        {workout.name}
      </Text>
      <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
        {dayjs(workout.startedAt).format('DD.MM.YYYY')}
      </Text>
      <View className="mt-sm flex-row gap-lg">
        <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          {formatDuration(workout.durationSeconds)}
        </Text>
        <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          {workout.totalVolume} kg
        </Text>
        <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          {workout.exerciseCount} {workout.exerciseCount === 1 ? 'Übung' : 'Übungen'}
        </Text>
      </View>
    </Card>
  );
}
