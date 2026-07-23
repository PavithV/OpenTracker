import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
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
        <Typography variant="title">Profil</Typography>

        <Card>
          <Typography variant="cardTitle">{profile?.display_name ?? session?.user.email}</Typography>
          <Typography variant="subtitle">{session?.user.email}</Typography>
        </Card>

        {/* TODO (Phase 2): Anzahl Workouts, Trainingsminuten, Gesamtvolumen aus `workouts` aggregieren. */}

        <Button label="Abmelden" variant="secondary" onPress={() => signOut()} />
      </View>
    </Screen>
  );
}
