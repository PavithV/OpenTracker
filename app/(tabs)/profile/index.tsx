import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { signOut } from '@/features/auth/api/auth.api';
import { getProfile, getProfileStats } from '@/features/profile/api/profile.api';
import { ProfileStatsCard } from '@/features/profile/components/ProfileStatsCard';
import { ProfileVolumeChart } from '@/features/profile/components/ProfileVolumeChart';
import { ActiveWorkoutMiniBar } from '@/features/training/components/ActiveWorkoutMiniBar';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { useSessionStore } from '@/store/session.store';

// "Jordan Diaz" -> "JD"; falls back to the first two letters of the email's local part when
// there's no display name (mirrors the mockup's avatar-circle initials).
function getInitials(displayName: string | null | undefined, email: string | undefined): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }
  return (email ?? '').slice(0, 2).toUpperCase();
}

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
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1" contentContainerClassName="gap-lg py-md">
        <Typography variant="title">Profil</Typography>

        <Card>
          <View className="flex-row items-center gap-md">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-light/15 dark:bg-primary-dark/15">
              <Typography variant="cardTitle" color="accent">
                {getInitials(profile?.displayName, session?.user.email)}
              </Typography>
            </View>
            <View>
              <Typography variant="cardTitle">{profile?.displayName ?? session?.user.email}</Typography>
              <Typography variant="subtitle">{session?.user.email}</Typography>
            </View>
          </View>
        </Card>

        {stats ? <ProfileStatsCard stats={stats} /> : null}

        {session ? <ProfileVolumeChart userId={session.user.id} /> : null}

        <View className="gap-sm">
          <Button label="Rekorde ansehen" variant="secondary" onPress={() => router.push('/records')} />

          <Button label="Workout-Erinnerungen" variant="secondary" onPress={() => router.push('/reminders')} />

          <Button label="Abmelden" variant="ghost" color="danger" onPress={() => signOut()} />
        </View>
      </ScrollView>

      <ActiveWorkoutMiniBar />
    </Screen>
  );
}
