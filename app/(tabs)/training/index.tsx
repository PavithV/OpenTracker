import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';

export default function TrainingScreen() {
  // TODO (Phase 2): "Routine starten" braucht eine geladene Routinenliste (routines-Tabelle).
  return (
    <Screen>
      <View className="py-md">
        <Text className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Training</Text>
      </View>
      <View className="flex-1 justify-center gap-md">
        <Button label="Leeres Workout starten" onPress={() => router.push('/workout/active')} />
        <Button label="Routine erstellen" variant="secondary" onPress={() => router.push('/routine/create')} />
      </View>
    </Screen>
  );
}
