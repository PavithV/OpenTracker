import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { FilterChip } from '@/features/exercises/components/FilterChip';
import { BAR_TYPES, calculatePlateLoadout } from '@/features/training/utils/plate-calculator';
import { Card } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';

function toNumberOrNull(text: string): number | null {
  if (text === '') return null;
  const value = Number(text);
  return Number.isNaN(value) ? null : value;
}

export default function PlateCalculatorScreen() {
  const { weight } = useLocalSearchParams<{ weight?: string }>();
  const [targetWeightText, setTargetWeightText] = useState(weight ?? '');
  const [barTypeId, setBarTypeId] = useState(BAR_TYPES[0].id);

  const barType = BAR_TYPES.find((bar) => bar.id === barTypeId) ?? BAR_TYPES[0];
  const targetWeight = toNumberOrNull(targetWeightText);

  const loadout = useMemo(
    () => (targetWeight !== null && targetWeight > 0 ? calculatePlateLoadout(targetWeight, barType.weightKg) : null),
    [targetWeight, barType.weightKg],
  );

  return (
    <Screen>
      <Typography variant="title" className="py-md">
        Plattenrechner
      </Typography>

      <Input
        label="Zielgewicht (kg)"
        keyboardType="numeric"
        value={targetWeightText}
        onChangeText={setTargetWeightText}
        placeholder="z. B. 100"
      />

      <View className="mt-md gap-xs">
        <Typography variant="label">Stange</Typography>
        <View className="flex-row flex-wrap gap-xs">
          {BAR_TYPES.map((bar) => (
            <FilterChip
              key={bar.id}
              label={bar.label}
              selected={barTypeId === bar.id}
              onPress={() => setBarTypeId(bar.id)}
            />
          ))}
        </View>
      </View>

      <ScrollView className="mt-md flex-1" contentContainerClassName="gap-sm">
        {loadout ? (
          <Card>
            <Typography variant="cardTitle">Pro Seite</Typography>
            {loadout.perSide.length === 0 ? (
              <Typography variant="subtitle" className="mt-xs">
                Keine Scheiben nötig — Zielgewicht liegt bei oder unter dem Stangengewicht.
              </Typography>
            ) : (
              <View className="mt-xs gap-xs">
                {loadout.perSide.map((entry) => (
                  <View key={entry.weightKg} className="flex-row items-center justify-between">
                    <Typography variant="body">{entry.weightKg} kg</Typography>
                    <Typography variant="body">× {entry.count}</Typography>
                  </View>
                ))}
              </View>
            )}

            <View className="mt-md border-t border-border-light pt-sm dark:border-border-dark">
              <Typography variant="body">
                Ergibt {loadout.totalWeightKg} kg
                {loadout.totalWeightKg !== targetWeight ? ` (Ziel: ${targetWeight} kg)` : ''}
              </Typography>
            </View>
          </Card>
        ) : (
          <Typography variant="subtitle">Gib ein Zielgewicht ein, um die Plattenaufteilung zu sehen.</Typography>
        )}
      </ScrollView>
    </Screen>
  );
}
