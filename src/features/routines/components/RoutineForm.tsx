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
  onSave: (name: string, exercises: RoutineDraftExercise[]) => Promise<void>;
}

export function RoutineForm({ onSave }: RoutineFormProps) {
  const name = useRoutineDraftStore((state) => state.name);
  const exercises = useRoutineDraftStore((state) => state.exercises);
  const setName = useRoutineDraftStore((state) => state.setName);
  const removeExercise = useRoutineDraftStore((state) => state.removeExercise);
  const moveExercise = useRoutineDraftStore((state) => state.moveExercise);
  const updateTarget = useRoutineDraftStore((state) => state.updateTarget);
  const reset = useRoutineDraftStore((state) => state.reset);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await onSave(name.trim(), exercises);
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

      <FlatList
        className="flex-1"
        data={exercises}
        keyExtractor={(item) => item.exerciseId}
        contentContainerClassName="gap-sm"
        ListEmptyComponent={<Typography variant="subtitle">Noch keine Übungen hinzugefügt.</Typography>}
        renderItem={({ item, index }) => (
          <RoutineExerciseRow
            exercise={item}
            isFirst={index === 0}
            isLast={index === exercises.length - 1}
            onMoveUp={() => moveExercise(item.exerciseId, 'up')}
            onMoveDown={() => moveExercise(item.exerciseId, 'down')}
            onRemove={() => removeExercise(item.exerciseId)}
            onUpdateTarget={(patch) => updateTarget(item.exerciseId, patch)}
          />
        )}
      />

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
