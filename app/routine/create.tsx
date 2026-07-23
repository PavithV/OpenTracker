import { Text } from 'react-native';

import { Screen } from '@/shared/components/Screen';

export default function CreateRoutineScreen() {
  // TODO (Phase 2): Name, Übungsauswahl (siehe exercise/picker), Reihenfolge, Soll-Werte.
  return (
    <Screen>
      <Text className="pt-md text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
        Routine erstellen
      </Text>
    </Screen>
  );
}
