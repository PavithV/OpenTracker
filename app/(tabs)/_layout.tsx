import { Tabs } from 'expo-router';
import { Barbell, House, User } from 'phosphor-react-native';
import { useColorScheme } from 'react-native';

import { colors } from '@/shared/theme/colors';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.textSecondary[scheme],
        tabBarStyle: {
          backgroundColor: colors.surface[scheme],
          borderTopColor: colors.border[scheme],
        },
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
