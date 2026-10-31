import { Copy, Trash } from 'phosphor-react-native';
import { Pressable, useColorScheme, View } from 'react-native';

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
  onDuplicate: () => void;
  onDelete: () => void;
}

export function RoutineCard({
  routine,
  onPress,
  onStart,
  onDuplicate,
  onDelete,
}: RoutineCardProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const iconColor = colors.textSecondary[scheme];

  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center gap-sm">
        <View className="flex-1">
          <Typography variant="cardTitle">{routine.name}</Typography>
          {routine.exercisePreview ? <Typography variant="subtitle">{routine.exercisePreview}</Typography> : null}
        </View>
        <Button label="Start" size="sm" onPress={onStart} />
        <Pressable
          onPress={onDuplicate}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${routine.name} duplizieren`}
          className="active:opacity-60"
        >
          <Copy size={ICON_SIZE.md} color={iconColor} />
        </Pressable>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${routine.name} löschen`}
          className="active:opacity-60"
        >
          <Trash size={ICON_SIZE.md} color={colors.danger} />
        </Pressable>
      </View>
    </Card>
  );
}
