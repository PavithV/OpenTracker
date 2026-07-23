import { Check, Circle } from 'lucide-react-native';
import { useColorScheme, View } from 'react-native';

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
      <Typography variant="cardTitle">{exercise.name}</Typography>

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
    </Card>
  );
}
