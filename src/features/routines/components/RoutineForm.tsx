import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import DraggableFlatList, { type RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import Animated, { LinearTransition } from 'react-native-reanimated';

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
  const [isDragging, setIsDragging] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

  function renderItem({ item, drag, getIndex }: RenderItemParams<RoutineDraftExercise>) {
    const rowIndex = getIndex();
    // Every row except the one being dragged compacts. The resulting height change is animated
    // via `layout` below (and via entering/exiting inside RoutineExerciseRow), so rows -- including
    // the dragged one -- glide to their new resting position instead of snapping there.
    const isCompact = isDragging && activeIndex !== null && rowIndex !== undefined && rowIndex !== activeIndex;
    return (
      <ScaleDecorator>
        <Animated.View layout={LinearTransition.duration(200)}>
          <View className="mb-sm">
            <RoutineExerciseRow
              exercise={item}
              drag={drag}
              isCompact={isCompact}
              onRemoveExercise={() => removeExercise(item.exerciseId)}
              onAddSet={() => addSet(item.exerciseId)}
              onRemoveSet={(setId) => removeSet(item.exerciseId, setId)}
              onUpdateSet={(setId, patch) => updateSet(item.exerciseId, setId, patch)}
              onUpdateRestSeconds={(restSeconds) => updateRestSeconds(item.exerciseId, restSeconds)}
            />
          </View>
        </Animated.View>
      </ScaleDecorator>
    );
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
        <DraggableFlatList
          data={exercises}
          keyExtractor={(item) => item.exerciseId}
          onDragBegin={(index) => {
            setIsDragging(true);
            setActiveIndex(index);
          }}
          onDragEnd={({ data }) => {
            setIsDragging(false);
            setActiveIndex(null);
            reorderExercises(data);
          }}
          ListEmptyComponent={<Typography variant="subtitle">Noch keine Übungen hinzugefügt.</Typography>}
          renderItem={renderItem}
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
