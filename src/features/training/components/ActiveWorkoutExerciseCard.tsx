import { Check, Circle, Trash2 } from 'lucide-react-native';
import { Pressable, useColorScheme, View } from 'react-native';

import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';

import type { ActiveWorkoutExercise, WorkoutSetEntry } from '../types/active-workout.types';

interface ActiveWorkoutExerciseCardProps {
  exercise: ActiveWorkoutExercise;
  onRemoveExercise: () => void;
  onAddSet: () => void;
  onUpdateSet: (setId: string, patch: Partial<Pick<WorkoutSetEntry, 'weight' | 'reps'>>) => void;
  onToggleSetCompleted: (setId: string) => void;
  onRemoveSet: (setId: string) => void;
}

function toNumberOrNull(text: string): number | null {
  return text === '' ? null : Number(text);
}

export function ActiveWorkoutExerciseCard({
  exercise,
  onRemoveExercise,
  onAddSet,
  onUpdateSet,
  onToggleSetCompleted,
  onRemoveSet,
}: ActiveWorkoutExerciseCardProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const secondaryColor = colors.textSecondary[scheme];

  return (
    <Card>
      <View className="flex-row items-center gap-sm">
        <Typography variant="cardTitle" className="flex-1">
          {exercise.name}
        </Typography>
        <Pressable onPress={onRemoveExercise} hitSlop={8} className="active:opacity-60">
          <Trash2 size={ICON_SIZE.md} color={colors.danger} />
        </Pressable>
      </View>

      <View className="mt-sm gap-xs">
        {exercise.sets.map((set, index) => (
          <View key={set.id} className="flex-row items-center gap-sm">
            <Typography variant="caption" className="w-8">
              {index + 1}
            </Typography>
            <View className="w-20">
              <Input
                placeholder="kg"
                keyboardType="numeric"
                value={set.weight === null ? '' : String(set.weight)}
                onChangeText={(text) => onUpdateSet(set.id, { weight: toNumberOrNull(text) })}
              />
            </View>
            <View className="w-20">
              <Input
                placeholder="Wdh"
                keyboardType="numeric"
                value={set.reps === null ? '' : String(set.reps)}
                onChangeText={(text) => onUpdateSet(set.id, { reps: toNumberOrNull(text) })}
              />
            </View>
            <Pressable onPress={() => onToggleSetCompleted(set.id)} hitSlop={8} className="active:opacity-60">
              {set.completed ? (
                <Check size={ICON_SIZE.md} color={colors.primary.DEFAULT} />
              ) : (
                <Circle size={ICON_SIZE.md} color={secondaryColor} />
              )}
            </Pressable>
            <Pressable onPress={() => onRemoveSet(set.id)} hitSlop={8} className="active:opacity-60">
              <Trash2 size={ICON_SIZE.sm} color={secondaryColor} />
            </Pressable>
          </View>
        ))}
      </View>

      <Button label="Satz hinzufügen" variant="ghost" size="sm" onPress={onAddSet} />
    </Card>
  );
}
