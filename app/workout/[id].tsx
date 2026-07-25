import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, View } from 'react-native';

import { deleteWorkout, getWorkoutDetail } from '@/features/home/api/workouts.api';
import { WorkoutDetailExerciseCard } from '@/features/home/components/WorkoutDetailExerciseCard';
import { WorkoutMuscleSplitCard } from '@/features/home/components/WorkoutMuscleSplitCard';
import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { formatDuration } from '@/shared/utils/format';
import { useSessionStore } from '@/store/session.store';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSessionStore((state) => state.session);
  const queryClient = useQueryClient();

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

  function handleDelete() {
    Alert.alert('Workout löschen?', 'Dieses Workout kann danach nicht mehr wiederhergestellt werden.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWorkout(id);
            queryClient.invalidateQueries({ queryKey: ['workouts', 'history', session?.user.id] });
            queryClient.invalidateQueries({ queryKey: ['profile', 'stats', session?.user.id] });
            router.back();
          } catch (err) {
            Alert.alert('Löschen fehlgeschlagen', err instanceof Error ? err.message : 'Unbekannter Fehler');
          }
        },
      },
    ]);
  }

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
            {workout.notes ? (
              <Typography variant="body" className="mt-xs">
                {workout.notes}
              </Typography>
            ) : null}
            <View className="mt-md">
              <WorkoutMuscleSplitCard exercises={workout.exercises} />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <WorkoutDetailExerciseCard exercise={item} onPress={() => router.push(`/exercise/${item.exerciseId}`)} />
        )}
        ListFooterComponent={
          <View className="pt-lg">
            <Button label="Workout löschen" variant="destructive" onPress={handleDelete} />
          </View>
        }
      />
    </Screen>
  );
}
