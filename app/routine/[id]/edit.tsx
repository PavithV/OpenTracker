import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';

export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // TODO (Phase 2): Routine laden und bearbeitbar machen.
  return (
    <Screen>
      <Typography variant="title" className="pt-md">
        Routine {id} bearbeiten
      </Typography>
    </Screen>
  );
}
