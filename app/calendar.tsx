import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { router } from 'expo-router';
import { CaretLeft, CaretRight, ClockCounterClockwise, WarningCircle } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, useColorScheme, View } from 'react-native';

import { getWorkoutHistory } from '@/features/home/api/workouts.api';
import { WorkoutHistoryCard } from '@/features/home/components/WorkoutHistoryCard';
import { buildMonthGrid, groupWorkoutsByDate } from '@/features/home/utils/calendar';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { colors } from '@/shared/theme/colors';
import { ICON_SIZE } from '@/shared/theme/icons';
import { getErrorMessage } from '@/shared/utils/errors';
import { GERMAN_MONTHS } from '@/shared/utils/format';
import { useSessionStore } from '@/store/session.store';

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// buildMonthGrid() always returns a flat array padded to a multiple of 7 -- chunk it into weeks
// for row-by-row rendering instead of a FlatList (nesting a FlatList inside this screen's
// ScrollView would trigger RN's "VirtualizedLists should never be nested" warning for no benefit,
// since the grid was already non-scrolling).
function chunkIntoWeeks(cells: (Dayjs | null)[]): (Dayjs | null)[][] {
  const weeks: (Dayjs | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export default function CalendarScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const session = useSessionStore((state) => state.session);
  const [monthRef, setMonthRef] = useState(() => dayjs().startOf('month'));
  const [selectedDate, setSelectedDate] = useState<string | null>(() => dayjs().format('YYYY-MM-DD'));

  const { data: workouts, isLoading, error, refetch } = useQuery({
    queryKey: ['workouts', 'history', session?.user.id],
    queryFn: () => getWorkoutHistory(session!.user.id),
    enabled: !!session,
  });

  const workoutsByDate = useMemo(() => groupWorkoutsByDate(workouts ?? []), [workouts]);
  const grid = useMemo(() => buildMonthGrid(monthRef), [monthRef]);
  const weeks = useMemo(() => chunkIntoWeeks(grid), [grid]);
  const selectedWorkouts = selectedDate ? (workoutsByDate.get(selectedDate) ?? []) : [];
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <Screen>
      <ScrollView contentContainerClassName="pb-md" showsVerticalScrollIndicator={false}>
        <View className="py-md">
          <Typography variant="title">Kalender</Typography>
        </View>

        <View className="flex-row items-center justify-between pb-sm">
          <Pressable
            onPress={() => setMonthRef((prev) => prev.subtract(1, 'month'))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Vorheriger Monat"
          >
            <CaretLeft size={ICON_SIZE.lg} color={colors.textPrimary[scheme]} />
          </Pressable>
          <Typography variant="cardTitle">
            {GERMAN_MONTHS[monthRef.month()]} {monthRef.year()}
          </Typography>
          <Pressable
            onPress={() => setMonthRef((prev) => prev.add(1, 'month'))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Nächster Monat"
          >
            <CaretRight size={ICON_SIZE.lg} color={colors.textPrimary[scheme]} />
          </Pressable>
        </View>

        <View className="flex-row">
          {WEEKDAY_LABELS.map((label) => (
            <View key={label} className="flex-1 items-center">
              <Typography variant="caption">{label}</Typography>
            </View>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} className="flex-row">
            {week.map((day, dayIndex) => {
              if (!day) return <View key={dayIndex} className="flex-1 py-sm" />;
              const dateKey = day.format('YYYY-MM-DD');
              const hasWorkout = workoutsByDate.has(dateKey);
              const isSelected = dateKey === selectedDate;
              const isToday = dateKey === today;
              return (
                <Pressable
                  key={dateKey}
                  onPress={() => setSelectedDate(dateKey)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    hasWorkout
                      ? `${day.date()}. ${GERMAN_MONTHS[day.month()]}, Workout vorhanden`
                      : `${day.date()}. ${GERMAN_MONTHS[day.month()]}`
                  }
                  accessibilityState={{ selected: isSelected }}
                  className={`flex-1 items-center justify-center gap-xs rounded-md border py-sm ${
                    isSelected
                      ? 'border-primary-light bg-primary-light/15 dark:border-primary-dark dark:bg-primary-dark/15'
                      : 'border-transparent'
                  }`}
                >
                  <Text
                    className={`text-base font-sans ${
                      isSelected || isToday
                        ? 'font-sans-medium text-primary-light dark:text-primary-dark'
                        : 'text-text-primary-light dark:text-text-primary-dark'
                    }`}
                  >
                    {day.date()}
                  </Text>
                  {hasWorkout ? (
                    <View className="h-1.5 w-1.5 rounded-full bg-primary-light dark:bg-primary-dark" />
                  ) : (
                    <View className="h-1.5 w-1.5" />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}

        <View className="mt-md">
          {isLoading ? (
            <ActivityIndicator />
          ) : error ? (
            <EmptyState
              compact
              icon={WarningCircle}
              title="Etwas ist schiefgelaufen"
              description={getErrorMessage(error)}
              action={{ label: 'Erneut versuchen', onPress: () => refetch() }}
            />
          ) : selectedWorkouts.length === 0 ? (
            <EmptyState
              compact
              icon={ClockCounterClockwise}
              title="Keine Workouts"
              description={
                selectedDate
                  ? `Kein Workout am ${dayjs(selectedDate).format('DD.MM.YYYY')}.`
                  : 'Wähle einen Tag im Kalender aus.'
              }
            />
          ) : (
            <View className="gap-sm">
              {selectedWorkouts.map((item) => (
                <WorkoutHistoryCard key={item.id} workout={item} onPress={() => router.push(`/workout/${item.id}`)} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
