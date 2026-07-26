import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

// `colorScheme.set()` (NativeWind's wrapper around RN's `Appearance.setColorScheme`) is
// in-memory only -- it overrides what every `useColorScheme()` call (NativeWind's `dark:`
// classes *and* React Native's own hook, since both read from the same `Appearance` module)
// resolves to, but doesn't survive an app restart on its own. `onRehydrateStorage` re-applies
// the persisted choice as soon as it loads from disk, so a manual Light/Dark override sticks
// across cold starts instead of silently reverting to "system" every time.
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => {
        colorScheme.set(preference);
        set({ preference });
      },
    }),
    {
      name: 'theme-preference',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) colorScheme.set(state.preference);
      },
    },
  ),
);
