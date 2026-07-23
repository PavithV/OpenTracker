import { Text, View } from 'react-native';

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-xs px-lg">
      <Text className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">{title}</Text>
      {description ? (
        <Text className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
          {description}
        </Text>
      ) : null}
    </View>
  );
}
