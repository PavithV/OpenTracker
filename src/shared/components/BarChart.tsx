import { useColorScheme, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { colors } from '@/shared/theme/colors';

import { Typography } from './Typography';

export interface BarChartEntry {
  label: string;
  value: number;
}

// Same fixed-viewBox + preserveAspectRatio="none" approach as LineChart.tsx -- BAR_WIDTH is
// arbitrary, only the aspect ratio math depends on it.
const BAR_WIDTH = 300;
const BAR_HEIGHT = 8;

export function BarChart({ data }: { data: BarChartEntry[] }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const trackColor = colors.border[scheme];

  if (data.length === 0) return null;
  const maxValue = Math.max(...data.map((entry) => entry.value)) || 1;

  return (
    <View className="gap-sm">
      {data.map((entry) => (
        <View key={entry.label} className="gap-xs">
          <View className="flex-row justify-between">
            <Typography variant="label">{entry.label}</Typography>
            <Typography variant="caption">{Math.round(entry.value)} kg</Typography>
          </View>
          <Svg width="100%" height={BAR_HEIGHT} viewBox={`0 0 ${BAR_WIDTH} ${BAR_HEIGHT}`} preserveAspectRatio="none">
            <Rect x={0} y={0} width={BAR_WIDTH} height={BAR_HEIGHT} rx={BAR_HEIGHT / 2} fill={trackColor} />
            <Rect
              x={0}
              y={0}
              width={(entry.value / maxValue) * BAR_WIDTH}
              height={BAR_HEIGHT}
              rx={BAR_HEIGHT / 2}
              fill={colors.primary.DEFAULT}
            />
          </Svg>
        </View>
      ))}
    </View>
  );
}
