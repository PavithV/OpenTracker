import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import { ClockCounterClockwise, Star } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, ScrollView, useColorScheme, View } from 'react-native';

import {
  addFavoriteExercise,
  getExerciseDetail,
  getExerciseHistory,
  getExercisePersonalRecords,
  getFavoriteExerciseIds,
  removeFavoriteExercise,
} from '@/features/exercises/api/exercises.api';
import { ExerciseDetailTabs, type ExerciseDetailTab } from '@/features/exercises/components/ExerciseDetailTabs';
import { ExerciseHistoryEntryCard } from '@/features/exercises/components/ExerciseHistoryEntryCard';
import { FilterChip } from '@/features/exercises/components/FilterChip';
import { EmptyState } from '@/shared/components/EmptyState';
import { LineChart } from '@/shared/components/LineChart';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';
import { capitalize } from '@/shared/utils/format';
import { useSessionStore } from '@/store/session.store';

// Seeded dataset has no "de" key -- fall back to English, then whatever language is present.
const INSTRUCTIONS_FALLBACK_LANGUAGE = 'en';

function pickInstructions(instructions: Record<string, string>): string | null {
  return instructions[INSTRUCTIONS_FALLBACK_LANGUAGE] ?? Object.values(instructions)[0] ?? null;
}

type ExerciseChartMetric = 'maxWeight' | 'sessionVolume' | 'setVolume';

const CHART_METRIC_OPTIONS: { value: ExerciseChartMetric; label: string }[] = [
  { value: 'maxWeight', label: 'Gewicht' },
  { value: 'sessionVolume', label: 'Sitzungsvolumen' },
  { value: 'setVolume', label: 'Satzvolumen' },
];

