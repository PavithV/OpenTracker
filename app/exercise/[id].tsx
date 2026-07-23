import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import { History } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, View } from 'react-native';

import { getExerciseDetail, getExerciseHistory, getExercisePersonalRecord } from '@/features/exercises/api/exercises.api';
import { ExerciseDetailTabs, type ExerciseDetailTab } from '@/features/exercises/components/ExerciseDetailTabs';
import { ExerciseHistoryEntryCard } from '@/features/exercises/components/ExerciseHistoryEntryCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { capitalize } from '@/shared/utils/format';
import { useSessionStore } from '@/store/session.store';

// Seeded dataset has no "de" key -- fall back to English, then whatever language is present.
const INSTRUCTIONS_FALLBACK_LANGUAGE = 'en';

function pickInstructions(instructions: Record<string, string>): string | null {
  return instructions[INSTRUCTIONS_FALLBACK_LANGUAGE] ?? Object.values(instructions)[0] ?? null;
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSessionStore((state) => state.session);
  const [tab, setTab] = useState<ExerciseDetailTab>('summary');

  const { data: exercise, isLoading: isExerciseLoading } = useQuery({
    queryKey: ['exercises', 'detail', id],
    queryFn: () => getExerciseDetail(id),
  });

  const { data: personalRecord } = useQuery({
    queryKey: ['exercises', 'personal-record', id, session?.user.id],
    queryFn: () => getExercisePersonalRecord(session!.user.id, id),
    enabled: !!session,
  });

  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['exercises', 'history', id, session?.user.id],
    queryFn: () => getExerciseHistory(session!.user.id, id),
    enabled: !!session && tab === 'history',
  });

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
      <Typography variant="title" className="py-md" numberOfLines={2}>
        {exercise.name}
      </Typography>
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

          {personalRecord ? (
            <View className="gap-xs rounded-lg border border-border-light p-md dark:border-border-dark">
              <Typography variant="subtitle">Persönlicher Rekord</Typography>
              <Typography variant="cardTitle">{personalRecord.value} kg</Typography>
              <Typography variant="caption">{dayjs(personalRecord.achievedAt).format('DD.MM.YYYY')}</Typography>
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
            icon={History}
            title="Noch keine Historie"
            description="Diese Übung wurde noch in keinem abgeschlossenen Workout durchgeführt."
          />
        ) : (
          <FlatList
            data={history ?? []}
            keyExtractor={(item) => item.workoutId}
            contentContainerClassName="gap-sm py-md"
            renderItem={({ item }) => (
              <ExerciseHistoryEntryCard entry={item} onPress={() => router.push(`/workout/${item.workoutId}`)} />
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
