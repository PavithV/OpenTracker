import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { FilterChip } from '@/features/exercises/components/FilterChip';
import { BAR_TYPES, calculatePlateLoadout } from '@/features/training/utils/plate-calculator';
import { Card } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { formatWeight, kgToLb, parseWeightInput } from '@/shared/utils/units';
import { useUnitPreferenceStore } from '@/store/unit-preference.store';

export default function PlateCalculatorScreen() {
  const { weight } = useLocalSearchParams<{ weight?: string }>();
  const unit = useUnitPreferenceStore((state) => state.unitPreference);
  // `weight` param is always canonical kg (callers, e.g. the active workout's "open plate
  // calculator" button, pass the set's raw weight) -- convert it into the display unit once for
  // the initial text, same as every other prefilled weight input in the app.
  const [targetWeightText, setTargetWeightText] = useState(() => {
    if (!weight) return '';
    const kg = Number(weight);
    return Number.isNaN(kg) ? '' : String(unit === 'lb' ? kgToLb(kg) : kg);
  });
  const [barTypeId, setBarTypeId] = useState(BAR_TYPES[0].id);

  const barType = BAR_TYPES.find((bar) => bar.id === barTypeId) ?? BAR_TYPES[0];
  // The algorithm and the per-plate breakdown always run in kg -- gym plates/bars are physical
  // kg objects regardless of the user's preferred display unit (see units.ts's doc comment).
  // Only the typed target and the final total are converted for entry/display.
  const targetWeightKg = parseWeightInput(targetWeightText, unit);

  const loadout = useMemo(
    () =>
      targetWeightKg !== null && targetWeightKg > 0 ? calculatePlateLoadout(targetWeightKg, barType.weightKg) : null,
    [targetWeightKg, barType.weightKg],
  );

  return (
    <Screen>
      <Typography variant="title" className="py-md">
        Plattenrechner
      </Typography>

      <Input
        label={`Zielgewicht (${unit})`}
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
                Ergibt {formatWeight(loadout.totalWeightKg, unit)}
                {loadout.totalWeightKg !== targetWeightKg ? ` (Ziel: ${formatWeight(targetWeightKg!, unit)})` : ''}
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
