import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, MagnifyingGlass, Star } from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, ScrollView, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  addFavoriteExercise,
  getExercises,
  getFavoriteExerciseIds,
  removeFavoriteExercise,
} from '@/features/exercises/api/exercises.api';
import { FilterChip } from '@/features/exercises/components/FilterChip';
import {
  EXERCISE_CATEGORIES,
  EXERCISE_EQUIPMENT,
  type ExerciseListItem,
} from '@/features/exercises/types/exercise.types';
import { useRoutineDraftStore } from '@/features/routines/store/routine-draft.store';
import { useActiveWorkoutStore } from '@/features/training/store/active-workout.store';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/shared/components/Input';
import { ListItem } from '@/shared/components/ListItem';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';
import { capitalize } from '@/shared/utils/format';
import { useSessionStore } from '@/store/session.store';

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}

export default function ExercisePickerScreen() {
  // Übungen für eine Routine (routine-draft.store.ts) oder ein aktives Workout
  // (active-workout.store.ts) auswählen, je nach `target`-Param.
  const { target } = useLocalSearchParams<{ target?: string }>();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const session = useSessionStore((state) => state.session);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [category, setCategory] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<Map<string, ExerciseListItem>>(new Map());
  const addExercisesToRoutineDraft = useRoutineDraftStore((state) => state.addExercises);
  const addExercisesToWorkoutDraft = useActiveWorkoutStore((state) => state.addExercises);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['exercises', 'picker', debouncedSearch, category, equipment],
    queryFn: () =>
      getExercises({ search: debouncedSearch || undefined, category: category ?? undefined, equipment: equipment ?? undefined }),
  });

  const favoritesQueryKey = ['exercises', 'favorites', session?.user.id];
  const { data: favoriteIds } = useQuery({
    queryKey: favoritesQueryKey,
    queryFn: () => getFavoriteExerciseIds(session!.user.id),
    enabled: !!session,
  });

  const visibleExercises = useMemo(() => {
    if (!favoritesOnly) return exercises ?? [];
    return (exercises ?? []).filter((exercise) => favoriteIds?.has(exercise.id));
  }, [exercises, favoritesOnly, favoriteIds]);

  async function handleToggleFavorite(exerciseId: string) {
    if (!session) return;
    const isFavorited = favoriteIds?.has(exerciseId) ?? false;
    try {
      if (isFavorited) {
        await removeFavoriteExercise(session.user.id, exerciseId);
      } else {
        await addFavoriteExercise(session.user.id, exerciseId);
      }
      queryClient.invalidateQueries({ queryKey: favoritesQueryKey });
    } catch (err) {
      Alert.alert('Fehler', err instanceof Error ? err.message : 'Unbekannter Fehler');
    }
  }

  function toggleSelected(exercise: ExerciseListItem) {
    setSelectedExercises((previous) => {
      const next = new Map(previous);
      if (next.has(exercise.id)) {
        next.delete(exercise.id);
      } else {
        next.set(exercise.id, exercise);
      }
      return next;
    });
  }

  function handleConfirmSelection() {
    const selected = Array.from(selectedExercises.values()).map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      imageUrl: exercise.imageUrl,
    }));
    if (target === 'workout') {
      addExercisesToWorkoutDraft(selected);
    } else {
      addExercisesToRoutineDraft(selected);
    }
    router.back();
  }

  const hasActiveFilter = debouncedSearch.length > 0 || category !== null || equipment !== null || favoritesOnly;

  return (
    <Screen>
      <View className="gap-sm py-md">
        <Typography variant="title">Übungen</Typography>
        <Input placeholder="Übung suchen…" value={search} onChangeText={setSearch} autoCapitalize="none" />
        <View className="flex-row">
          <FilterChip label="★ Favoriten" selected={favoritesOnly} onPress={() => setFavoritesOnly((prev) => !prev)} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-xs">
          <FilterChip label="Alle" selected={category === null} onPress={() => setCategory(null)} />
          {EXERCISE_CATEGORIES.map((value) => (
            <FilterChip
              key={value}
              label={capitalize(value)}
              selected={category === value}
              onPress={() => setCategory(category === value ? null : value)}
            />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-xs">
          <FilterChip label="Alle Geräte" selected={equipment === null} onPress={() => setEquipment(null)} />
          {EXERCISE_EQUIPMENT.map((value) => (
            <FilterChip
              key={value}
              label={capitalize(value)}
              selected={equipment === value}
              onPress={() => setEquipment(equipment === value ? null : value)}
            />
          ))}
        </ScrollView>
        <Button
          label="+ Eigene Übung erstellen"
          variant="ghost"
          size="sm"
          onPress={() =>
            router.push({ pathname: '/exercise/create', params: { target, search: debouncedSearch || undefined } })
          }
        />
      </View>

      {!isLoading && visibleExercises.length === 0 ? (
        <EmptyState
          icon={MagnifyingGlass}
          title="Keine Übungen gefunden"
          description={
            hasActiveFilter
              ? 'Versuch es mit anderen Filtern oder einem anderen Suchbegriff.'
              : 'Die Übungsdatenbank ist momentan nicht verfügbar. Versuch es später noch einmal oder erstell dir in der Zwischenzeit eine eigene Übung.'
          }
        />
      ) : (
        <FlatList
          data={visibleExercises}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View className="border-b border-border-light dark:border-border-dark" />}
          renderItem={({ item }) => (
            <ListItem
              title={item.name}
              description={capitalize(item.targetMuscle)}
              leading={
                <Pressable onPress={() => router.push(`/exercise/${item.id}`)} hitSlop={8}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} className="h-12 w-12 rounded-full" />
                  ) : (
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-light/15 dark:bg-primary-dark/15">
                      <Typography variant="label" color="accent">
                        {item.name.charAt(0).toUpperCase()}
                      </Typography>
                    </View>
                  )}
                </Pressable>
              }
              trailing={
                <View className="flex-row items-center gap-sm">
                  <Pressable onPress={() => handleToggleFavorite(item.id)} hitSlop={8} className="active:opacity-60">
                    <Star
                      size={ICON_SIZE.md}
                      color={favoriteIds?.has(item.id) ? colors.warning : colors.textTertiary[scheme]}
                      weight={favoriteIds?.has(item.id) ? 'fill' : 'regular'}
                    />
                  </Pressable>
                  {selectedExercises.has(item.id) ? <Check size={ICON_SIZE.md} color={colors.primary.DEFAULT} /> : null}
                </View>
              }
              onPress={() => toggleSelected(item)}
            />
          )}
        />
      )}

      {selectedExercises.size > 0 ? (
        <SafeAreaView
          edges={['bottom']}
          className="border-t border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark"
        >
          <View className="p-md">
            <Button
              label={`${selectedExercises.size} ${selectedExercises.size === 1 ? 'Übung' : 'Übungen'} hinzufügen`}
              onPress={handleConfirmSelection}
            />
          </View>
        </SafeAreaView>
      ) : null}

      <Typography variant="caption" className="py-sm text-center">
        Bilder &amp; Animationen: © Gym visual — https://gymvisual.com/
      </Typography>
    </Screen>
  );
}
