import { Check, CircleIcon as Circle } from 'phosphor-react-native';
import { Image, useColorScheme, View } from 'react-native';

import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';

import type { WorkoutDetailExercise } from '../types/workout-detail.types';

export function WorkoutDetailExerciseCard({
  exercise,
  onPress,
}: {
  exercise: WorkoutDetailExercise;
  onPress?: () => void;
}) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const secondaryColor = colors.textTertiary[scheme];

  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center gap-sm">
        {exercise.imageUrl ? (
          <Image source={{ uri: exercise.imageUrl }} className="h-12 w-12 rounded-full" />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-light/15 dark:bg-primary-dark/15">
            <Typography variant="label" color="accent">
              {exercise.name.charAt(0).toUpperCase()}
            </Typography>
          </View>
        )}
        <Typography variant="cardTitle" className="flex-1">
          {exercise.name}
        </Typography>
      </View>

      <View className="mt-sm gap-xs">
        {exercise.sets.map((set, index) => (
          <View key={set.id} className="flex-row items-center gap-sm">
            <Typography variant="caption" className="w-8">
              {index + 1}
            </Typography>
            <Typography variant="body" className="flex-1">
              {set.weight ?? '–'} kg × {set.reps ?? '–'}
            </Typography>
            {set.completed ? (
              <Check size={ICON_SIZE.md} color={colors.primary.DEFAULT} />
            ) : (
              <Circle size={ICON_SIZE.md} color={secondaryColor} />
            )}
          </View>
        ))}
      </View>

      {exercise.notes ? (
        <Typography variant="subtitle" className="mt-sm">
          {exercise.notes}
        </Typography>
      ) : null}
    </Card>
  );
}
