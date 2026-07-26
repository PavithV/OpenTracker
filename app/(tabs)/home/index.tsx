import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Calendar, ClockCounterClockwise, WarningCircle } from 'phosphor-react-native';
import { ActivityIndicator, FlatList, Pressable, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getWorkoutHistory } from '@/features/home/api/workouts.api';
import { WorkoutHistoryCard } from '@/features/home/components/WorkoutHistoryCard';
import { ActiveWorkoutMiniBar } from '@/features/training/components/ActiveWorkoutMiniBar';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE, TAB_BAR_CLEARANCE_BASE } from '@/shared/theme/icons';
import { getErrorMessage } from '@/shared/utils/errors';
import { useSessionStore } from '@/store/session.store';

export default function HomeScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const session = useSessionStore((state) => state.session);
  const insets = useSafeAreaInsets();

  const { data: workouts, isLoading, error, refetch } = useQuery({
    queryKey: ['workouts', 'history', session?.user.id],
    queryFn: () => getWorkoutHistory(session!.user.id),
    enabled: !!session,
  });

  return (
    <Screen edges={['top', 'left', 'right']}>
      {/* The tab bar floats (`position: 'absolute'`, required for its blur background -- see
          app/(tabs)/_layout.tsx), so it no longer reserves its own layout space here. */}
      <View style={{ flex: 1, paddingBottom: TAB_BAR_CLEARANCE_BASE + insets.bottom }}>
        <View className="flex-row items-center justify-between py-md">
          <Typography variant="title">Home</Typography>
          <Pressable
            onPress={() => router.push('/calendar')}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-lg bg-surface-raised-light active:opacity-70 dark:bg-surface-raised-dark"
          >
            <Calendar size={ICON_SIZE.md} color={colors.textSecondary[scheme]} />
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator className="mt-md" />
        ) : error ? (
          <EmptyState
            icon={WarningCircle}
            title="Etwas ist schiefgelaufen"
            description={getErrorMessage(error)}
            action={{ label: 'Erneut versuchen', onPress: () => refetch() }}
          />
        ) : workouts?.length === 0 ? (
          <EmptyState
            icon={ClockCounterClockwise}
            title="Noch keine Workouts"
            description="Starte dein erstes Training im Training-Tab, um hier deinen Verlauf zu sehen."
          />
        ) : (
          <FlatList
            data={workouts ?? []}
            keyExtractor={(item) => item.id}
            contentContainerClassName="gap-sm"
            renderItem={({ item }) => (
              <WorkoutHistoryCard workout={item} onPress={() => router.push(`/workout/${item.id}`)} />
            )}
          />
        )}

        <ActiveWorkoutMiniBar />
      </View>
    </Screen>
  );
}
