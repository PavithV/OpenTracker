import { Text, View } from 'react-native';

import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';

export default function HomeScreen() {
  // TODO (Phase 2): load workout history from `workouts` and render as cards
  // (Name, Datum, Dauer, Volumen, Anzahl Übungen) per MVP.md.
  return (
    <Screen>
      <View className="py-md">
        <Text className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Home</Text>
      </View>
      <EmptyState
        title="Noch keine Workouts"
        description="Starte dein erstes Training im Training-Tab, um hier deinen Verlauf zu sehen."
      />
    </Screen>
  );
}
