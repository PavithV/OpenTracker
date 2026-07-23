import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, View } from 'react-native';

import { getWorkoutDetail } from '@/features/home/api/workouts.api';
import { WorkoutDetailExerciseCard } from '@/features/home/components/WorkoutDetailExerciseCard';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { formatDuration } from '@/shared/utils/format';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: workout, isLoading, error } = useQuery({
    queryKey: ['workouts', 'detail', id],
    queryFn: () => getWorkoutDetail(id),
  });

  useEffect(() => {
    if (error) {
      Alert.alert('Workout konnte nicht geladen werden', error instanceof Error ? error.message : 'Unbekannter Fehler');
      router.back();
    }
  }, [error]);

  if (isLoading || !workout) {
    return (
      <Screen>
        <ActivityIndicator className="mt-md" />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={workout.exercises}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-sm pb-lg"
        ListHeaderComponent={
          <View className="py-md gap-xs">
            <Typography variant="title">{workout.name}</Typography>
            <Typography variant="subtitle">{dayjs(workout.startedAt).format('DD.MM.YYYY, HH:mm')}</Typography>
            <View className="mt-xs flex-row gap-lg">
              <Typography variant="subtitle">{formatDuration(workout.durationSeconds)}</Typography>
              <Typography variant="subtitle">{workout.totalVolume} kg</Typography>
              <Typography variant="subtitle">
                {workout.exercises.length} {workout.exercises.length === 1 ? 'Übung' : 'Übungen'}
              </Typography>
            </View>
          </View>
        }
        renderItem={({ item }) => <WorkoutDetailExerciseCard exercise={item} />}
      />
    </Screen>
  );
}
