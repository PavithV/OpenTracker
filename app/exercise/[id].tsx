import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // TODO (Phase 2): Tabs "Zusammenfassung" / "Historie" — siehe MVP.md "Übungsdetail".
  // Denk an die Attributionspflicht (© Gym visual) neben Bild/GIF.
  return (
    <Screen>
      <Typography variant="title" className="pt-md">
        Übung {id}
      </Typography>
    </Screen>
  );
}
