import { create } from 'zustand';

interface ShowToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastState {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  show: (options: ShowToastOptions) => void;
  hide: () => void;
}

const DEFAULT_DURATION_MS = 5000;

let hideTimeout: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  actionLabel: undefined,
  onAction: undefined,
  show: ({ message, actionLabel, onAction, durationMs = DEFAULT_DURATION_MS }) => {
    if (hideTimeout) clearTimeout(hideTimeout);
    set({ visible: true, message, actionLabel, onAction });
    hideTimeout = setTimeout(() => set({ visible: false }), durationMs);
  },
  hide: () => {
    if (hideTimeout) clearTimeout(hideTimeout);
    set({ visible: false });
  },
}));
