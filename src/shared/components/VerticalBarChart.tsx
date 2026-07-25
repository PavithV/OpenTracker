import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { colors } from '@/shared/theme/colors';

import { Typography } from './Typography';

export interface VerticalBarChartEntry {
  label: string;
  value: number;
}

// Same fixed-viewBox + preserveAspectRatio="none" approach as LineChart.tsx/BarChart.tsx.
const CHART_WIDTH = 300;
const CHART_HEIGHT = 120;
const BAR_WIDTH_RATIO = 0.6;

export function VerticalBarChart({ data }: { data: VerticalBarChartEntry[] }) {
  if (data.length === 0) return null;
  const maxValue = Math.max(...data.map((entry) => entry.value)) || 1;
  const slotWidth = CHART_WIDTH / data.length;
  const barWidth = slotWidth * BAR_WIDTH_RATIO;

  return (
    <View>
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none">
        {data.map((entry, index) => {
          const barHeight = (entry.value / maxValue) * CHART_HEIGHT;
          const x = index * slotWidth + (slotWidth - barWidth) / 2;
          return (
            <Rect
              key={entry.label}
              x={x}
              y={CHART_HEIGHT - barHeight}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={colors.primary.DEFAULT}
            />
          );
        })}
      </Svg>
      <View className="mt-xs flex-row">
        {data.map((entry) => (
          <View key={entry.label} className="flex-1 items-center">
            <Typography variant="caption">{entry.label}</Typography>
          </View>
        ))}
      </View>
    </View>
  );
}
