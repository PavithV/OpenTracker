import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { Screen } from '@/shared/components/Screen';

export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // TODO (Phase 2): Routine laden und bearbeitbar machen.
  return (
    <Screen>
      <Text className="pt-md text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
        Routine {id} bearbeiten
      </Text>
    </Screen>
  );
}
