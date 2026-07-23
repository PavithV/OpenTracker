import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // TODO (Phase 2): Workout-Detail aus `workouts`/`workout_exercises`/`sets` laden.
  return (
    <Screen>
      <Typography variant="title" className="pt-md">
        Workout {id}
      </Typography>
    </Screen>
  );
}
