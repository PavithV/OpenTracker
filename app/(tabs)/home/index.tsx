import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';

import { getWorkoutHistory } from '@/features/home/api/workouts.api';
import { WorkoutHistoryCard } from '@/features/home/components/WorkoutHistoryCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { useSessionStore } from '@/store/session.store';

export default function HomeScreen() {
  const session = useSessionStore((state) => state.session);

  const { data: workouts, isLoading } = useQuery({
    queryKey: ['workouts', 'history', session?.user.id],
    queryFn: () => getWorkoutHistory(session!.user.id),
    enabled: !!session,
  });

  return (
    <Screen>
      <View className="py-md">
        <Text className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Home</Text>
      </View>

      {!isLoading && workouts?.length === 0 ? (
        <EmptyState
          title="Noch keine Workouts"
          description="Starte dein erstes Training im Training-Tab, um hier deinen Verlauf zu sehen."
        />
      ) : (
        <FlatList
          data={workouts ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-sm"
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/workout/${item.id}`)}>
              <WorkoutHistoryCard workout={item} />
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
