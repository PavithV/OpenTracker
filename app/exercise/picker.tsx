import { useQuery } from '@tanstack/react-query';
import { FlatList, Text, View } from 'react-native';

import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { supabase } from '@/shared/lib/supabase';

export default function ExercisePickerScreen() {
  // Smoke-test für Supabase-Verbindung + Seed-Skript (Phase 1).
  // TODO (Phase 2): Suche, Filter, Mehrfachauswahl, Bilder — siehe MVP.md "Übungsauswahl".
  const { data: exercises, isLoading } = useQuery({
    queryKey: ['exercises', 'picker-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, category, target_muscle')
        .order('name')
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Screen>
      <View className="py-md">
        <Text className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Übungen</Text>
      </View>

      {!isLoading && exercises?.length === 0 ? (
        <EmptyState
          title="Keine Übungen gefunden"
          description="Führe `npm run db:seed` aus, um das Exercise-Dataset in Supabase zu importieren."
        />
      ) : (
        <FlatList
          data={exercises ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="border-b border-border-light py-sm dark:border-border-dark">
              <Text className="text-base text-text-primary-light dark:text-text-primary-dark">{item.name}</Text>
              <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {item.category} · {item.target_muscle}
              </Text>
            </View>
          )}
        />
      )}
    </Screen>
  );
}
