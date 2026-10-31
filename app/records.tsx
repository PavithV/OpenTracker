import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Trophy, WarningCircle } from 'phosphor-react-native';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { getPersonalRecords } from '@/features/records/api/records.api';
import { isRecentRecord } from '@/features/records/utils/recent-record';
import { EmptyState } from '@/shared/components/EmptyState';
import { ListItem } from '@/shared/components/ListItem';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { usePullToRefresh } from '@/shared/lib/use-pull-to-refresh';
import { getErrorMessage } from '@/shared/utils/errors';
import { formatWeight } from '@/shared/utils/units';
import { useSessionStore } from '@/store/session.store';
import { useUnitPreferenceStore } from '@/store/unit-preference.store';

export default function RecordsScreen() {
  const session = useSessionStore((state) => state.session);
  const unit = useUnitPreferenceStore((state) => state.unitPreference);

  const { data: records, isLoading, error, refetch } = useQuery({
    queryKey: ['records', session?.user.id],
    queryFn: () => getPersonalRecords(session!.user.id),
    enabled: !!session,
  });
  const pullToRefresh = usePullToRefresh(refetch);

  return (
    <Screen>
      <View className="py-md">
        <Typography variant="title">Rekorde</Typography>
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
      ) : records?.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Noch keine Rekorde"
          description="Schließe ein Workout mit erfassten Sätzen ab, um hier deine persönlichen Rekorde zu sehen."
        />
      ) : (
        <FlatList
          data={records ?? []}
          keyExtractor={(item) => item.exerciseId}
          {...pullToRefresh}
          ItemSeparatorComponent={() => <View className="border-b border-border-light dark:border-border-dark" />}
          renderItem={({ item }) => (
            <ListItem
              title={item.exerciseName}
              description={[
                item.maxWeight !== null ? `Bestes Gewicht: ${formatWeight(item.maxWeight, unit)}` : null,
                item.estimated1Rm !== null ? `Geschätztes 1RM: ${formatWeight(item.estimated1Rm, unit)}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              trailing={
                isRecentRecord(item.achievedAt) ? (
                  <View
                    className="rounded-full bg-primary-light/15 px-sm py-xs dark:bg-primary-dark/15"
                    accessibilityLabel="Neuer Rekord in den letzten 7 Tagen"
                  >
                    <Typography variant="label" color="accent">
                      Neu
                    </Typography>
                  </View>
                ) : null
              }
              onPress={() => router.push(`/exercise/${item.exerciseId}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}