const CHART_METRIC_TITLES: Record<ExerciseChartMetric, string> = {
  maxWeight: 'Gewichtsverlauf',
  sessionVolume: 'Sitzungsvolumen',
  setVolume: 'Satzvolumen',
};

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const session = useSessionStore((state) => state.session);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ExerciseDetailTab>('summary');
  const [chartMetric, setChartMetric] = useState<ExerciseChartMetric>('maxWeight');

  const { data: exercise, isLoading: isExerciseLoading } = useQuery({
    queryKey: ['exercises', 'detail', id],
    queryFn: () => getExerciseDetail(id),
  });

  const favoritesQueryKey = ['exercises', 'favorites', session?.user.id];
  const { data: favoriteIds } = useQuery({
    queryKey: favoritesQueryKey,
    queryFn: () => getFavoriteExerciseIds(session!.user.id),
    enabled: !!session,
  });
  const isFavorited = favoriteIds?.has(id) ?? false;

  async function handleToggleFavorite() {
    if (!session) return;
    try {
      if (isFavorited) {
        await removeFavoriteExercise(session.user.id, id);
      } else {
        await addFavoriteExercise(session.user.id, id);
      }
      queryClient.invalidateQueries({ queryKey: favoritesQueryKey });
    } catch (err) {
      Alert.alert('Fehler', err instanceof Error ? err.message : 'Unbekannter Fehler');
    }
  }

  const { data: personalRecords } = useQuery({
    queryKey: ['exercises', 'personal-records', id, session?.user.id],
    queryFn: () => getExercisePersonalRecords(session!.user.id, id),
    enabled: !!session,
  });

  // Not gated to the "history" tab -- the "summary" tab's progression chart needs the same data.
  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['exercises', 'history', id, session?.user.id],
    queryFn: () => getExerciseHistory(session!.user.id, id),
    enabled: !!session,
  });

  // getExerciseHistory returns newest-first (for the history list); the chart reads left-to-right
  // chronologically, so reverse. maxWeight/sessionVolume stay one point per workout (maxWeight
  // mirrors finish_workout's own max_weight definition); setVolume flattens every set across every
  // workout into one chronological point-per-set sequence instead of collapsing back to
  // one-point-per-workout, since it's specifically about set-to-set variation within a session.
  // LineChart only ever labels the first/last point, so the longer flattened sequence stays readable.
  const chartData = useMemo(() => {
    if (!history) return [];
    const chronological = [...history].reverse();

    if (chartMetric === 'setVolume') {
      return chronological.flatMap((entry) =>
        entry.sets
          .filter((set) => set.weight !== null && set.reps !== null)
          .map((set) => ({
            label: dayjs(entry.startedAt).format('DD.MM.'),
            value: (set.weight ?? 0) * (set.reps ?? 0),
          })),
      );
    }

    return chronological
      .filter((entry) => entry.sets.some((set) => set.weight !== null))
      .map((entry) => ({
        label: dayjs(entry.startedAt).format('DD.MM.'),
        value:
          chartMetric === 'sessionVolume'
            ? entry.sets.reduce((sum, set) => sum + (set.weight ?? 0) * (set.reps ?? 0), 0)
            : Math.max(...entry.sets.map((set) => set.weight ?? 0)),
      }));
  }, [history, chartMetric]);

  if (isExerciseLoading || !exercise) {
    return (
      <Screen>
        <ActivityIndicator className="mt-md" />
      </Screen>
    );
  }

  const instructionsText = pickInstructions(exercise.instructions);
  const mediaUrl = exercise.gifUrl ?? exercise.imageUrl;

  return (
    <Screen>
      <View className="flex-row items-center gap-sm py-md">
        <Typography variant="title" className="flex-1" numberOfLines={2}>
          {exercise.name}
        </Typography>
        <Pressable onPress={handleToggleFavorite} hitSlop={8} className="active:opacity-60">
          <Star
            size={ICON_SIZE.lg}
            color={isFavorited ? colors.warning : colors.textTertiary[scheme]}
            weight={isFavorited ? 'fill' : 'regular'}
          />
        </Pressable>
      </View>
      <ExerciseDetailTabs active={tab} onChange={setTab} />

      {tab === 'summary' ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-md py-md">
          {mediaUrl ? (
            <Image
              source={{ uri: mediaUrl }}
              className="h-64 w-full rounded-lg bg-surface-light dark:bg-surface-dark"
              resizeMode="contain"
            />
          ) : null}

          <View className="gap-xs">
            <Typography variant="label">Primär: {capitalize(exercise.targetMuscle)}</Typography>
            {exercise.secondaryMuscles.length > 0 ? (
              <Typography variant="label">
                Sekundär: {exercise.secondaryMuscles.map(capitalize).join(', ')}
              </Typography>
            ) : null}
          </View>

          {personalRecords?.maxWeight || personalRecords?.estimated1Rm ? (
            <View className="flex-row gap-sm">
              {personalRecords.maxWeight ? (
                <View className="flex-1 gap-xs rounded-lg border border-border-light p-md dark:border-border-dark">
                  <Typography variant="subtitle">Persönlicher Rekord</Typography>
                  <Typography variant="cardTitle">{personalRecords.maxWeight.value} kg</Typography>
                  <Typography variant="caption">
                    {dayjs(personalRecords.maxWeight.achievedAt).format('DD.MM.YYYY')}
                  </Typography>
                </View>
              ) : null}
              {personalRecords.estimated1Rm ? (
                <View className="flex-1 gap-xs rounded-lg border border-border-light p-md dark:border-border-dark">
                  <Typography variant="subtitle">Geschätztes 1RM</Typography>
                  <Typography variant="cardTitle">{personalRecords.estimated1Rm.value} kg</Typography>
                  <Typography variant="caption">
                    {dayjs(personalRecords.estimated1Rm.achievedAt).format('DD.MM.YYYY')}
                  </Typography>
                </View>
              ) : null}
            </View>
          ) : null}

          {history && history.length > 0 ? (
            <View className="gap-xs">
              <View className="flex-row flex-wrap gap-xs">
                {CHART_METRIC_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    selected={chartMetric === option.value}
                    onPress={() => setChartMetric(option.value)}
                  />
                ))}
              </View>
              <Typography variant="label">{CHART_METRIC_TITLES[chartMetric]}</Typography>
              {chartData.length > 0 ? (
                <LineChart data={chartData} />
              ) : (
                <Typography variant="caption">Keine Daten für diese Ansicht.</Typography>
              )}
            </View>
          ) : null}

          {exercise.attribution ? (
            <Typography variant="caption" className="text-center">
              {exercise.attribution}
            </Typography>
          ) : null}
        </ScrollView>
      ) : null}

      {tab === 'history' ? (
        isHistoryLoading ? (
          <ActivityIndicator className="mt-md" />
        ) : history?.length === 0 ? (
          <EmptyState
            icon={ClockCounterClockwise}
            title="Noch keine Historie"
            description="Diese Übung wurde noch in keinem abgeschlossenen Workout durchgeführt."
          />
        ) : (
          <FlatList
            data={history ?? []}
            keyExtractor={(item) => item.workoutId}
            contentContainerClassName="gap-sm py-md"
            renderItem={({ item }) => (
              <ExerciseHistoryEntryCard
                entry={item}
                imageUrl={exercise.imageUrl}
                onPress={() => router.push(`/workout/${item.workoutId}`)}
              />
            )}
          />
        )
      ) : null}

      {tab === 'howTo' ? (
        <ScrollView className="flex-1" contentContainerClassName="py-md">
          {instructionsText ? (
            <Typography variant="body">{instructionsText}</Typography>
          ) : (
            <Typography variant="subtitle">Keine Anleitung verfügbar.</Typography>
          )}
        </ScrollView>
      ) : null}
    </Screen>
  );
}
