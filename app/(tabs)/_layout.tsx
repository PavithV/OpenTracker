import { Tabs } from 'expo-router';
import { Dumbbell, House, User } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

const activeColor = '#6C5CE7';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const inactiveColor = colorScheme === 'dark' ? '#9C9CA8' : '#6B6B76';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#17171C' : '#FFFFFF',
          borderTopColor: colorScheme === 'dark' ? '#2A2A31' : '#E5E5EA',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="training"
        options={{ title: 'Training', tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tabs>
  );
}
