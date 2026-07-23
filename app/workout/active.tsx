import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, useColorScheme, View } from 'react-native';

import { ActiveWorkoutExerciseCard } from '@/features/training/components/ActiveWorkoutExerciseCard';
import {
  computeCompletedSetCount,
  computeTotalVolume,
  useActiveWorkoutStore,
} from '@/features/training/store/active-workout.store';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';

function useElapsedSeconds(startedAt: string | null): number {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const startMs = new Date(startedAt).getTime();

    function tick() {
      setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsedSeconds;
}

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export default function ActiveWorkoutScreen() {
  // TODO (Phase 2, Punkt 5): "Workout beenden" -> workouts/workout_exercises/sets nach Supabase
  // syncen und finish_workout-RPC aufrufen. Bis dahin lebt der Workout-Zustand rein lokal
  // (AsyncStorage-gespiegelt über active-workout.store.ts), siehe ARCHITECTURE.md.
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const startedAt = useActiveWorkoutStore((state) => state.startedAt);
  const name = useActiveWorkoutStore((state) => state.name);
  const exercises = useActiveWorkoutStore((state) => state.exercises);
  const start = useActiveWorkoutStore((state) => state.start);
  const setName = useActiveWorkoutStore((state) => state.setName);
  const removeExercise = useActiveWorkoutStore((state) => state.removeExercise);
  const addSet = useActiveWorkoutStore((state) => state.addSet);
  const updateSet = useActiveWorkoutStore((state) => state.updateSet);
  const toggleSetCompleted = useActiveWorkoutStore((state) => state.toggleSetCompleted);
  const removeSet = useActiveWorkoutStore((state) => state.removeSet);

  useEffect(() => {
    start();
  }, [start]);

  const elapsedSeconds = useElapsedSeconds(startedAt);
  const totalVolume = computeTotalVolume(exercises);
  const completedSets = computeCompletedSetCount(exercises);

  return (
    <Screen>
      <View className="flex-row items-center justify-between py-md">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={ICON_SIZE.lg} color={colors.textPrimary[scheme]} />
        </Pressable>
        <Typography variant="title">{formatElapsed(elapsedSeconds)}</Typography>
        <View style={{ width: ICON_SIZE.lg }} />
      </View>

      <View className="flex-row justify-around pb-md">
        <View className="items-center">
          <Typography variant="caption">Volumen</Typography>
          <Typography variant="cardTitle">{totalVolume} kg</Typography>
        </View>
        <View className="items-center">
          <Typography variant="caption">Sätze</Typography>
          <Typography variant="cardTitle">{completedSets}</Typography>
        </View>
      </View>

      <Input value={name} onChangeText={setName} placeholder="Workout-Name" />

      <FlatList
        className="mt-sm flex-1"
        data={exercises}
        keyExtractor={(item) => item.exerciseId}
        contentContainerClassName="gap-sm"
        ListEmptyComponent={<Typography variant="subtitle">Noch keine Übungen hinzugefügt.</Typography>}
        renderItem={({ item }) => (
          <ActiveWorkoutExerciseCard
            exercise={item}
            onRemoveExercise={() => removeExercise(item.exerciseId)}
            onAddSet={() => addSet(item.exerciseId)}
            onUpdateSet={(setId, patch) => updateSet(item.exerciseId, setId, patch)}
            onToggleSetCompleted={(setId) => toggleSetCompleted(item.exerciseId, setId)}
            onRemoveSet={(setId) => removeSet(item.exerciseId, setId)}
          />
        )}
      />

      <Button
        label="Übung hinzufügen"
        variant="secondary"
        onPress={() => router.push('/exercise/picker?target=workout')}
      />
      <Button label="Workout beenden" onPress={() => {}} disabled />
    </Screen>
  );
}
