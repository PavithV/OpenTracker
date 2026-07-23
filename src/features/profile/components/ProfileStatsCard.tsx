import { View } from 'react-native';

import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';
import { formatDuration } from '@/shared/utils/format';

import type { ProfileStats } from '../types/profile.types';

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center gap-xs">
      <Typography variant="cardTitle">{value}</Typography>
      <Typography variant="subtitle">{label}</Typography>
    </View>
  );
}

export function ProfileStatsCard({ stats }: { stats: ProfileStats }) {
  return (
    <Card>
      <View className="flex-row">
        <StatBlock label="Workouts" value={String(stats.workoutCount)} />
        <StatBlock label="Trainingszeit" value={formatDuration(stats.totalDurationSeconds)} />
        <StatBlock label="Volumen" value={`${stats.totalVolume} kg`} />
      </View>
    </Card>
  );
}
