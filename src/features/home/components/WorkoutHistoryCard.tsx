import dayjs from 'dayjs';
import { View } from 'react-native';

import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';
import { formatDuration } from '@/shared/utils/format';

import type { WorkoutHistoryItem } from '../types/workout-history.types';

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
