import type { ComponentType } from 'react';
import { Text, useColorScheme, View } from 'react-native';

import { Button } from '@/shared/components/Button';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ size?: number; color?: string }>;
  // Top-aligned instead of centered in the full remaining space -- for empty states that sit
  // below other content (e.g. calendar day selection) rather than owning the whole screen.
  compact?: boolean;
  // Optional retry affordance -- reused for query-error states (e.g. "Erneut versuchen" ->
  // refetch()) alongside genuine empty states, so a fetch failure doesn't read as silent "no data".
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ title, description, icon: Icon, compact = false, action }: EmptyStateProps) {
  const scheme = useColorScheme();
  const iconColor = scheme === 'dark' ? colors.textTertiary.dark : colors.textTertiary.light;

  return (
    <View
      className={compact ? 'items-center gap-xs px-lg' : 'flex-1 items-center justify-center gap-xs px-lg'}
    >
      {Icon ? <Icon size={ICON_SIZE.lg + 8} color={iconColor} /> : null}
      <Text className="text-lg font-sans-medium text-text-primary-light dark:text-text-primary-dark">{title}</Text>
      {description ? (
        <Text className="text-center text-sm font-sans text-text-secondary-light dark:text-text-secondary-dark">
          {description}
        </Text>
      ) : null}
      {action ? (
        <View className="mt-xs">
          <Button label={action.label} onPress={action.onPress} variant="secondary" size="sm" />
        </View>
      ) : null}
    </View>
  );
}
