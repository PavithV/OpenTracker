import { router } from 'expo-router';
import { X } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, useColorScheme, View } from 'react-native';
import DraggableFlatList, { type RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

import { finishActiveWorkout } from '@/features/training/api/workouts.api';
import { ActiveWorkoutExerciseCard } from '@/features/training/components/ActiveWorkoutExerciseCard';
import {
  computeCompletedSetCount,
  computeTotalVolume,
  useActiveWorkoutHydrated,
  useActiveWorkoutStore,
} from '@/features/training/store/active-workout.store';
import type { ActiveWorkoutExercise } from '@/features/training/types/active-workout.types';
import { formatElapsed, useElapsedSeconds } from '@/features/training/utils/elapsed-time';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';
import { useSessionStore } from '@/store/session.store';

// Mirrors useElapsedSeconds but counts down from an absolute end-timestamp and calls onComplete
// once remaining hits 0 (fires at most once per endsAt value, since reaching 0 doesn't change it
// again -- only a fresh startRestTimer() call does).
function useRemainingSeconds(endsAt: string | null, onComplete: () => void): number {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!endsAt) return;
    const endMs = new Date(endsAt).getTime();

    function tick() {
      const remaining = Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining === 0) onComplete();
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt, onComplete]);

  return remainingSeconds;
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
  const restEndsAt = useActiveWorkoutStore((state) => state.restEndsAt);
  const start = useActiveWorkoutStore((state) => state.start);
  const setName = useActiveWorkoutStore((state) => state.setName);
  const setNotes = useActiveWorkoutStore((state) => state.setNotes);
  const updateExerciseNotes = useActiveWorkoutStore((state) => state.updateExerciseNotes);
  const removeExercise = useActiveWorkoutStore((state) => state.removeExercise);
  const reorderExercises = useActiveWorkoutStore((state) => state.reorderExercises);
  const addSet = useActiveWorkoutStore((state) => state.addSet);
  const updateSet = useActiveWorkoutStore((state) => state.updateSet);
  const toggleSetCompleted = useActiveWorkoutStore((state) => state.toggleSetCompleted);
  const removeSet = useActiveWorkoutStore((state) => state.removeSet);
  const startRestTimer = useActiveWorkoutStore((state) => state.startRestTimer);
  const clearRestTimer = useActiveWorkoutStore((state) => state.clearRestTimer);
  const reset = useActiveWorkoutStore((state) => state.reset);

  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    if (hasHydrated) start();
  }, [hasHydrated, start]);

  const elapsedSeconds = useElapsedSeconds(startedAt);
  const remainingRestSeconds = useRemainingSeconds(restEndsAt, clearRestTimer);
  const totalVolume = computeTotalVolume(exercises);
  const completedSets = computeCompletedSetCount(exercises);

  // Only the false->true transition should start a rest timer -- un-completing a set (tapping it
  // again) must not also fire one.
  function handleToggleSetCompleted(exercise: ActiveWorkoutExercise, setId: string) {
    const targetSet = exercise.sets.find((workoutSet) => workoutSet.id === setId);
    const willComplete = targetSet ? !targetSet.completed : false;
    toggleSetCompleted(exercise.exerciseId, setId);
    if (willComplete && exercise.restSeconds) {
      startRestTimer(exercise.restSeconds);
    }
  }

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

      {restEndsAt ? (
        <View className="mb-md flex-row items-center justify-between rounded-md bg-surface-light px-md py-sm dark:bg-surface-dark">
          <View>
            <Typography variant="caption">Pause</Typography>
            <Typography variant="cardTitle">{formatElapsed(remainingRestSeconds)}</Typography>
          </View>
          <Button label="Überspringen" variant="ghost" size="sm" onPress={clearRestTimer} />
        </View>
      ) : null}

      <Input value={name} onChangeText={setName} placeholder="Workout-Name" />
      <Input value={notes} onChangeText={setNotes} placeholder="Notizen zum Workout…" multiline numberOfLines={2} />

      <View className="mt-sm flex-1">
        <DraggableFlatList
          data={exercises}
          keyExtractor={(item) => item.exerciseId}
          onDragEnd={({ data }) => reorderExercises(data)}
          ListEmptyComponent={<Typography variant="subtitle">Noch keine Übungen hinzugefügt.</Typography>}
          renderItem={({ item, drag, isActive }: RenderItemParams<ActiveWorkoutExercise>) => (
            <ScaleDecorator>
              <View className="mb-sm">
                <ActiveWorkoutExerciseCard
                  exercise={item}
                  drag={drag}
                  isActive={isActive}
                  onRemoveExercise={() => removeExercise(item.exerciseId)}
                  onAddSet={() => addSet(item.exerciseId)}
                  onUpdateSet={(setId, patch) => updateSet(item.exerciseId, setId, patch)}
                  onToggleSetCompleted={(setId) => handleToggleSetCompleted(item, setId)}
                  onRemoveSet={(setId) => removeSet(item.exerciseId, setId)}
                  onUpdateNotes={(notesValue) => updateExerciseNotes(item.exerciseId, notesValue)}
                  onOpenPlateCalculator={(weight) =>
                    router.push({
                      pathname: '/plate-calculator',
                      params: { weight: weight !== null ? String(weight) : undefined },
                    })
                  }
                />
              </View>
            </ScaleDecorator>
          )}
        />
      </View>

      <Button
        label="Übung hinzufügen"
        variant="secondary"
        onPress={() => router.push('/exercise/picker?target=workout')}
      />
      <Button label="Workout beenden" onPress={handleFinishWorkout} loading={isFinishing} />
    </Screen>
  );
}
