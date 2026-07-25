import { create } from 'zustand';

import type { RoutineDraftExercise, RoutineDraftSet } from '../types/routine.types';

function generateLocalId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface RoutineDraftState {
  name: string;
  notes: string;
  exercises: RoutineDraftExercise[];
  hydratedRoutineId: string | null;
  setName: (name: string) => void;
  setNotes: (notes: string) => void;
  addExercises: (exercises: { id: string; name: string; imageUrl: string | null }[]) => void;
  removeExercise: (exerciseId: string) => void;
  reorderExercises: (exercises: RoutineDraftExercise[]) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  updateSet: (exerciseId: string, setId: string, patch: Partial<Pick<RoutineDraftSet, 'targetWeight' | 'targetReps'>>) => void;
  updateRestSeconds: (exerciseId: string, restSeconds: number | null) => void;
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
          imageUrl: exercise.imageUrl,
          sets: [{ id: generateLocalId(), targetWeight: null, targetReps: null }],
          restSeconds: null,
        }));
      return { exercises: [...state.exercises, ...toAdd] };
    }),

  removeExercise: (exerciseId) =>
    set((state) => ({ exercises: state.exercises.filter((exercise) => exercise.exerciseId !== exerciseId) })),

  reorderExercises: (exercises) => set({ exercises }),

  addSet: (exerciseId) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? { ...exercise, sets: [...exercise.sets, { id: generateLocalId(), targetWeight: null, targetReps: null }] }
          : exercise,
      ),
    })),

  removeSet: (exerciseId, setId) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? { ...exercise, sets: exercise.sets.filter((set) => set.id !== setId) }
          : exercise,
      ),
    })),

  updateSet: (exerciseId, setId, patch) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
            }
          : exercise,
      ),
    })),

  updateRestSeconds: (exerciseId, restSeconds) =>
    set((state) => ({
      exercises: state.exercises.map((exercise) =>
        exercise.exerciseId === exerciseId ? { ...exercise, restSeconds } : exercise,
      ),
    })),

  reset: () => set({ name: '', notes: '', exercises: [], hydratedRoutineId: null }),

  hydrate: (routineId, data) =>
    set({ name: data.name, notes: data.notes, exercises: data.exercises, hydratedRoutineId: routineId }),
}));
