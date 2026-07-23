import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { Screen } from '@/shared/components/Screen';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // TODO (Phase 2): Workout-Detail aus `workouts`/`workout_exercises`/`sets` laden.
  return (
    <Screen>
      <Text className="pt-md text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
        Workout {id}
      </Text>
    </Screen>
  );
}
