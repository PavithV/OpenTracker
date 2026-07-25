import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps extends PropsWithChildren {
  // Defaults to all edges -- screens with a tab bar below them (the tab bar is the bottom buffer
  // there) override this to exclude 'bottom'. Everywhere else (modals, pushed detail screens) has
  // no such buffer, so content flush against the bottom (e.g. a "beenden"/"speichern" button) must
  // respect the inset itself or Android's gesture nav bar can obscure it.
  edges?: Edge[];
}

export function Screen({ children, edges = ['top', 'left', 'right', 'bottom'] }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={edges}>
      <View className="flex-1 px-md">{children}</View>
    </SafeAreaView>
  );
}
