import { DotsSixVertical, Trash } from 'phosphor-react-native';
import { Image, type LayoutChangeEvent, Pressable, useColorScheme, View } from 'react-native';

import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';

import type { RoutineDraftExercise, RoutineDraftSet } from '../types/routine.types';

interface RoutineExerciseRowProps {
  exercise: RoutineDraftExercise;
  drag: () => void;
  isCompact: boolean;
  onContentHeightChange: (height: number) => void;
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
  drag,
  isCompact,
  onContentHeightChange,
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
        <Pressable onLongPress={drag} hitSlop={8} className="active:opacity-60">
          <DotsSixVertical size={ICON_SIZE.md} color={secondaryColor} />
        </Pressable>

        {exercise.imageUrl ? (
          <Image source={{ uri: exercise.imageUrl }} className="h-12 w-12 rounded-full" />
        ) : (
          <View className="h-12 w-12 rounded-full bg-surface-light dark:bg-surface-dark" />
        )}

        <Typography variant="cardTitle" className="flex-1">
          {exercise.name}
        </Typography>

        {!isCompact && (
          <Pressable onPress={onRemoveExercise} hitSlop={8} className="active:opacity-60">
            <Trash size={ICON_SIZE.md} color={colors.danger} />
          </Pressable>
        )}
      </View>

      {!isCompact && (
        <View onLayout={(e: LayoutChangeEvent) => onContentHeightChange(e.nativeEvent.layout.height)}>
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
        </View>
      )}
    </Card>
  );
}
