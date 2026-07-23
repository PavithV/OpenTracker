import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

export function Card({ children }: PropsWithChildren) {
  return (
    <View className="rounded-lg border border-border-light bg-surface-light p-md dark:border-border-dark dark:bg-surface-dark">
      {children}
    </View>
  );
}
