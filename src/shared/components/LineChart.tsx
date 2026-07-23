import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/shared/theme/colors';

import { Typography } from './Typography';

export interface LineChartPoint {
  label: string;
  value: number;
}

// Fixed logical coordinate system -- Svg's width="100%" + preserveAspectRatio="none" stretches
// this to the container's actual width, so CHART_WIDTH itself is arbitrary (only the aspect
// ratio math below depends on it).
const CHART_WIDTH = 300;
const CHART_HEIGHT = 120;
const PADDING = 12;

function buildPath(points: { x: number; y: number }[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
}

export function LineChart({ data }: { data: LineChartPoint[] }) {
  if (data.length === 0) return null;

  const values = data.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  const points = data.map((point, index) => ({
    x: data.length === 1 ? CHART_WIDTH / 2 : PADDING + (index / (data.length - 1)) * (CHART_WIDTH - PADDING * 2),
    y: PADDING + (1 - (point.value - minValue) / valueRange) * (CHART_HEIGHT - PADDING * 2),
  }));

  return (
    <View>
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none">
        {points.length > 1 ? (
          <Path d={buildPath(points)} stroke={colors.primary.DEFAULT} strokeWidth={2} fill="none" />
        ) : null}
        {points.map((point, index) => (
          <Circle key={index} cx={point.x} cy={point.y} r={3} fill={colors.primary.DEFAULT} />
        ))}
      </Svg>
      <View className="mt-xs flex-row justify-between">
        <Typography variant="caption">{data[0].label}</Typography>
        {data.length > 1 ? <Typography variant="caption">{data[data.length - 1].label}</Typography> : null}
      </View>
    </View>
  );
}
