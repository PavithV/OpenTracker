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
        // previous solid `backgroundColor`. Not `position: 'absolute'`: that would let content
        // scroll under the (translucent) bar for a true overlay effect, but every tab screen's
        // `Screen` already assumes the tab bar reserves its own layout space (`edges` excludes
        // `'bottom'` specifically because "the tab bar is the bottom buffer") -- keeping normal
        // flow avoids reworking that convention across every screen for this redesign.
        tabBarStyle: {
          position: 'relative',
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
