import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { WarningCircle } from 'phosphor-react-native';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deleteAccount, signOut } from '@/features/auth/api/auth.api';
import { FilterChip } from '@/features/exercises/components/FilterChip';
import { getProfile, getProfileStats } from '@/features/profile/api/profile.api';
import { ProfileStatsCard } from '@/features/profile/components/ProfileStatsCard';
import { ProfileVolumeChart } from '@/features/profile/components/ProfileVolumeChart';
import { ActiveWorkoutMiniBar } from '@/features/training/components/ActiveWorkoutMiniBar';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { TAB_BAR_CLEARANCE_BASE } from '@/shared/theme/icons';
import { getErrorMessage } from '@/shared/utils/errors';
import { useSessionStore } from '@/store/session.store';
import { type ThemePreference, useThemeStore } from '@/store/theme.store';

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

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
];

export default function ProfileScreen() {
  const session = useSessionStore((state) => state.session);
  const insets = useSafeAreaInsets();
  const themePreference = useThemeStore((state) => state.preference);
  const setThemePreference = useThemeStore((state) => state.setPreference);

  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: () => getProfile(session!.user.id),
    enabled: !!session,
  });

  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['profile', 'stats', session?.user.id],
    queryFn: () => getProfileStats(session!.user.id),
    enabled: !!session,
  });

  const isLoading = isProfileLoading || isStatsLoading;
  const error = profileError ?? statsError;

  function handleDeleteAccount() {
    Alert.alert(
      'Konto löschen?',
      'Dein Konto und alle zugehörigen Daten werden unwiderruflich gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (err) {
              Alert.alert('Löschen fehlgeschlagen', err instanceof Error ? err.message : 'Unbekannter Fehler');
            }
          },
        },
      ],
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      {/* The tab bar floats (`position: 'absolute'`, required for its blur background -- see
          app/(tabs)/_layout.tsx), so it no longer reserves its own layout space here. */}
      <View style={{ flex: 1, paddingBottom: TAB_BAR_CLEARANCE_BASE + insets.bottom }}>
        <ScrollView className="flex-1" contentContainerClassName="gap-lg py-md">
          <Typography variant="title">Profil</Typography>

          {isLoading ? (
            <ActivityIndicator className="mt-md" />
          ) : error ? (
            <EmptyState
              icon={WarningCircle}
              title="Etwas ist schiefgelaufen"
              description={getErrorMessage(error)}
              action={{
                label: 'Erneut versuchen',
                onPress: () => {
                  refetchProfile();
                  refetchStats();
                },
              }}
            />
          ) : (
            <>
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
            </>
          )}

          {session ? <ProfileVolumeChart userId={session.user.id} /> : null}

          <Card>
            <Typography variant="label" className="mb-sm">
              Erscheinungsbild
            </Typography>
            <View className="flex-row gap-xs">
              {THEME_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  selected={themePreference === option.value}
                  onPress={() => setThemePreference(option.value)}
                />
              ))}
            </View>
          </Card>

          <View className="gap-sm">
            <Button label="Rekorde ansehen" variant="secondary" onPress={() => router.push('/records')} />

            <Button label="Workout-Erinnerungen" variant="secondary" onPress={() => router.push('/reminders')} />

            <Button label="Abmelden" variant="ghost" color="danger" onPress={() => signOut()} />

            <Button label="Konto löschen" variant="ghost" color="danger" onPress={handleDeleteAccount} />
          </View>
        </ScrollView>

        <ActiveWorkoutMiniBar />
      </View>
    </Screen>
  );
}
