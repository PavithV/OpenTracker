import { useQuery } from '@tanstack/react-query';
import { SearchX } from 'lucide-react-native';
import { FlatList, View } from 'react-native';

import { EmptyState } from '@/shared/components/EmptyState';
import { ListItem } from '@/shared/components/ListItem';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
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
        <Typography variant="title">Übungen</Typography>
      </View>

      {!isLoading && exercises?.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Keine Übungen gefunden"
          description="Führe `npm run db:seed` aus, um das Exercise-Dataset in Supabase zu importieren."
        />
      ) : (
        <FlatList
          data={exercises ?? []}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View className="border-b border-border-light dark:border-border-dark" />}
          renderItem={({ item }) => <ListItem title={item.name} description={`${item.category} · ${item.target_muscle}`} />}
        />
      )}
    </Screen>
  );
}
