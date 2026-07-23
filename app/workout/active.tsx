import { Text } from 'react-native';

import { Screen } from '@/shared/components/Screen';

export default function ActiveWorkoutScreen() {
  // TODO (Phase 2): Timer, Gesamtvolumen, Satz-Erfassung pro Übung — siehe MVP.md "Training".
  return (
    <Screen>
      <Text className="pt-md text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
        Aktives Workout
      </Text>
    </Screen>
  );
}
