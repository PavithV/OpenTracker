import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Barbell, House, User } from 'phosphor-react-native';
import { StyleSheet, useColorScheme } from 'react-native';

import { colors } from '@/shared/theme/colors';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[scheme],
        tabBarInactiveTintColor: colors.textTertiary[scheme],
        // Mockup's bottom tab bar is a `backdrop-filter: blur(20px) saturate(180%)` glass
        // surface -- `tabBarBackground` renders the blur behind a transparent bar instead of the
        // previous solid `backgroundColor`. `position: 'absolute'` is required here (see Expo
        // Router's Tabs docs: "When using BlurView, make sure to set position: 'absolute' in
        // tabBarStyle as well") -- omitting it crashed the app on load. Pulling the bar out of
        // layout flow means each tab screen now pads its own bottom content by
        // `TAB_BAR_CLEARANCE_BASE` (+ safe-area inset) so nothing renders underneath it.
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopColor: colors.border[scheme],
        },
        tabBarBackground: () => (
          <BlurView intensity={80} tint={scheme} style={StyleSheet.absoluteFill} />
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <House color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: 'Training',
          tabBarIcon: ({ color, size }) => <Barbell color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <User color={color as string} size={size} /> }}
      />
    </Tabs>
  );
}
