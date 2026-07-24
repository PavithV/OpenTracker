import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, History } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, useColorScheme, View } from 'react-native';

import { getWorkoutHistory } from '@/features/home/api/workouts.api';
import { WorkoutHistoryCard } from '@/features/home/components/WorkoutHistoryCard';
import { buildMonthGrid, groupWorkoutsByDate } from '@/features/home/utils/calendar';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';
import { useSessionStore } from '@/store/session.store';

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// dayjs läuft in dieser App ohne 'de'-Locale (nirgends per `dayjs.locale('de')` konfiguriert --
// alle bestehenden `.format(...)`-Aufrufe verwenden rein numerische Formate wie 'DD.MM.YYYY',
// die davon unabhängig sind). Ein eigenes globales Locale-Setup wäre Scope-Creep für diesen
// Screen -- daher hier ein lokales Array statt `.format('MMMM')`.
const GERMAN_MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

export default function CalendarScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const session = useSessionStore((state) => state.session);
  const [monthRef, setMonthRef] = useState(() => dayjs().startOf('month'));
  const [selectedDate, setSelectedDate] = useState<string | null>(() => dayjs().format('YYYY-MM-DD'));

  const { data: workouts } = useQuery({
    queryKey: ['workouts', 'history', session?.user.id],
    queryFn: () => getWorkoutHistory(session!.user.id),
    enabled: !!session,
  });

  const workoutsByDate = useMemo(() => groupWorkoutsByDate(workouts ?? []), [workouts]);
  const grid = useMemo(() => buildMonthGrid(monthRef), [monthRef]);
  const selectedWorkouts = selectedDate ? (workoutsByDate.get(selectedDate) ?? []) : [];
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <Screen>
      <View className="py-md">
        <Typography variant="title">Kalender</Typography>
      </View>

      <View className="flex-row items-center justify-between pb-sm">
        <Pressable onPress={() => setMonthRef((prev) => prev.subtract(1, 'month'))} hitSlop={8}>
          <ChevronLeft size={ICON_SIZE.lg} color={colors.textPrimary[scheme]} />
        </Pressable>
        <Typography variant="cardTitle">
          {GERMAN_MONTHS[monthRef.month()]} {monthRef.year()}
        </Typography>
        <Pressable onPress={() => setMonthRef((prev) => prev.add(1, 'month'))} hitSlop={8}>
          <ChevronRight size={ICON_SIZE.lg} color={colors.textPrimary[scheme]} />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} className="flex-1 items-center">
            <Typography variant="caption">{label}</Typography>
          </View>
        ))}
      </View>

      <FlatList
        data={grid}
        keyExtractor={(_, index) => String(index)}
        numColumns={7}
        scrollEnabled={false}
        renderItem={({ item: day }) => {
          if (!day) return <View className="flex-1 py-sm" />;
          const dateKey = day.format('YYYY-MM-DD');
          const hasWorkout = workoutsByDate.has(dateKey);
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === today;
          return (
            <Pressable
              onPress={() => setSelectedDate(dateKey)}
              className={`flex-1 items-center justify-center gap-xs rounded-md py-sm ${isSelected ? 'bg-primary' : ''}`}
            >
              <Text
                className={`text-base ${
                  isSelected
                    ? 'font-semibold text-white'
                    : isToday
                      ? 'font-semibold text-primary'
                      : 'text-text-primary-light dark:text-text-primary-dark'
                }`}
              >
                {day.date()}
              </Text>
              {hasWorkout ? (
                <View className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
              ) : (
                <View className="h-1.5 w-1.5" />
              )}
            </Pressable>
          );
        }}
      />

      <View className="mt-md flex-1">
        {selectedWorkouts.length === 0 ? (
          <EmptyState
            icon={History}
            title="Keine Workouts"
            description={
              selectedDate
                ? `Kein Workout am ${dayjs(selectedDate).format('DD.MM.YYYY')}.`
                : 'Wähle einen Tag im Kalender aus.'
            }
          />
        ) : (
          <FlatList
            data={selectedWorkouts}
            keyExtractor={(item) => item.id}
            contentContainerClassName="gap-sm pb-md"
            renderItem={({ item }) => (
              <WorkoutHistoryCard workout={item} onPress={() => router.push(`/workout/${item.id}`)} />
            )}
          />
        )}
      </View>
    </Screen>
  );
}
