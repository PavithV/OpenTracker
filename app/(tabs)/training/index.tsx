import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, FlatList, View } from 'react-native';

import { archiveRoutine, getRoutineForEdit, getRoutines } from '@/features/routines/api/routines.api';
import { RoutineCard } from '@/features/routines/components/RoutineCard';
import { useRoutineDraftStore } from '@/features/routines/store/routine-draft.store';
import { ActiveWorkoutMiniBar } from '@/features/training/components/ActiveWorkoutMiniBar';
import { useActiveWorkoutStore } from '@/features/training/store/active-workout.store';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { useSessionStore } from '@/store/session.store';

export default function TrainingScreen() {
  const session = useSessionStore((state) => state.session);
  const queryClient = useQueryClient();

  const { data: routines, isLoading } = useQuery({
    queryKey: ['routines', 'list', session?.user.id],
    queryFn: () => getRoutines(session!.user.id),
    enabled: !!session,
  });

  function handleCreateRoutine() {
    useRoutineDraftStore.getState().reset();
    router.push('/routine/create');
  }

  function handleDeleteRoutine(routineId: string, routineName: string) {
    Alert.alert('Routine löschen?', `„${routineName}" kann danach nicht mehr geöffnet werden.`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          try {
            await archiveRoutine(routineId);
            queryClient.invalidateQueries({ queryKey: ['routines', 'list', session?.user.id] });
          } catch (err) {
            Alert.alert('Löschen fehlgeschlagen', err instanceof Error ? err.message : 'Unbekannter Fehler');
          }
        },
      },
    ]);
  }

  async function handleStartRoutine(routineId: string) {
    if (useActiveWorkoutStore.getState().startedAt) {
      Alert.alert(
        'Workout läuft bereits',
        'Es läuft schon ein Workout. Beende es zuerst oder öffne es über "Leeres Workout starten".',
      );
      return;
    }

    try {
      const { name, exercises } = await getRoutineForEdit(routineId);
      useActiveWorkoutStore.getState().startFromRoutine(routineId, name, exercises);
      router.push('/workout/active');
    } catch (err) {
      Alert.alert('Routine konnte nicht geladen werden', err instanceof Error ? err.message : 'Unbekannter Fehler');
    }
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
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
          renderItem={({ item }) => (
            <RoutineCard
              routine={item}
              onPress={() => router.push(`/routine/${item.id}/edit`)}
              onStart={() => handleStartRoutine(item.id)}
              onDelete={() => handleDeleteRoutine(item.id, item.name)}
            />
          )}
        />
      )}

      <View className="gap-md py-md">
        <Button label="Leeres Workout starten" onPress={() => router.push('/workout/active')} />
        <Button label="Routine erstellen" variant="secondary" onPress={handleCreateRoutine} />
      </View>

      <ActiveWorkoutMiniBar />
    </Screen>
  );
}
