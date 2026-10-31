// The app's real query functions, through a real supabase-js client, against the fake Supabase
// (real migrations + RLS in PGlite, Supabase's 1000-row response cap). Checks the history-style
// queries still return complete data once a user has a long training history -- they fetch
// every row of a user's workouts/sets and pass long id lists to `in` filters.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { E2E_EMAIL, E2E_PASSWORD, startFakeSupabase } from '../../../e2e/fake-supabase';

const PORT = 54399;

vi.mock('@/shared/lib/supabase', async () => {
  const { createClient } = await import('@supabase/supabase-js');
  return {
    supabase: createClient(`http://localhost:${PORT}`, 'fake-anon-key', {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
});

const { supabase } = await import('@/shared/lib/supabase');
const { getWorkoutHistory } = await import('@/features/home/api/workouts.api');
const { getProfileWorkoutSeries, getProfileStats } =
  await import('@/features/profile/api/profile.api');
const { getExerciseHistory, getPreviousSetsByExercise } =
  await import('@/features/exercises/api/exercises.api');

const WORKOUTS = 120;
const EXERCISES_PER_WORKOUT = 2;
const SETS_PER_EXERCISE = 9; // 1080 sets per exercise, 2160 in total -- past the 1000-row cap

describe('history queries with a long training history', () => {
  let fake: Awaited<ReturnType<typeof startFakeSupabase>>;
  let userId: string;
  let benchId: string;
  let squatId: string;

  beforeAll(async () => {
    fake = await startFakeSupabase(PORT);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: E2E_EMAIL,
      password: E2E_PASSWORD,
    });
    if (error) throw error;
    userId = data.user!.id;

    const exercises = await fake.db.query<{ id: string; name: string }>(
      `select id, name from public.exercises where name in ('Bench Press', 'Squat')`,
    );
    benchId = exercises.rows.find((row) => row.name === 'Bench Press')!.id;
    squatId = exercises.rows.find((row) => row.name === 'Squat')!.id;

    // One statement per table keeps seeding fast. Workout i is i days old; its sets weigh 100 + i
    // so the most recent workout (i = 0) is the lightest -- "last time" must still pick it.
    await fake.db.query(
      `insert into public.workouts (user_id, name, started_at, ended_at, duration_seconds, total_volume)
       select $1, 'W' || i, now() - (i || ' days')::interval, now() - (i || ' days')::interval + interval '1 hour', 3600, 1000
       from generate_series(0, $2 - 1) as i`,
      [userId, WORKOUTS],
    );
    await fake.db.query(
      `insert into public.workout_exercises (workout_id, exercise_id, order_index)
       select w.id, e.exercise_id, e.ord
       from public.workouts w
       cross join (values ($1::uuid, 0), ($2::uuid, 1)) as e(exercise_id, ord)
       where w.user_id = $3`,
      [benchId, squatId, userId],
    );
    await fake.db.query(
      `insert into public.sets (workout_exercise_id, set_number, weight, reps, completed, completed_at)
       select we.id, n, 100 + substring(w.name from 2)::int, 5, true, w.started_at
       from public.workout_exercises we
       join public.workouts w on w.id = we.workout_id
       cross join generate_series(1, $1) as n
       where w.user_id = $2`,
      [SETS_PER_EXERCISE, userId],
    );
  }, 60_000);

  afterAll(async () => {
    await fake?.close();
  });

  it('seeded more sets than one response may carry', async () => {
    const result = await fake.db.query<{ n: number }>('select count(*)::int as n from public.sets');
    expect(result.rows[0].n).toBe(WORKOUTS * EXERCISES_PER_WORKOUT * SETS_PER_EXERCISE);
  });

  it('home history: every workout with its full set counts', async () => {
    const history = await getWorkoutHistory(userId);
    expect(history).toHaveLength(WORKOUTS);
    for (const workout of history) {
      expect(workout.exercises.map((exercise) => exercise.setCount)).toEqual([
        SETS_PER_EXERCISE,
        SETS_PER_EXERCISE,
      ]);
    }
  });

  it('profile chart: reps for every workout in the last year', async () => {
    const series = await getProfileWorkoutSeries(
      userId,
      new Date(Date.now() - 365 * 86_400_000).toISOString(),
    );
    expect(series).toHaveLength(WORKOUTS);
    for (const point of series)
      expect(point.totalReps).toBe(EXERCISES_PER_WORKOUT * SETS_PER_EXERCISE * 5);
  });

  it('profile stats: totals over every workout', async () => {
    const stats = await getProfileStats(userId);
    expect(stats.workoutCount).toBe(WORKOUTS);
  });

  it('exercise history: every workout with all its sets', async () => {
    const history = await getExerciseHistory(userId, benchId);
    expect(history).toHaveLength(WORKOUTS);
    for (const entry of history) expect(entry.sets).toHaveLength(SETS_PER_EXERCISE);
  });

  it('"last time" reference: the most recent workout, not an older one', async () => {
    const previous = await getPreviousSetsByExercise(userId, [benchId, squatId]);
    expect(previous.get(benchId)?.map((set) => set.weight)).toEqual(
      Array(SETS_PER_EXERCISE).fill(100),
    );
    expect(previous.get(squatId)).toHaveLength(SETS_PER_EXERCISE);
  });
});
