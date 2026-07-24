import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface RemindersState {
  enabled: boolean;
  // Expo's own weekday numbering (1 = Sunday ... 7 = Saturday), not the Monday-first order the
  // rest of the app uses for display (see calendar.ts) -- stored in Expo's convention directly so
  // no translation is needed when (re)scheduling notifications.
  weekdays: number[];
  hour: number;
  minute: number;
  setEnabled: (enabled: boolean) => void;
  toggleWeekday: (weekday: number) => void;
  setTime: (hour: number, minute: number) => void;
}

export const useRemindersStore = create<RemindersState>()(
  persist(
    (set) => ({
      enabled: false,
      weekdays: [],
      hour: 18,
      minute: 0,
      setEnabled: (enabled) => set({ enabled }),
      toggleWeekday: (weekday) =>
        set((state) => ({
          weekdays: state.weekdays.includes(weekday)
            ? state.weekdays.filter((day) => day !== weekday)
            : [...state.weekdays, weekday].sort((a, b) => a - b),
        })),
      setTime: (hour, minute) => set({ hour, minute }),
    }),
    {
      name: 'workout-reminders',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
