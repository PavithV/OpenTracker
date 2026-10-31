import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert } from 'react-native';

import { getRoutineForEdit, updateRoutine } from '@/features/routines/api/routines.api';
import { RoutineForm } from '@/features/routines/components/RoutineForm';
import { useRoutineDraftStore } from '@/features/routines/store/routine-draft.store';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';

export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const hydratedRoutineId = useRoutineDraftStore((state) => state.hydratedRoutineId);
  const hydrate = useRoutineDraftStore((state) => state.hydrate);

  const { data, isLoading, error } = useQuery({
    queryKey: ['routines', 'edit', id],
    queryFn: () => getRoutineForEdit(id),
  });

  useEffect(() => {
    if (data && hydratedRoutineId !== id) {
      hydrate(id, data);
    }
  }, [data, hydratedRoutineId, id, hydrate]);

  useEffect(() => {
    if (error) {
      Alert.alert(
        'Routine konnte nicht geladen werden',
        error instanceof Error ? error.message : 'Unbekannter Fehler',
      );
      router.back();
    }
  }, [error]);

  if (isLoading || hydratedRoutineId !== id) {
    return (
      <Screen>
        <Typography variant="title" className="py-md">
          Routine bearbeiten
        </Typography>
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen>
      <Typography variant="title" className="py-md">
        Routine bearbeiten
      </Typography>
      <RoutineForm
        onSave={async (name, notes, exercises) => {
          await updateRoutine(id, name, notes, exercises);
          queryClient.invalidateQueries({ queryKey: ['routines', 'list'] });
          // Awaited on purpose: the draft store is hydrated from this query's cached data the next
          // time the editor opens, and a stale-but-cached copy is returned instantly (the refetch
          // runs in the background, too late). Without refreshing it before closing, editing,
          // saving and reopening a routine showed the pre-save version -- and saving again wrote
          // that back.
          await queryClient.invalidateQueries({ queryKey: ['routines', 'edit', id] });
        }}
      />
    </Screen>
  );
}
