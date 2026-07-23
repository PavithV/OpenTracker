import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { Screen } from '@/shared/components/Screen';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // TODO (Phase 2): Tabs "Zusammenfassung" / "Historie" — siehe MVP.md "Übungsdetail".
  // Denk an die Attributionspflicht (© Gym visual) neben Bild/GIF.
  return (
    <Screen>
      <Text className="pt-md text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
        Übung {id}
      </Text>
    </Screen>
  );
}
