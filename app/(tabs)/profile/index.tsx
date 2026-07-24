import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ScrollView } from 'react-native';

import { signOut } from '@/features/auth/api/auth.api';
import { getMuscleSplit, getProfile, getProfileStats } from '@/features/profile/api/profile.api';
import { ProfileStatsCard } from '@/features/profile/components/ProfileStatsCard';
import { BarChart } from '@/shared/components/BarChart';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { capitalize } from '@/shared/utils/format';
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

  const { data: muscleSplit } = useQuery({
    queryKey: ['profile', 'muscle-split', session?.user.id],
    queryFn: () => getMuscleSplit(session!.user.id),
    enabled: !!session,
  });

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerClassName="gap-lg py-md">
        <Typography variant="title">Profil</Typography>

        <Card>
          <Typography variant="cardTitle">{profile?.displayName ?? session?.user.email}</Typography>
          <Typography variant="subtitle">{session?.user.email}</Typography>
        </Card>

        {stats ? <ProfileStatsCard stats={stats} /> : null}

        {muscleSplit && muscleSplit.length > 0 ? (
          <Card>
            <Typography variant="cardTitle" className="mb-sm">
              Muskel-Split
            </Typography>
            <BarChart
              data={muscleSplit.map((entry) => ({ label: capitalize(entry.muscle), value: entry.volume }))}
            />
          </Card>
        ) : null}

        <Button label="Rekorde ansehen" variant="secondary" onPress={() => router.push('/records')} />

        <Button label="Workout-Erinnerungen" variant="secondary" onPress={() => router.push('/reminders')} />

        <Button label="Abmelden" variant="secondary" onPress={() => signOut()} />
      </ScrollView>
    </Screen>
  );
}
