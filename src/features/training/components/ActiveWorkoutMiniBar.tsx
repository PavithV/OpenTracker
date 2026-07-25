import { router } from 'expo-router';
import { CaretUp, Trash } from 'phosphor-react-native';
import { Alert, Pressable, View } from 'react-native';

import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';

import { useActiveWorkoutHydrated, useActiveWorkoutStore } from '../store/active-workout.store';
import { formatElapsed, useElapsedSeconds } from '../utils/elapsed-time';

// Shown on the tab screens whenever a workout is running but the user navigated away from
// `workout/active` without finishing it (the store only resets on finish, see
// active-workout.store.ts's `reset` -- back-navigation alone never clears it). Lets the user jump
// back in or discard the workout without re-opening the full screen.
export function ActiveWorkoutMiniBar() {
  const hasHydrated = useActiveWorkoutHydrated();
  const startedAt = useActiveWorkoutStore((state) => state.startedAt);
  const name = useActiveWorkoutStore((state) => state.name);
  const exercises = useActiveWorkoutStore((state) => state.exercises);
  const elapsedSeconds = useElapsedSeconds(startedAt);

  if (!hasHydrated || !startedAt) return null;

  const currentExerciseName = exercises.at(-1)?.name;

  function handleDiscard() {
    Alert.alert('Workout verwerfen?', 'Der bisherige Fortschritt geht dabei verloren.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Verwerfen',
        style: 'destructive',
        onPress: () => useActiveWorkoutStore.getState().reset(),
      },
    ]);
  }

  return (
    <View className="mb-sm">
      <Card onPress={() => router.push('/workout/active')}>
        <View className="flex-row items-center gap-sm">
          <CaretUp size={ICON_SIZE.md} color={colors.textSecondary.dark} />

          <View className="flex-1">
            <View className="flex-row items-center gap-xs">
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.success }} />
              <Typography variant="cardTitle">
                {name} {formatElapsed(elapsedSeconds)}
              </Typography>
            </View>
            {currentExerciseName ? <Typography variant="subtitle">{currentExerciseName}</Typography> : null}
          </View>

          <Pressable onPress={handleDiscard} hitSlop={8} className="active:opacity-60">
            <Trash size={ICON_SIZE.md} color={colors.danger} />
          </Pressable>
        </View>
      </Card>
    </View>
  );
}
