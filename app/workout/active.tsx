import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, useColorScheme, View } from 'react-native';

import { finishActiveWorkout } from '@/features/training/api/workouts.api';
import { ActiveWorkoutExerciseCard } from '@/features/training/components/ActiveWorkoutExerciseCard';
import {
  computeCompletedSetCount,
  computeTotalVolume,
  useActiveWorkoutHydrated,
  useActiveWorkoutStore,
} from '@/features/training/store/active-workout.store';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';
import { useSessionStore } from '@/store/session.store';

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
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const session = useSessionStore((state) => state.session);
  const hasHydrated = useActiveWorkoutHydrated();
  const startedAt = useActiveWorkoutStore((state) => state.startedAt);
  const name = useActiveWorkoutStore((state) => state.name);
  const notes = useActiveWorkoutStore((state) => state.notes);
  const routineId = useActiveWorkoutStore((state) => state.routineId);
  const exercises = useActiveWorkoutStore((state) => state.exercises);
  const start = useActiveWorkoutStore((state) => state.start);
  const setName = useActiveWorkoutStore((state) => state.setName);
  const setNotes = useActiveWorkoutStore((state) => state.setNotes);
  const updateExerciseNotes = useActiveWorkoutStore((state) => state.updateExerciseNotes);
  const removeExercise = useActiveWorkoutStore((state) => state.removeExercise);
  const addSet = useActiveWorkoutStore((state) => state.addSet);
  const updateSet = useActiveWorkoutStore((state) => state.updateSet);
  const toggleSetCompleted = useActiveWorkoutStore((state) => state.toggleSetCompleted);
  const removeSet = useActiveWorkoutStore((state) => state.removeSet);
  const reset = useActiveWorkoutStore((state) => state.reset);

  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    if (hasHydrated) start();
  }, [hasHydrated, start]);

  const elapsedSeconds = useElapsedSeconds(startedAt);
  const totalVolume = computeTotalVolume(exercises);
  const completedSets = computeCompletedSetCount(exercises);

  async function handleFinishWorkout() {
    if (exercises.length === 0) {
      Alert.alert('Keine Übungen', 'Füge mindestens eine Übung hinzu, bevor du das Workout beendest.');
      return;
    }

    setIsFinishing(true);
    try {
      await finishActiveWorkout(session!.user.id, {
        name: name.trim() || 'Workout',
        notes,
        startedAt: startedAt!,
        routineId,
        exercises,
      });
      reset();
      router.replace('/(tabs)/home');
    } catch (err) {
      Alert.alert('Speichern fehlgeschlagen', err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsFinishing(false);
    }
  }

  if (!hasHydrated) {
    return <Screen />;
  }

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
      <Input value={notes} onChangeText={setNotes} placeholder="Notizen zum Workout…" multiline numberOfLines={2} />

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
            onUpdateNotes={(notesValue) => updateExerciseNotes(item.exerciseId, notesValue)}
          />
        )}
      />

      <Button
        label="Übung hinzufügen"
        variant="secondary"
        onPress={() => router.push('/exercise/picker?target=workout')}
      />
      <Button label="Workout beenden" onPress={handleFinishWorkout} loading={isFinishing} />
    </Screen>
  );
}
