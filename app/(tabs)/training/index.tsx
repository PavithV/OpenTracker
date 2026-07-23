import { router } from 'expo-router';
import { View } from 'react-native';

import { useRoutineDraftStore } from '@/features/routines/store/routine-draft.store';
import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';

export default function TrainingScreen() {
  // TODO (Phase 2): "Routine starten" braucht eine geladene Routinenliste (routines-Tabelle).
  function handleCreateRoutine() {
    useRoutineDraftStore.getState().reset();
    router.push('/routine/create');
  }

  return (
    <Screen>
      <View className="py-md">
        <Typography variant="title">Training</Typography>
      </View>
      <View className="flex-1 justify-center gap-md">
        <Button label="Leeres Workout starten" onPress={() => router.push('/workout/active')} />
        <Button label="Routine erstellen" variant="secondary" onPress={handleCreateRoutine} />
      </View>
    </Screen>
  );
}
