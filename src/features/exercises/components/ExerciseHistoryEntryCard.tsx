import dayjs from 'dayjs';
import { View } from 'react-native';

import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';

import type { ExerciseHistoryEntry } from '../types/exercise.types';

export function ExerciseHistoryEntryCard({ entry, onPress }: { entry: ExerciseHistoryEntry; onPress?: () => void }) {
  return (
    <Card onPress={onPress}>
      <Typography variant="cardTitle">{entry.workoutName}</Typography>
      <Typography variant="subtitle">{dayjs(entry.startedAt).format('DD.MM.YYYY, HH:mm')}</Typography>

      <View className="mt-sm gap-xs">
        {entry.sets.map((set) => (
          <View key={set.id} className="flex-row items-center gap-sm">
            <Typography variant="caption" className="w-8">
              {set.setNumber}
            </Typography>
            <Typography variant="body">
              {set.weight ?? '–'} kg × {set.reps ?? '–'}
            </Typography>
          </View>
        ))}
      </View>
    </Card>
  );
}
