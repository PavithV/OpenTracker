import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { FilterChip } from '@/features/exercises/components/FilterChip';
import { useRemindersStore } from '@/features/reminders/store/reminders.store';
import {
  cancelWorkoutReminders,
  isReminderSchedulingSupported,
  requestNotificationPermission,
  rescheduleWorkoutReminders,
} from '@/features/reminders/utils/notifications';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';

// Display order is Monday-first (matches calendar.tsx's grid convention), but the value stored
// per chip is Expo's own weekday numbering (1 = Sunday ... 7 = Saturday) -- see reminders.store.ts.
const WEEKDAYS = [
  { weekday: 2, label: 'Mo' },
  { weekday: 3, label: 'Di' },
  { weekday: 4, label: 'Mi' },
  { weekday: 5, label: 'Do' },
  { weekday: 6, label: 'Fr' },
  { weekday: 7, label: 'Sa' },
  { weekday: 1, label: 'So' },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseTimePart(text: string, max: number): number | null {
  if (text === '') return null;
  const value = Number(text);
  if (!Number.isInteger(value)) return null;
  return clamp(value, 0, max);
}

function formatActiveSummary(weekdays: number[], hour: number, minute: number): string {
  const labels = WEEKDAYS.filter((day) => weekdays.includes(day.weekday)).map((day) => day.label);
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return `Aktiv: ${labels.join(', ')} um ${time} Uhr`;
}

export default function RemindersScreen() {
  const enabled = useRemindersStore((state) => state.enabled);
  const weekdays = useRemindersStore((state) => state.weekdays);
  const hour = useRemindersStore((state) => state.hour);
  const minute = useRemindersStore((state) => state.minute);
  const toggleWeekday = useRemindersStore((state) => state.toggleWeekday);
  const setTime = useRemindersStore((state) => state.setTime);
  const setEnabled = useRemindersStore((state) => state.setEnabled);

  const [hourText, setHourText] = useState(String(hour).padStart(2, '0'));
  const [minuteText, setMinuteText] = useState(String(minute).padStart(2, '0'));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const supported = isReminderSchedulingSupported();

  async function handleSave() {
    setError(null);

    const parsedHour = parseTimePart(hourText, 23);
    const parsedMinute = parseTimePart(minuteText, 59);
    if (parsedHour === null || parsedMinute === null) {
      setError('Bitte eine gültige Uhrzeit angeben (Stunde 0–23, Minute 0–59).');
      return;
    }
    if (weekdays.length === 0) {
      setError('Bitte mindestens einen Wochentag auswählen.');
      return;
    }

    setSaving(true);
    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setError('Benachrichtigungen sind nicht erlaubt. Bitte in den Geräte-Einstellungen aktivieren.');
        return;
      }

      setTime(parsedHour, parsedMinute);
      await rescheduleWorkoutReminders(weekdays, parsedHour, parsedMinute);
      setEnabled(true);
    } catch {
      setError('Erinnerungen konnten nicht geplant werden. Bitte später erneut versuchen.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable() {
    setSaving(true);
    try {
      await cancelWorkoutReminders();
      setEnabled(false);
    } catch {
      setError('Erinnerungen konnten nicht deaktiviert werden. Bitte später erneut versuchen.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerClassName="gap-lg py-md">
        <Typography variant="title">Workout-Erinnerungen</Typography>

        {supported ? (
          <Card>
            <Typography variant="body">
              {enabled ? formatActiveSummary(weekdays, hour, minute) : 'Keine Erinnerungen aktiv.'}
            </Typography>
          </Card>
        ) : (
          <Card>
            <Typography variant="body" color="danger">
              Auf diesem Gerät nicht verfügbar: Expo Go auf Android unterstützt seit SDK 53 keine
              Benachrichtigungen mehr. Dafür ist ein Development Build nötig.
            </Typography>
          </Card>
        )}

        <View className="gap-xs">
          <Typography variant="label">Wochentage</Typography>
          <View className="flex-row flex-wrap gap-xs">
            {WEEKDAYS.map((day) => (
              <FilterChip
                key={day.weekday}
                label={day.label}
                selected={weekdays.includes(day.weekday)}
                onPress={() => toggleWeekday(day.weekday)}
              />
            ))}
          </View>
        </View>

        <View className="flex-row gap-md">
          <View className="flex-1">
            <Input
              label="Stunde"
              keyboardType="numeric"
              value={hourText}
              onChangeText={setHourText}
              placeholder="18"
              maxLength={2}
            />
          </View>
          <View className="flex-1">
            <Input
              label="Minute"
              keyboardType="numeric"
              value={minuteText}
              onChangeText={setMinuteText}
              placeholder="00"
              maxLength={2}
            />
          </View>
        </View>

        {error ? <Typography color="danger">{error}</Typography> : null}

        <Button label="Erinnerungen speichern" onPress={handleSave} loading={saving} disabled={!supported} />
        {enabled ? (
          <Button label="Erinnerungen deaktivieren" variant="destructive" onPress={handleDisable} disabled={saving} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
