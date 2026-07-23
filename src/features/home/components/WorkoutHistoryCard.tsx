import dayjs from 'dayjs';
import { Image, View } from 'react-native';

import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';
import { formatDuration } from '@/shared/utils/format';

import type { WorkoutHistoryItem } from '../types/workout-history.types';

const MAX_VISIBLE_EXERCISES = 3;

export function WorkoutHistoryCard({ workout, onPress }: { workout: WorkoutHistoryItem; onPress?: () => void }) {
  const visibleExercises = workout.exercises.slice(0, MAX_VISIBLE_EXERCISES);
  const remainingCount = workout.exercises.length - visibleExercises.length;

  return (
    <Card onPress={onPress}>
      <Typography variant="cardTitle">{workout.name}</Typography>
      <Typography variant="subtitle">{dayjs(workout.startedAt).format('DD.MM.YYYY')}</Typography>
      <View className="mt-sm flex-row gap-lg">
        <Typography variant="subtitle">{formatDuration(workout.durationSeconds)}</Typography>
        <Typography variant="subtitle">{workout.totalVolume} kg</Typography>
        <Typography variant="subtitle">
          {workout.exercises.length} {workout.exercises.length === 1 ? 'Übung' : 'Übungen'}
        </Typography>
      </View>

      {visibleExercises.length > 0 ? (
        <View className="mt-sm gap-sm">
          {visibleExercises.map((exercise) => (
            <View key={exercise.exerciseId} className="flex-row items-center gap-sm">
              {exercise.imageUrl ? (
                <Image source={{ uri: exercise.imageUrl }} className="h-12 w-12 rounded-full" />
              ) : (
                <View className="h-12 w-12 rounded-full bg-surface-light dark:bg-surface-dark" />
              )}
              <Typography variant="body">
                {exercise.setCount} {exercise.setCount === 1 ? 'Satz' : 'Sätze'} {exercise.name}
              </Typography>
            </View>
          ))}
          {remainingCount > 0 ? (
            <Typography variant="subtitle" className="text-center">
              Sehe {remainingCount} weitere {remainingCount === 1 ? 'Übung' : 'Übungen'}
            </Typography>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
