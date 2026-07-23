import { View } from 'react-native';

import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';

import type { RoutineListItem } from '../types/routine.types';

interface RoutineCardProps {
  routine: RoutineListItem;
  onPress: () => void;
  onStart: () => void;
}

export function RoutineCard({ routine, onPress, onStart }: RoutineCardProps) {
  return (
    <Card onPress={onPress}>
      <Typography variant="cardTitle">{routine.name}</Typography>
      {routine.exercisePreview ? <Typography variant="subtitle">{routine.exercisePreview}</Typography> : null}
      <View className="pt-sm">
        <Button label="Routine starten" onPress={onStart} />
      </View>
    </Card>
  );
}
