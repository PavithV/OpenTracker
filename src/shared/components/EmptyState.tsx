import type { ComponentType } from 'react';
import { Text, useColorScheme, View } from 'react-native';

import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ size?: number; color?: string }>;
}

export function EmptyState({ title, description, icon: Icon }: EmptyStateProps) {
  const scheme = useColorScheme();
  const iconColor = scheme === 'dark' ? colors.textTertiary.dark : colors.textTertiary.light;

  return (
    <View className="flex-1 items-center justify-center gap-xs px-lg">
      {Icon ? <Icon size={ICON_SIZE.lg + 8} color={iconColor} /> : null}
      <Text className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">{title}</Text>
      {description ? (
        <Text className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
          {description}
        </Text>
      ) : null}
    </View>
  );
}
