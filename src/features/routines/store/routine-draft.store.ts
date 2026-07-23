import { create } from 'zustand';

import type { RoutineDraftExercise } from '../types/routine.types';

interface RoutineDraftState {
  name: string;
  notes: string;
  exercises: RoutineDraftExercise[];
  hydratedRoutineId: string | null;
  setName: (name: string) => void;
  setNotes: (notes: string) => void;
  addExercises: (exercises: { id: string; name: string }[]) => void;
  removeExercise: (exerciseId: string) => void;
  moveExercise: (exerciseId: string, direction: 'up' | 'down') => void;
  updateTarget: (
    exerciseId: string,
    patch: Partial<Omit<RoutineDraftExercise, 'exerciseId' | 'name'>>,
  ) => void;
  reset: () => void;
  hydrate: (routineId: string, data: { name: string; notes: string; exercises: RoutineDraftExercise[] }) => void;
}

export const useRoutineDraftStore = create<RoutineDraftState>((set) => ({
  name: '',
  notes: '',
  exercises: [],
  hydratedRoutineId: null,

  setName: (name) => set({ name }),
  setNotes: (notes) => set({ notes }),

  addExercises: (exercises) =>
    set((state) => {
      const existingIds = new Set(state.exercises.map((exercise) => exercise.exerciseId));
      const toAdd = exercises
        .filter((exercise) => !existingIds.has(exercise.id))
        .map((exercise) => ({
          exerciseId: exercise.id,
          name: exercise.name,
          targetSets: 3,
          targetRepsMin: 8,
          targetRepsMax: null,
          targetWeight: null,
          restSeconds: null,
        }));
      return { exercises: [...state.exercises, ...toAdd] };
    }),

  removeExercise: (exerciseId) =>
    set((state) => ({ exercises: state.exercises.filter((exercise) => exercise.exerciseId !== exerciseId) })),

  moveExercise: (exerciseId, direction) =>
    set((state) => {
      const index = state.exercises.findIndex((exercise) => exercise.exerciseId === exerciseId);
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (index === -1 || swapWith < 0 || swapWith >= state.exercises.length) return state;

      const next = [...state.exercises];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return { exercises: next };
    }),

  updateTarget: (exerciseId, patch) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) =>
        exercise.exerciseId === exerciseId ? { ...exercise, ...patch } : exercise,
      ),
    })),

  reset: () => set({ name: '', notes: '', exercises: [], hydratedRoutineId: null }),

  hydrate: (routineId, data) =>
    set({ name: data.name, notes: data.notes, exercises: data.exercises, hydratedRoutineId: routineId }),
}));
