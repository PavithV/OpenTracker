import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

interface SessionState {
  session: Session | null;
  isInitializing: boolean;
  // Set while a password-recovery deep link's session is active, so the root
  // navigator can force the "set new password" screen instead of routing the
  // now-truthy `session` straight into the authenticated app.
  isPasswordRecovery: boolean;
  setSession: (session: Session | null) => void;
  finishInitializing: () => void;
  setPasswordRecovery: (isPasswordRecovery: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  isInitializing: true,
  isPasswordRecovery: false,
  setSession: (session) => set({ session }),
  finishInitializing: () => set({ isInitializing: false }),
  setPasswordRecovery: (isPasswordRecovery) => set({ isPasswordRecovery }),
}));
