import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { UnitPreference } from '@/shared/utils/units';

interface UnitPreferenceState {
  unitPreference: UnitPreference;
  setUnitPreference: (unitPreference: UnitPreference) => void;
}

// Local, AsyncStorage-persisted mirror of `profiles.unit_preference` (same pattern as
// theme.store.ts) -- default 'kg' matches the DB column default, so a fresh install renders
// correctly before the profile query ever resolves. Corrected from the DB value once
// `app/(tabs)/profile/index.tsx`'s existing profile query loads (handles drift from another device).
export const useUnitPreferenceStore = create<UnitPreferenceState>()(
  persist(
    (set) => ({
      unitPreference: 'kg',
      setUnitPreference: (unitPreference) => set({ unitPreference }),
    }),
    {
      name: 'unit-preference',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
