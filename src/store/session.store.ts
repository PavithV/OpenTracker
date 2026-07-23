import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

interface SessionState {
  session: Session | null;
  isInitializing: boolean;
  setSession: (session: Session | null) => void;
  finishInitializing: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  isInitializing: true,
  setSession: (session) => set({ session }),
  finishInitializing: () => set({ isInitializing: false }),
}));
