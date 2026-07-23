import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { History } from 'lucide-react-native';
import { FlatList, View } from 'react-native';

import { getWorkoutHistory } from '@/features/home/api/workouts.api';
import { WorkoutHistoryCard } from '@/features/home/components/WorkoutHistoryCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
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
        <Typography variant="title">Home</Typography>
      </View>

      {!isLoading && workouts?.length === 0 ? (
        <EmptyState
          icon={History}
          title="Noch keine Workouts"
          description="Starte dein erstes Training im Training-Tab, um hier deinen Verlauf zu sehen."
        />
      ) : (
        <FlatList
          data={workouts ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-sm"
          renderItem={({ item }) => (
            <WorkoutHistoryCard workout={item} onPress={() => router.push(`/workout/${item.id}`)} />
          )}
        />
      )}
    </Screen>
  );
}
