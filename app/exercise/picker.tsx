import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, SearchX } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getExercises } from '@/features/exercises/api/exercises.api';
import { FilterChip } from '@/features/exercises/components/FilterChip';
import { EXERCISE_CATEGORIES, EXERCISE_EQUIPMENT } from '@/features/exercises/types/exercise.types';
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
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [category, setCategory] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const addExercisesToRoutineDraft = useRoutineDraftStore((state) => state.addExercises);
  const addExercisesToWorkoutDraft = useActiveWorkoutStore((state) => state.addExercises);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['exercises', 'picker', debouncedSearch, category, equipment],
    queryFn: () =>
      getExercises({ search: debouncedSearch || undefined, category: category ?? undefined, equipment: equipment ?? undefined }),
  });

  function toggleSelected(id: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleConfirmSelection() {
    const selected = (exercises ?? [])
      .filter((exercise) => selectedIds.has(exercise.id))
      .map((exercise) => ({ id: exercise.id, name: exercise.name }));
    if (target === 'workout') {
      addExercisesToWorkoutDraft(selected);
    } else {
      addExercisesToRoutineDraft(selected);
    }
    router.back();
  }

  const hasActiveFilter = debouncedSearch.length > 0 || category !== null || equipment !== null;

  return (
    <Screen>
      <View className="gap-sm py-md">
        <Typography variant="title">Übungen</Typography>
        <Input placeholder="Übung suchen…" value={search} onChangeText={setSearch} autoCapitalize="none" />
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

      {!isLoading && exercises?.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Keine Übungen gefunden"
          description={
            hasActiveFilter
              ? 'Versuch es mit anderen Filtern oder einem anderen Suchbegriff.'
              : 'Führe `npm run db:seed` aus, um das Exercise-Dataset in Supabase zu importieren.'
          }
        />
      ) : (
        <FlatList
          data={exercises ?? []}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View className="border-b border-border-light dark:border-border-dark" />}
          renderItem={({ item }) => (
            <ListItem
              title={item.name}
              description={capitalize(item.targetMuscle)}
              leading={
                item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} className="h-12 w-12 rounded-full" />
                ) : (
                  <View className="h-12 w-12 rounded-full bg-surface-light dark:bg-surface-dark" />
                )
              }
              trailing={selectedIds.has(item.id) ? <Check size={ICON_SIZE.md} color={colors.primary.DEFAULT} /> : undefined}
              onPress={() => toggleSelected(item.id)}
            />
          )}
        />
      )}

      {selectedIds.size > 0 ? (
        <SafeAreaView
          edges={['bottom']}
          className="border-t border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark"
        >
          <View className="p-md">
            <Button
              label={`${selectedIds.size} ${selectedIds.size === 1 ? 'Übung' : 'Übungen'} hinzufügen`}
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
