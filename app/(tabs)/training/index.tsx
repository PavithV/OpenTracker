import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, View } from 'react-native';

import { getRoutines } from '@/features/routines/api/routines.api';
import { useRoutineDraftStore } from '@/features/routines/store/routine-draft.store';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { ListItem } from '@/shared/components/ListItem';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { useSessionStore } from '@/store/session.store';

export default function TrainingScreen() {
  // TODO (Phase 2): "Routine starten" -> aktives Workout aus einer Routine vorbefüllen. Bisher
  // führt nur der Tap auf eine Routine zu routine/[id]/edit.tsx (Ansehen/Bearbeiten).
  const session = useSessionStore((state) => state.session);

  const { data: routines, isLoading } = useQuery({
    queryKey: ['routines', 'list', session?.user.id],
    queryFn: () => getRoutines(session!.user.id),
    enabled: !!session,
  });

  function handleCreateRoutine() {
    useRoutineDraftStore.getState().reset();
    router.push('/routine/create');
  }

  return (
    <Screen>
      <View className="py-md">
        <Typography variant="title">Training</Typography>
      </View>

      {!isLoading && routines?.length === 0 ? (
        <EmptyState
          title="Noch keine Routinen"
          description="Erstelle deine erste Routine, um sie hier zu sehen."
        />
      ) : (
        <FlatList
          className="flex-1"
          data={routines ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-sm"
          ItemSeparatorComponent={() => <View className="border-b border-border-light dark:border-border-dark" />}
          renderItem={({ item }) => (
            <ListItem
              title={item.name}
              description={`${item.exerciseCount} ${item.exerciseCount === 1 ? 'Übung' : 'Übungen'}`}
              onPress={() => router.push(`/routine/${item.id}/edit`)}
            />
          )}
        />
      )}

      <View className="gap-md py-md">
        <Button label="Leeres Workout starten" onPress={() => router.push('/workout/active')} />
        <Button label="Routine erstellen" variant="secondary" onPress={handleCreateRoutine} />
      </View>
    </Screen>
  );
}
