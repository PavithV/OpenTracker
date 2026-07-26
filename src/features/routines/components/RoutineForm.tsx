import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, View } from 'react-native';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Typography } from '@/shared/components/Typography';

import { useRoutineDraftStore } from '../store/routine-draft.store';
import type { RoutineDraftExercise } from '../types/routine.types';
import { RoutineExerciseRow } from './RoutineExerciseRow';

interface RoutineFormProps {
  onSave: (name: string, notes: string, exercises: RoutineDraftExercise[]) => Promise<void>;
}

export function RoutineForm({ onSave }: RoutineFormProps) {
  const name = useRoutineDraftStore((state) => state.name);
  const notes = useRoutineDraftStore((state) => state.notes);
  const exercises = useRoutineDraftStore((state) => state.exercises);
  const setName = useRoutineDraftStore((state) => state.setName);
  const setNotes = useRoutineDraftStore((state) => state.setNotes);
  const removeExercise = useRoutineDraftStore((state) => state.removeExercise);
  const reorderExercises = useRoutineDraftStore((state) => state.reorderExercises);
  const addSet = useRoutineDraftStore((state) => state.addSet);
  const removeSet = useRoutineDraftStore((state) => state.removeSet);
  const updateSet = useRoutineDraftStore((state) => state.updateSet);
  const updateRestSeconds = useRoutineDraftStore((state) => state.updateRestSeconds);
  const reset = useRoutineDraftStore((state) => state.reset);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function moveExercise(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= exercises.length) {
      return;
    }
    const reordered = [...exercises];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    reorderExercises(reordered);
  }

  async function handleSave() {
    if (name.trim().length === 0) {
      setError('Bitte einen Namen eingeben.');
      return;
    }
    if (exercises.length === 0) {
      setError('Füge mindestens eine Übung hinzu.');
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSave(name.trim(), notes.trim(), exercises);
      reset();
      router.back();
    } catch (err) {
      Alert.alert('Speichern fehlgeschlagen', err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View className="flex-1 gap-md">
      <Input label="Name" value={name} onChangeText={setName} placeholder="z. B. Push Day" />
      <Input
        label="Notizen"
        value={notes}
        onChangeText={setNotes}
        placeholder="z. B. Fokus auf Ausführung, Tempo…"
        multiline
        numberOfLines={3}
      />

      <View className="flex-1">
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.exerciseId}
          ListEmptyComponent={<Typography variant="subtitle">Noch keine Übungen hinzugefügt.</Typography>}
          renderItem={({ item, index }) => (
            <View className="mb-sm">
              <RoutineExerciseRow
                exercise={item}
                canMoveUp={index > 0}
                canMoveDown={index < exercises.length - 1}
                onMoveUp={() => moveExercise(index, -1)}
                onMoveDown={() => moveExercise(index, 1)}
                onRemoveExercise={() => removeExercise(item.exerciseId)}
                onAddSet={() => addSet(item.exerciseId)}
                onRemoveSet={(setId) => removeSet(item.exerciseId, setId)}
                onUpdateSet={(setId, patch) => updateSet(item.exerciseId, setId, patch)}
                onUpdateRestSeconds={(restSeconds) => updateRestSeconds(item.exerciseId, restSeconds)}
              />
            </View>
          )}
        />
      </View>

      <Button label="Übungen hinzufügen" variant="secondary" onPress={() => router.push('/exercise/picker')} />

      {error ? (
        <Typography variant="subtitle" color="danger">
          {error}
        </Typography>
      ) : null}

      <Button label="Speichern" onPress={handleSave} loading={isSaving} />
    </View>
  );
}
