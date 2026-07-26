import { CaretDown, CaretUp, Trash } from 'phosphor-react-native';
import { Image, Pressable, useColorScheme, View } from 'react-native';

import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';

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

function toNumberOrNull(text: string): number | null {
  return text === '' ? null : Number(text);
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

  return (
    <Card>
      <View className="flex-row items-center gap-sm">
        <View className="gap-xs">
          <Pressable
            onPress={onMoveUp}
            disabled={!canMoveUp}
            hitSlop={8}
            className={canMoveUp ? 'active:opacity-60' : 'opacity-30'}
          >
            <CaretUp size={ICON_SIZE.sm} color={secondaryColor} />
          </Pressable>
          <Pressable
            onPress={onMoveDown}
            disabled={!canMoveDown}
            hitSlop={8}
            className={canMoveDown ? 'active:opacity-60' : 'opacity-30'}
          >
            <CaretDown size={ICON_SIZE.sm} color={secondaryColor} />
          </Pressable>
        </View>

        {exercise.imageUrl ? (
          <Image source={{ uri: exercise.imageUrl }} className="h-12 w-12 rounded-full" />
        ) : (
          <View className="h-12 w-12 rounded-full bg-surface-light dark:bg-surface-dark" />
        )}

        <Typography variant="cardTitle" className="flex-1">
          {exercise.name}
        </Typography>

        <Pressable onPress={onRemoveExercise} hitSlop={8} className="active:opacity-60">
          <Trash size={ICON_SIZE.md} color={colors.danger} />
        </Pressable>
      </View>

      <View className="mt-md gap-sm">
        <View className="flex-row items-center gap-sm">
          <Typography variant="caption" className="w-10">
            SET
          </Typography>
          <Typography variant="caption" className="flex-1">
            KG
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
              <Input
                keyboardType="numeric"
                placeholder="-"
                value={set.targetWeight === null ? '' : String(set.targetWeight)}
                onChangeText={(text) => onUpdateSet(set.id, { targetWeight: toNumberOrNull(text) })}
              />
            </View>
            <View className="flex-1">
              <Input
                keyboardType="numeric"
                placeholder="-"
                value={set.targetReps === null ? '' : String(set.targetReps)}
                onChangeText={(text) => onUpdateSet(set.id, { targetReps: toNumberOrNull(text) })}
              />
            </View>
            <Pressable
              onPress={() => onRemoveSet(set.id)}
              disabled={exercise.sets.length === 1}
              hitSlop={8}
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
          keyboardType="numeric"
          value={exercise.restSeconds === null ? '' : String(exercise.restSeconds)}
          onChangeText={(text) => onUpdateRestSeconds(toNumberOrNull(text))}
        />
      </View>
    </Card>
  );
}
