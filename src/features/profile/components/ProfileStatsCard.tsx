import { View } from 'react-native';

import { Card } from '@/shared/components/Card';
import { Typography } from '@/shared/components/Typography';
import { formatDuration } from '@/shared/utils/format';

import type { ProfileStats } from '../types/profile.types';

// Three separate tiles in a row (mockup's `statTiles` grid), not one card with three columns --
// each tile is its own small `Card` so it gets the same surface/shadow as everywhere else.
function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <View className="items-center gap-xs">
        <Typography variant="cardTitle">{value}</Typography>
        <Typography variant="caption">{label}</Typography>
      </View>
    </Card>
  );
}

export function ProfileStatsCard({ stats }: { stats: ProfileStats }) {
  return (
    <View className="flex-row gap-sm">
      <View className="flex-1">
        <StatTile label="Workouts" value={String(stats.workoutCount)} />
      </View>
      <View className="flex-1">
        <StatTile label="Trainingszeit" value={formatDuration(stats.totalDurationSeconds)} />
      </View>
      <View className="flex-1">
        <StatTile label="Volumen" value={`${stats.totalVolume} kg`} />
      </View>
    </View>
  );
}
