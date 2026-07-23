import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-md">{children}</View>
    </SafeAreaView>
  );
}
