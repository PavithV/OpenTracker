import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { signOut } from '@/features/auth/api/auth.api';
import { getProfile, getProfileStats } from '@/features/profile/api/profile.api';
import { ProfileStatsCard } from '@/features/profile/components/ProfileStatsCard';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { useSessionStore } from '@/store/session.store';

export default function ProfileScreen() {
  const session = useSessionStore((state) => state.session);

  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: () => getProfile(session!.user.id),
    enabled: !!session,
  });

  const { data: stats } = useQuery({
    queryKey: ['profile', 'stats', session?.user.id],
    queryFn: () => getProfileStats(session!.user.id),
    enabled: !!session,
  });

  return (
    <Screen>
      <View className="gap-lg py-md">
        <Typography variant="title">Profil</Typography>

        <Card>
          <Typography variant="cardTitle">{profile?.displayName ?? session?.user.email}</Typography>
          <Typography variant="subtitle">{session?.user.email}</Typography>
        </Card>

        {stats ? <ProfileStatsCard stats={stats} /> : null}

        <Button label="Abmelden" variant="secondary" onPress={() => signOut()} />
      </View>
    </Screen>
  );
}
