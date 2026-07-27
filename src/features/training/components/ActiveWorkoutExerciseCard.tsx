import { Barbell, CaretDown, CaretUp, Check, CircleIcon as Circle, Trash } from 'phosphor-react-native';
import { Image, Pressable, useColorScheme, View } from 'react-native';

import type { ExerciseHistorySet } from '@/features/exercises/types/exercise.types';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';
import { formatWeight, kgToLb, parseWeightInput } from '@/shared/utils/units';
import { useUnitPreferenceStore } from '@/store/unit-preference.store';

import type { ActiveWorkoutExercise, WorkoutSetEntry } from '../types/active-workout.types';

interface ActiveWorkoutExerciseCardProps {
  exercise: ActiveWorkoutExercise;
  // Last completed session's sets for this exercise, for the "last time: 60 kg x 8" reference --
  // matched to the current row by set position (setNumber), not array index, in case of gaps.
  previousSets?: ExerciseHistorySet[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemoveExercise: () => void;
  onAddSet: () => void;
  onUpdateSet: (setId: string, patch: Partial<Pick<WorkoutSetEntry, 'weight' | 'reps'>>) => void;
  onToggleSetCompleted: (setId: string) => void;
  onRemoveSet: (setId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onOpenPlateCalculator: (weight: number | null) => void;
}

function toNumberOrNull(text: string): number | null {
  return text === '' ? null : Number(text);
}

export function ActiveWorkoutExerciseCard({
  exercise,
  previousSets,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemoveExercise,
  onAddSet,
  onUpdateSet,
  onToggleSetCompleted,
  onRemoveSet,
  onUpdateNotes,
  onOpenPlateCalculator,
}: ActiveWorkoutExerciseCardProps) {
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

      <View className="mt-sm gap-xs">
        {exercise.sets.map((set, index) => {
          const previousSet = previousSets?.find((entry) => entry.setNumber === index + 1);
          return (
            <View key={set.id} className="gap-xs">
              <View className="flex-row items-center gap-sm">
                <Typography variant="caption" className="w-8">
                  {index + 1}
                </Typography>
                <View className="w-20">
                  <Input
                    placeholder={unit}
                    keyboardType="numeric"
                    value={set.weight === null ? '' : String(unit === 'lb' ? kgToLb(set.weight) : set.weight)}
                    onChangeText={(text) => onUpdateSet(set.id, { weight: parseWeightInput(text, unit) })}
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
                <Pressable
                  onPress={() => onOpenPlateCalculator(set.weight)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Plattenrechner öffnen"
                  className="active:opacity-60"
                >
                  <Barbell size={ICON_SIZE.sm} color={secondaryColor} />
                </Pressable>
                <Pressable
                  onPress={() => onToggleSetCompleted(set.id)}
                  hitSlop={4}
                  accessibilityRole="checkbox"
                  accessibilityLabel="Satz als erledigt markieren"
                  accessibilityState={{ checked: set.completed }}
                  className={`h-11 flex-1 items-center justify-center rounded-lg active:opacity-60 ${
                    set.completed ? 'bg-primary-light/15 dark:bg-primary-dark/15' : ''
                  }`}
                >
                  {set.completed ? (
                    <Check size={ICON_SIZE.md} color={colors.primary.DEFAULT} />
                  ) : (
                    <Circle size={ICON_SIZE.md} color={secondaryColor} />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => onRemoveSet(set.id)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Satz entfernen"
                  className="active:opacity-60"
                >
                  <Trash size={ICON_SIZE.sm} color={secondaryColor} />
                </Pressable>
              </View>
              {previousSet && (previousSet.weight !== null || previousSet.reps !== null) ? (
                <Typography variant="caption" className="pl-lg">
                  Letztes Mal: {previousSet.weight !== null ? formatWeight(previousSet.weight, unit) : '–'}
                  {previousSet.reps !== null ? ` × ${previousSet.reps}` : ''}
                </Typography>
              ) : null}
            </View>
          );
        })}
      </View>

      <Button label="Satz hinzufügen" variant="ghost" size="sm" onPress={onAddSet} />

      <Input
        placeholder="Notizen zu dieser Übung…"
        value={exercise.notes}
        onChangeText={onUpdateNotes}
        multiline
        numberOfLines={2}
      />
    </Card>
  );
}
