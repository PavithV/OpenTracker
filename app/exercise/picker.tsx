import { useQuery } from '@tanstack/react-query';
import { Check, SearchX } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, View } from 'react-native';

import { getExercises } from '@/features/exercises/api/exercises.api';
import { FilterChip } from '@/features/exercises/components/FilterChip';
import { EXERCISE_CATEGORIES, EXERCISE_EQUIPMENT } from '@/features/exercises/types/exercise.types';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/shared/components/Input';
import { ListItem } from '@/shared/components/ListItem';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';

function capitalize(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);
  return debounced;
}

export default function ExercisePickerScreen() {
  // TODO (Phase 2): Auswahl an `routine/create.tsx` übergeben, sobald das gebaut ist —
  // aktuell nur lokaler Auswahlzustand ohne Ziel-Screen.
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [category, setCategory] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
        {selectedIds.size > 0 ? (
          <Typography variant="subtitle">
            {selectedIds.size} {selectedIds.size === 1 ? 'Übung ausgewählt' : 'Übungen ausgewählt'}
          </Typography>
        ) : null}
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
                  <Image source={{ uri: item.imageUrl }} className="h-12 w-12 rounded-md" />
                ) : (
                  <View className="h-12 w-12 rounded-md bg-surface-light dark:bg-surface-dark" />
                )
              }
              trailing={selectedIds.has(item.id) ? <Check size={ICON_SIZE.md} color={colors.primary.DEFAULT} /> : undefined}
              onPress={() => toggleSelected(item.id)}
            />
          )}
        />
      )}

      <Typography variant="caption" className="py-sm text-center">
        Bilder &amp; Animationen: © Gym visual — https://gymvisual.com/
      </Typography>
    </Screen>
  );
}
