import { CaretDown, CaretUp, Trash } from 'phosphor-react-native';
import { Image, Pressable, useColorScheme, View } from 'react-native';

import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { Typography } from '@/shared/components/Typography';
import { WeightInput } from '@/shared/components/WeightInput';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';
import { parseWholeNumberInput } from '@/shared/utils/number-input';
import { useUnitPreferenceStore } from '@/store/unit-preference.store';

import type { RoutineDraftExercise, RoutineDraftSet } from '../types/routine.types';

interface RoutineExerciseRowProps {
  exercise: RoutineDraftExercise;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemoveExercise: () => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onUpdateSet: (setId: string, patch: Partial<Pick<RoutineDraftSet, 'targetWeight' | 'targetReps'>>) => void;
  onUpdateRestSeconds: (restSeconds: number | null) => void;
}

export function RoutineExerciseRow({
  exercise,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onUpdateRestSeconds,
}: RoutineExerciseRowProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const secondaryColor = colors.textSecondary[scheme];
  const unit = useUnitPreferenceStore((state) => state.unitPreference);

  return (
    <Card>
      <View className="flex-row items-center gap-sm">
        <View className="gap-xs">
          <Pressable
            onPress={onMoveUp}
            disabled={!canMoveUp}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Übung nach oben verschieben"
            accessibilityState={{ disabled: !canMoveUp }}
            className={canMoveUp ? 'active:opacity-60' : 'opacity-30'}
          >
            <CaretUp size={ICON_SIZE.sm} color={secondaryColor} />
          </Pressable>
          <Pressable
            onPress={onMoveDown}
            disabled={!canMoveDown}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Übung nach unten verschieben"
            accessibilityState={{ disabled: !canMoveDown }}
            className={canMoveDown ? 'active:opacity-60' : 'opacity-30'}
          >
            <CaretDown size={ICON_SIZE.sm} color={secondaryColor} />
          </Pressable>
        </View>

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

        <Pressable
          onPress={onRemoveExercise}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Übung entfernen"
          className="active:opacity-60"
        >
          <Trash size={ICON_SIZE.md} color={colors.danger} />
        </Pressable>
      </View>

      <View className="mt-md gap-sm">
        <View className="flex-row items-center gap-sm">
          <Typography variant="caption" className="w-10">
            SET
          </Typography>
          <Typography variant="caption" className="flex-1">
            {unit.toUpperCase()}
          </Typography>
          <Typography variant="caption" className="flex-1">
            WDH
          </Typography>
          <View className="w-8" />
        </View>

        {exercise.sets.map((set, index) => (
          <View key={set.id} className="flex-row items-center gap-sm">
            <Typography variant="cardTitle" className="w-10">
              {index + 1}
            </Typography>
            <View className="flex-1">
              <WeightInput
                placeholder="-"
                weightKg={set.targetWeight}
                unit={unit}
                onChangeWeightKg={(targetWeight) => onUpdateSet(set.id, { targetWeight })}
              />
            </View>
            <View className="flex-1">
              <Input
                keyboardType="number-pad"
                placeholder="-"
                value={set.targetReps === null ? '' : String(set.targetReps)}
                onChangeText={(text) => onUpdateSet(set.id, { targetReps: parseWholeNumberInput(text) })}
              />
            </View>
            <Pressable
              onPress={() => onRemoveSet(set.id)}
              disabled={exercise.sets.length === 1}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Satz entfernen"
              accessibilityState={{ disabled: exercise.sets.length === 1 }}
              className={`w-8 items-center ${exercise.sets.length === 1 ? 'opacity-30' : 'active:opacity-60'}`}
            >
              <Trash size={ICON_SIZE.sm} color={colors.danger} />
            </Pressable>
          </View>
        ))}

        <Button label="+ Satz hinzufügen" variant="secondary" size="sm" onPress={onAddSet} />
      </View>

      <View className="mt-sm w-32">
        <Input
          label="Pause (Sek.)"
          keyboardType="number-pad"
          value={exercise.restSeconds === null ? '' : String(exercise.restSeconds)}
          onChangeText={(text) => onUpdateRestSeconds(parseWholeNumberInput(text))}
        />
      </View>
    </Card>
  );
}
