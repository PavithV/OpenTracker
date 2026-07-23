import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import { Pressable, useColorScheme, View } from 'react-native';

import { Card } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';

import type { RoutineDraftExercise } from '../types/routine.types';

interface RoutineExerciseRowProps {
  exercise: RoutineDraftExercise;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onUpdateTarget: (patch: Partial<Omit<RoutineDraftExercise, 'exerciseId' | 'name'>>) => void;
}

function toNumberOrNull(text: string): number | null {
  return text === '' ? null : Number(text);
}

export function RoutineExerciseRow({
  exercise,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onUpdateTarget,
}: RoutineExerciseRowProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const secondaryColor = colors.textSecondary[scheme];

  return (
    <Card>
      <View className="flex-row items-center gap-sm">
        <View className="gap-xs">
          <Pressable
            onPress={onMoveUp}
            disabled={isFirst}
            hitSlop={8}
            className={isFirst ? 'opacity-30' : 'active:opacity-60'}
          >
            <ChevronUp size={ICON_SIZE.sm} color={secondaryColor} />
          </Pressable>
          <Pressable
            onPress={onMoveDown}
            disabled={isLast}
            hitSlop={8}
            className={isLast ? 'opacity-30' : 'active:opacity-60'}
          >
            <ChevronDown size={ICON_SIZE.sm} color={secondaryColor} />
          </Pressable>
        </View>

        <Typography variant="cardTitle" className="flex-1">
          {exercise.name}
        </Typography>

        <Pressable onPress={onRemove} hitSlop={8} className="active:opacity-60">
          <Trash2 size={ICON_SIZE.md} color={colors.danger} />
        </Pressable>
      </View>

      <View className="mt-sm flex-row flex-wrap gap-sm">
        <View className="w-20">
          <Input
            label="Sätze"
            keyboardType="numeric"
            value={String(exercise.targetSets)}
            onChangeText={(text) => onUpdateTarget({ targetSets: Number(text) || 0 })}
          />
        </View>
        <View className="w-20">
          <Input
            label="Wdh. min"
            keyboardType="numeric"
            value={String(exercise.targetRepsMin)}
            onChangeText={(text) => onUpdateTarget({ targetRepsMin: Number(text) || 0 })}
          />
        </View>
        <View className="w-20">
          <Input
            label="Wdh. max"
            keyboardType="numeric"
            value={exercise.targetRepsMax === null ? '' : String(exercise.targetRepsMax)}
            onChangeText={(text) => onUpdateTarget({ targetRepsMax: toNumberOrNull(text) })}
          />
        </View>
        <View className="w-24">
          <Input
            label="Gewicht (kg)"
            keyboardType="numeric"
            value={exercise.targetWeight === null ? '' : String(exercise.targetWeight)}
            onChangeText={(text) => onUpdateTarget({ targetWeight: toNumberOrNull(text) })}
          />
        </View>
        <View className="w-24">
          <Input
            label="Pause (Sek.)"
            keyboardType="numeric"
            value={exercise.restSeconds === null ? '' : String(exercise.restSeconds)}
            onChangeText={(text) => onUpdateTarget({ restSeconds: toNumberOrNull(text) })}
          />
        </View>
      </View>
    </Card>
  );
}
