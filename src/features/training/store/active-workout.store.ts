import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ActiveWorkoutExercise, WorkoutSetEntry } from '../types/active-workout.types';

function generateLocalId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Deliberately narrower than routines/types RoutineDraftExercise (no targetReps -- unused here,
// the active workout only pre-fills weight, not reps, see startFromRoutine below) so this store
// isn't coupled to the routines feature's exact shape, just this.
interface RoutineExerciseSeed {
  exerciseId: string;
  name: string;
  restSeconds: number | null;
  sets: { targetWeight: number | null }[];
}

interface ActiveWorkoutState {
  startedAt: string | null;
  name: string;
  notes: string;
  routineId: string | null;
  exercises: ActiveWorkoutExercise[];
  // Absolute end-timestamp (ISO string), not a live countdown -- survives app kills the same way
  // startedAt does, since a persisted "seconds remaining" value would go stale across a restart.
  restEndsAt: string | null;
  start: () => void;
  startFromRoutine: (routineId: string, name: string, exercises: RoutineExerciseSeed[]) => void;
  setName: (name: string) => void;
  setNotes: (notes: string) => void;
  updateExerciseNotes: (exerciseId: string, notes: string) => void;
  addExercises: (exercises: { id: string; name: string }[]) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setId: string, patch: Partial<Pick<WorkoutSetEntry, 'weight' | 'reps'>>) => void;
  toggleSetCompleted: (exerciseId: string, setId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  startRestTimer: (seconds: number) => void;
  clearRestTimer: () => void;
  reset: () => void;
}

// Mirrors finish_workout's total_volume calculation (supabase/migrations/0001_init.sql) so the
// client-side number shown during the workout matches what the server will compute on save.
export function computeTotalVolume(exercises: ActiveWorkoutExercise[]): number {
  return exercises.reduce(
    (sum, exercise) =>
      sum +
      exercise.sets.reduce(
        (setSum, set) =>
          setSum + (set.completed && set.weight !== null && set.reps !== null ? set.weight * set.reps : 0),
        0,
      ),
    0,
  );
}

export function computeCompletedSetCount(exercises: ActiveWorkoutExercise[]): number {
  return exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0);
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set) => ({
      startedAt: null,
      name: 'Workout',
      notes: '',
      routineId: null,
      exercises: [],
      restEndsAt: null,

      // Idempotent: resuming an in-progress workout (e.g. after the app was killed) must not
      // reset it. Only a genuinely fresh start (no workout in progress) initializes state.
      start: () =>
        set((state) =>
          state.startedAt
            ? state
            : {
                startedAt: new Date().toISOString(),
                name: 'Workout',
                notes: '',
                routineId: null,
                exercises: [],
                restEndsAt: null,
              },
        ),

      // Same idempotency guard as start() -- if a workout is already in progress, this is a no-op
      // (the caller is responsible for warning the user before calling, since silently landing on
      // an unrelated in-progress workout instead of the routine they tapped would be confusing).
      startFromRoutine: (routineId, name, exercises) =>
        set((state) =>
          state.startedAt
            ? state
            : {
                startedAt: new Date().toISOString(),
                name,
                notes: '',
                routineId,
                restEndsAt: null,
                exercises: exercises.map((exercise) => ({
                  exerciseId: exercise.exerciseId,
                  name: exercise.name,
                  notes: '',
                  restSeconds: exercise.restSeconds,
                  sets: exercise.sets.map((seedSet) => ({
                    id: generateLocalId(),
                    weight: seedSet.targetWeight,
                    reps: null,
                    completed: false,
                  })),
                })),
              },
        ),

      setName: (name) => set({ name }),
      setNotes: (notes) => set({ notes }),

      updateExerciseNotes: (exerciseId, notes) =>
        set((state) => ({
          exercises: state.exercises.map((exercise) =>
            exercise.exerciseId === exerciseId ? { ...exercise, notes } : exercise,
          ),
        })),

      addExercises: (exercises) =>
        set((state) => {
          const existingIds = new Set(state.exercises.map((exercise) => exercise.exerciseId));
          const toAdd = exercises
            .filter((exercise) => !existingIds.has(exercise.id))
            .map((exercise) => ({
              exerciseId: exercise.id,
              name: exercise.name,
              notes: '',
              sets: [],
              restSeconds: null,
            }));
          return { exercises: [...state.exercises, ...toAdd] };
        }),

      removeExercise: (exerciseId) =>
        set((state) => ({ exercises: state.exercises.filter((exercise) => exercise.exerciseId !== exerciseId) })),

      addSet: (exerciseId) =>
        set((state) => ({
          exercises: state.exercises.map((exercise) =>
            exercise.exerciseId === exerciseId
              ? { ...exercise, sets: [...exercise.sets, { id: generateLocalId(), weight: null, reps: null, completed: false }] }
              : exercise,
          ),
        })),

      updateSet: (exerciseId, setId, patch) =>
        set((state) => ({
          exercises: state.exercises.map((exercise) =>
            exercise.exerciseId === exerciseId
              ? {
                  ...exercise,
                  sets: exercise.sets.map((workoutSet) => (workoutSet.id === setId ? { ...workoutSet, ...patch } : workoutSet)),
                }
              : exercise,
          ),
        })),

      toggleSetCompleted: (exerciseId, setId) =>
        set((state) => ({
          exercises: state.exercises.map((exercise) =>
            exercise.exerciseId === exerciseId
              ? {
                  ...exercise,
                  sets: exercise.sets.map((workoutSet) =>
                    workoutSet.id === setId ? { ...workoutSet, completed: !workoutSet.completed } : workoutSet,
                  ),
                }
              : exercise,
          ),
        })),

      removeSet: (exerciseId, setId) =>
        set((state) => ({
          exercises: state.exercises.map((exercise) =>
            exercise.exerciseId === exerciseId
              ? { ...exercise, sets: exercise.sets.filter((workoutSet) => workoutSet.id !== setId) }
              : exercise,
          ),
        })),

      startRestTimer: (seconds) => set({ restEndsAt: new Date(Date.now() + seconds * 1000).toISOString() }),
      clearRestTimer: () => set({ restEndsAt: null }),

      reset: () =>
        set({ startedAt: null, name: 'Workout', notes: '', routineId: null, exercises: [], restEndsAt: null }),
    }),
    {
      name: 'active-workout-draft',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/**
 * `persist` rehydrates from AsyncStorage asynchronously -- on first render after an app
 * (re)start, the store briefly holds its default in-memory state (`startedAt: null`) before the
 * real persisted state loads. Calling the idempotent `start()` before rehydration finishes would
 * misread "not hydrated yet" as "no workout in progress" and wipe a real one. Callers must wait
 * for this to be true before calling `start()`.
 */
export function useActiveWorkoutHydrated(): boolean {
  return useSyncExternalStore(
    useActiveWorkoutStore.persist.onFinishHydration,
    () => useActiveWorkoutStore.persist.hasHydrated(),
    () => false,
  );
}
