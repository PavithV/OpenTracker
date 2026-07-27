import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ActiveWorkoutExercise } from '../types/active-workout.types';

interface FakeResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface InsertBuilder<T> extends PromiseLike<FakeResult<T>> {
  select: (columns: string) => { single: () => Promise<FakeResult<T>> };
}

function toInsertBuilder<T>(result: FakeResult<T>): InsertBuilder<T> {
  return {
    select: () => ({ single: () => Promise.resolve(result) }),
    then: (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected),
  };
}

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
    rpc: (fn: string, args: unknown) => mockRpc(fn, args),
  },
}));

const { finishActiveWorkout } = await import('./workouts.api');

function makeExercise(exerciseId: string, sets: ActiveWorkoutExercise['sets']): ActiveWorkoutExercise {
  return { exerciseId, name: exerciseId, imageUrl: null, notes: '', sets, restSeconds: null };
}

describe('finishActiveWorkout', () => {
  let insertedWorkoutRow: unknown;
  let insertedWorkoutExerciseRows: unknown[];
  let insertedSetRows: unknown[][];
  let workoutInsertResult: FakeResult<{ id: string }>;
  let rpcResult: FakeResult<null>;

  beforeEach(() => {
    insertedWorkoutRow = undefined;
    insertedWorkoutExerciseRows = [];
    insertedSetRows = [];
    workoutInsertResult = { data: { id: 'workout-1' }, error: null };
    rpcResult = { data: null, error: null };

    mockRpc.mockReset();
    mockRpc.mockImplementation(() => Promise.resolve(rpcResult));

    let workoutExerciseCount = 0;
    mockFrom.mockReset();
    mockFrom.mockImplementation((table: string) => {
      if (table === 'workouts') {
        return {
          insert: (row: unknown) => {
            insertedWorkoutRow = row;
            return toInsertBuilder(workoutInsertResult);
          },
        };
      }
      if (table === 'workout_exercises') {
        return {
          insert: (row: unknown) => {
            insertedWorkoutExerciseRows.push(row);
            workoutExerciseCount += 1;
            return toInsertBuilder({ data: { id: `we-${workoutExerciseCount}` }, error: null });
          },
        };
      }
      if (table === 'sets') {
        return {
          insert: (rows: unknown[]) => {
            insertedSetRows.push(rows);
            return toInsertBuilder<null>({ data: null, error: null });
          },
        };
      }
      throw new Error(`unexpected table: ${table}`);
    });
  });

  it('syncs workout, exercises, and sets in order, then calls finish_workout', async () => {
    const draft = {
      name: 'Push Day',
      notes: '',
      startedAt: '2026-07-27T08:00:00.000Z',
      routineId: null,
      exercises: [
        makeExercise('bench-press', [
          { id: 'local-1', weight: 60, reps: 8, completed: true },
          { id: 'local-2', weight: null, reps: null, completed: false },
        ]),
        makeExercise('plank', []),
      ],
    };

    const workoutId = await finishActiveWorkout('user-1', draft);

    expect(workoutId).toBe('workout-1');
    expect(insertedWorkoutRow).toEqual({
      user_id: 'user-1',
      name: 'Push Day',
      notes: null,
      started_at: '2026-07-27T08:00:00.000Z',
      routine_id: null,
    });

    expect(insertedWorkoutExerciseRows).toEqual([
      { workout_id: 'workout-1', exercise_id: 'bench-press', order_index: 0, notes: null },
      { workout_id: 'workout-1', exercise_id: 'plank', order_index: 1, notes: null },
    ]);

    // Only the exercise with sets should trigger a `sets` insert.
    expect(insertedSetRows).toHaveLength(1);
    const [setRows] = insertedSetRows as [Record<string, unknown>[]];
    expect(setRows).toHaveLength(2);
    expect(setRows[0]).toMatchObject({
      workout_exercise_id: 'we-1',
      set_number: 1,
      weight: 60,
      reps: 8,
      completed: true,
    });
    expect(setRows[0].completed_at).not.toBeNull();
    expect(setRows[1]).toMatchObject({
      workout_exercise_id: 'we-1',
      set_number: 2,
      weight: null,
      reps: null,
      completed: false,
      completed_at: null,
    });

    expect(mockRpc).toHaveBeenCalledWith('finish_workout', { p_workout_id: 'workout-1' });
  });

  it('rejects and never proceeds when the workout insert fails', async () => {
    workoutInsertResult = { data: null, error: { message: 'insert failed' } };

    const draft = {
      name: 'Push Day',
      notes: '',
      startedAt: '2026-07-27T08:00:00.000Z',
      routineId: null,
      exercises: [makeExercise('bench-press', [])],
    };

    await expect(finishActiveWorkout('user-1', draft)).rejects.toEqual({ message: 'insert failed' });
    expect(insertedWorkoutExerciseRows).toHaveLength(0);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('rejects when finish_workout rpc fails', async () => {
    rpcResult = { data: null, error: { message: 'rpc failed' } };

    const draft = {
      name: 'Push Day',
      notes: '',
      startedAt: '2026-07-27T08:00:00.000Z',
      routineId: null,
      exercises: [makeExercise('bench-press', [])],
    };

    await expect(finishActiveWorkout('user-1', draft)).rejects.toEqual({ message: 'rpc failed' });
  });
});
