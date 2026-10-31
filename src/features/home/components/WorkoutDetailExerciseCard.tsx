import { Check, CircleIcon as Circle } from 'phosphor-react-native';
import { useColorScheme, View } from 'react-native';

import { Card } from '@/shared/components/Card';
import { ExerciseThumbnail } from '@/shared/components/ExerciseThumbnail';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';
import { formatWeight } from '@/shared/utils/units';
import { useUnitPreferenceStore } from '@/store/unit-preference.store';

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
  const unit = useUnitPreferenceStore((state) => state.unitPreference);

  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center gap-sm">
        <ExerciseThumbnail name={exercise.name} imageUrl={exercise.imageUrl} />
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
              {set.weight !== null ? formatWeight(set.weight, unit) : '–'} × {set.reps ?? '–'}
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
