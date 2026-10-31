import dayjs from 'dayjs';
import { View } from 'react-native';

import { Card } from '@/shared/components/Card';
import { ExerciseThumbnail } from '@/shared/components/ExerciseThumbnail';
import { Typography } from '@/shared/components/Typography';
import { formatWeight } from '@/shared/utils/units';
import { useUnitPreferenceStore } from '@/store/unit-preference.store';

import type { ExerciseHistoryEntry } from '../types/exercise.types';

export function ExerciseHistoryEntryCard({
  entry,
  imageUrl,
  onPress,
}: {
  entry: ExerciseHistoryEntry;
  imageUrl: string | null;
  onPress?: () => void;
}) {
  const unit = useUnitPreferenceStore((state) => state.unitPreference);

  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center gap-sm">
        <ExerciseThumbnail name={entry.workoutName} imageUrl={imageUrl} size="sm" />
        <View className="flex-1">
          <Typography variant="cardTitle">{entry.workoutName}</Typography>
          <Typography variant="subtitle">{dayjs(entry.startedAt).format('DD.MM.YYYY, HH:mm')}</Typography>
        </View>
      </View>

      <View className="mt-sm gap-xs">
        {entry.sets.map((set) => (
          <View key={set.id} className="flex-row items-center gap-sm">
            <Typography variant="caption" className="w-8">
              {set.setNumber}
            </Typography>
            <Typography variant="body">
              {set.weight !== null ? formatWeight(set.weight, unit) : '–'} × {set.reps ?? '–'}
            </Typography>
          </View>
        ))}
      </View>
    </Card>
  );
}
