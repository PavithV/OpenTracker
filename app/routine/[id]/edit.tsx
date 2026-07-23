import { useQuery } from '@tanstack/react-query';
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
      <RoutineForm onSave={(name, notes, exercises) => updateRoutine(id, name, notes, exercises)} />
    </Screen>
  );
}
