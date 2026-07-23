import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';

import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { supabase } from '@/shared/lib/supabase';
import { signOut } from '@/features/auth/api/auth.api';
import { useSessionStore } from '@/store/session.store';

export default function ProfileScreen() {
  const session = useSessionStore((state) => state.session);

  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, unit_preference')
        .eq('id', session!.user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });

  return (
    <Screen>
      <View className="gap-lg py-md">
        <Text className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Profil</Text>

        <Card>
          <Text className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            {profile?.display_name ?? session?.user.email}
          </Text>
          <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {session?.user.email}
          </Text>
        </Card>

        {/* TODO (Phase 2): Anzahl Workouts, Trainingsminuten, Gesamtvolumen aus `workouts` aggregieren. */}

        <Button label="Abmelden" variant="secondary" onPress={() => signOut()} />
      </View>
    </Screen>
  );
}
