import { Trash } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';

import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';

import type { RoutineListItem } from '../types/routine.types';

interface RoutineCardProps {
  routine: RoutineListItem;
  onPress: () => void;
  onStart: () => void;
  onDelete: () => void;
}

export function RoutineCard({ routine, onPress, onStart, onDelete }: RoutineCardProps) {
  return (
    <Card onPress={onPress}>
      <View className="flex-row items-start gap-sm">
        <View className="flex-1">
          <Typography variant="cardTitle">{routine.name}</Typography>
          {routine.exercisePreview ? <Typography variant="subtitle">{routine.exercisePreview}</Typography> : null}
        </View>
        <Pressable onPress={onDelete} hitSlop={8} className="active:opacity-60">
          <Trash size={ICON_SIZE.md} color={colors.danger} />
        </Pressable>
      </View>
      <View className="pt-sm">
        <Button label="Routine starten" onPress={onStart} />
      </View>
    </Card>
  );
}
