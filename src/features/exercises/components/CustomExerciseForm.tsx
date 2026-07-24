import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Typography } from '@/shared/components/Typography';
import { capitalize } from '@/shared/utils/format';

import { EXERCISE_CATEGORIES, EXERCISE_EQUIPMENT } from '../types/exercise.types';
import type { CreateCustomExerciseInput } from '../types/exercise.types';
import { FilterChip } from './FilterChip';

interface CustomExerciseFormProps {
  initialName?: string;
  onSave: (input: CreateCustomExerciseInput) => Promise<void>;
}

export function CustomExerciseForm({ initialName = '', onSave }: CustomExerciseFormProps) {
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [targetMuscle, setTargetMuscle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (name.trim().length === 0) {
      setError('Bitte einen Namen eingeben.');
      return;
    }
    if (!category) {
      setError('Bitte eine Kategorie auswählen.');
      return;
    }
    if (!equipment) {
      setError('Bitte ein Gerät auswählen.');
      return;
    }
    if (targetMuscle.trim().length === 0) {
      setError('Bitte eine Zielmuskelgruppe eingeben.');
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        equipment,
        targetMuscle: targetMuscle.trim(),
        imageUrl: imageUrl.trim() || null,
      });
    } catch (err) {
      Alert.alert('Speichern fehlgeschlagen', err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView contentContainerClassName="gap-md pb-lg">
      <Input label="Name" value={name} onChangeText={setName} placeholder="z. B. Kabelzug einarmig" />

      <View className="gap-xs">
        <Typography variant="label">Kategorie</Typography>
        <View className="flex-row flex-wrap gap-xs">
          {EXERCISE_CATEGORIES.map((value) => (
            <FilterChip
              key={value}
              label={capitalize(value)}
              selected={category === value}
              onPress={() => setCategory(value)}
            />
          ))}
        </View>
      </View>

      <View className="gap-xs">
        <Typography variant="label">Gerät</Typography>
        <View className="flex-row flex-wrap gap-xs">
          {EXERCISE_EQUIPMENT.map((value) => (
            <FilterChip
              key={value}
              label={capitalize(value)}
              selected={equipment === value}
              onPress={() => setEquipment(value)}
            />
          ))}
        </View>
      </View>

      <Input
        label="Zielmuskelgruppe"
        value={targetMuscle}
        onChangeText={setTargetMuscle}
        placeholder="z. B. biceps"
        autoCapitalize="none"
      />
      <Input
        label="Bild-URL (optional)"
        value={imageUrl}
        onChangeText={setImageUrl}
        placeholder="https://…"
        autoCapitalize="none"
        keyboardType="url"
      />

      {error ? (
        <Typography variant="subtitle" color="danger">
          {error}
        </Typography>
      ) : null}

      <Button label="Übung erstellen" onPress={handleSave} loading={isSaving} />
    </ScrollView>
  );
}
