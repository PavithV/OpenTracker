import type { PGlite, Transaction } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { asUser, createTestDb, createUser, insertExercise } from './test-db';

type Row = Record<string, unknown>;

async function insertWorkout(
  tx: Transaction,
  userId: string,
  startedAt = "now() - interval '1 hour'",
): Promise<string> {
  const result = await tx.query<{ id: string }>(
    `insert into public.workouts (user_id, name, started_at) values ($1, 'Push', ${startedAt}) returning id`,
    [userId],
  );
  return result.rows[0].id;
}

async function insertWorkoutExercise(
  tx: Transaction,
  workoutId: string,
  exerciseId: string,
  orderIndex = 0,
) {
  const result = await tx.query<{ id: string }>(
    'insert into public.workout_exercises (workout_id, exercise_id, order_index) values ($1, $2, $3) returning id',
    [workoutId, exerciseId, orderIndex],
  );
  return result.rows[0].id;
}

async function insertSet(
  tx: Transaction,
  workoutExerciseId: string,
  setNumber: number,
  weight: number | null,
  reps: number | null,
  completed = true,
) {
  await tx.query(
    `insert into public.sets (workout_exercise_id, set_number, weight, reps, completed, completed_at)
     values ($1, $2, $3, $4, $5, case when $5 then now() else null end)`,
    [workoutExerciseId, setNumber, weight, reps, completed],
  );
}

async function personalRecords(db: PGlite, userId: string, exerciseId: string) {
  const result = await db.query<{ record_type: string; value: string }>(
    'select record_type, value::text from public.personal_records where user_id = $1 and exercise_id = $2 order by record_type',
    [userId, exerciseId],
  );
  return Object.fromEntries(result.rows.map((row) => [row.record_type, Number(row.value)]));
}

describe('supabase migrations (PGlite)', () => {
  let db: PGlite;
  let alice: string;
  let bob: string;
  let benchPress: string;
  let squat: string;

  beforeAll(async () => {
    db = await createTestDb();
    alice = await createUser(db, 'alice@example.com');
    bob = await createUser(db, 'bob@example.com');
    benchPress = await insertExercise(db, { name: 'Bench Press' });
    squat = await insertExercise(db, {
      name: 'Squat',
      category: 'upper legs',
      targetMuscle: 'quads',
    });
  }, 60_000);

  afterAll(async () => {
    await db?.close();
  });

  it('auto-creates a profile row for every new auth user', async () => {
    const result = await db.query<Row>(
      'select id, unit_preference from public.profiles order by id',
    );
    expect(result.rows.map((row) => row.id).sort()).toEqual([alice, bob].sort());
    expect(result.rows.every((row) => row.unit_preference === 'kg')).toBe(true);
  });

  describe('finish_workout', () => {
    it('computes total_volume from completed sets only and stamps ended_at/duration', async () => {
      const finished = await asUser(db, alice, async (tx) => {
        const workoutId = await insertWorkout(tx, alice);
        const bench = await insertWorkoutExercise(tx, workoutId, benchPress, 0);
        await insertSet(tx, bench, 1, 60, 10); // 600
        await insertSet(tx, bench, 2, 70, 8); // 560
        await insertSet(tx, bench, 3, 80, 5, false); // not completed -> ignored
        await insertSet(tx, bench, 4, null, 12); // bodyweight-style set -> no volume
        const result = await tx.query<Row>('select * from public.finish_workout($1)', [workoutId]);
        return result.rows[0];
      });

      expect(Number(finished.total_volume)).toBe(1160);
      expect(finished.ended_at).not.toBeNull();
      // started_at was one hour ago
      expect(Number(finished.duration_seconds)).toBeGreaterThanOrEqual(3599);
      expect(Number(finished.duration_seconds)).toBeLessThan(3700);
    });

    it('records one max_weight + estimated_1rm per exercise, even with many sets (regression: bug 2)', async () => {
      const records = await personalRecords(db, alice, benchPress);
      // best weight of the completed sets above: 70 (the 80 was not completed)
      expect(records.max_weight).toBe(70);
      // Epley: 60*(1+10/30)=80.00 vs 70*(1+8/30)=88.67 -> 88.67
      expect(records.estimated_1rm).toBeCloseTo(88.67, 2);
    });

    it('only raises a record, never lowers it', async () => {
      await asUser(db, alice, async (tx) => {
        const workoutId = await insertWorkout(tx, alice);
        const bench = await insertWorkoutExercise(tx, workoutId, benchPress);
        await insertSet(tx, bench, 1, 50, 5);
        await tx.query('select public.finish_workout($1)', [workoutId]);
      });
      expect(await personalRecords(db, alice, benchPress)).toEqual({
        estimated_1rm: 88.67,
        max_weight: 70,
      });

      await asUser(db, alice, async (tx) => {
        const workoutId = await insertWorkout(tx, alice);
        const bench = await insertWorkoutExercise(tx, workoutId, benchPress);
        await insertSet(tx, bench, 1, 100, 1);
        await tx.query('select public.finish_workout($1)', [workoutId]);
      });
      // 100 kg beats 70 kg for max_weight; Epley 100*(1+1/30)=103.33 beats 88.67
      expect(await personalRecords(db, alice, benchPress)).toEqual({
        estimated_1rm: 103.33,
        max_weight: 100,
      });
    });

    it('handles several exercises in one workout independently', async () => {
      await asUser(db, alice, async (tx) => {
        const workoutId = await insertWorkout(tx, alice);
        const sq = await insertWorkoutExercise(tx, workoutId, squat, 0);
        await insertSet(tx, sq, 1, 100, 5);
        await insertSet(tx, sq, 2, 120, 3);
        const bench = await insertWorkoutExercise(tx, workoutId, benchPress, 1);
        await insertSet(tx, bench, 1, 40, 10);
        await tx.query('select public.finish_workout($1)', [workoutId]);
      });
      expect((await personalRecords(db, alice, squat)).max_weight).toBe(120);
      expect((await personalRecords(db, alice, benchPress)).max_weight).toBe(100);
    });

    it("rejects finishing someone else's workout", async () => {
      const aliceWorkout = await asUser(db, alice, (tx) => insertWorkout(tx, alice));
      await expect(
        asUser(db, bob, (tx) => tx.query('select public.finish_workout($1)', [aliceWorkout])),
      ).rejects.toThrow(/not authorized/);
    });
  });

  describe('deleting a workout', () => {
    it('recomputes the personal records it held from the remaining workouts', async () => {
      const dave = await createUser(db, 'dave@example.com');
      const finishWith = (weight: number, reps: number) =>
        asUser(db, dave, async (tx) => {
          const workoutId = await insertWorkout(tx, dave);
          const bench = await insertWorkoutExercise(tx, workoutId, benchPress);
          await insertSet(tx, bench, 1, weight, reps);
          await tx.query('select public.finish_workout($1)', [workoutId]);
          return workoutId;
        });

      await finishWith(80, 5);
      const typo = await finishWith(625, 5); // e.g. "62.5" mistyped -- the record must not stick
      expect((await personalRecords(db, dave, benchPress)).max_weight).toBe(625);

      await asUser(db, dave, (tx) => tx.query('delete from public.workouts where id = $1', [typo]));

      expect(await personalRecords(db, dave, benchPress)).toEqual({
        max_weight: 80,
        estimated_1rm: 93.33,
      });
    });

    it('removes a record when no other workout has that exercise', async () => {
      const erin = await createUser(db, 'erin@example.com');
      const workoutId = await asUser(db, erin, async (tx) => {
        const id = await insertWorkout(tx, erin);
        const sq = await insertWorkoutExercise(tx, id, squat);
        await insertSet(tx, sq, 1, 100, 5);
        await tx.query('select public.finish_workout($1)', [id]);
        return id;
      });
      expect((await personalRecords(db, erin, squat)).max_weight).toBe(100);

      await asUser(db, erin, (tx) =>
        tx.query('delete from public.workouts where id = $1', [workoutId]),
      );

      expect(await personalRecords(db, erin, squat)).toEqual({});
    });

    it('refresh_personal_record repairs records orphaned before 0009 (backfill path)', async () => {
      const frank = await createUser(db, 'frank@example.com');
      await asUser(db, frank, async (tx) => {
        const id = await insertWorkout(tx, frank);
        const bench = await insertWorkoutExercise(tx, id, benchPress);
        await insertSet(tx, bench, 1, 90, 3);
        await tx.query('select public.finish_workout($1)', [id]);
      });
      // simulate a pre-0009 orphan: stale value, no set
      await db.query(
        `update public.personal_records set value = 400, set_id = null where user_id = $1 and record_type = 'max_weight'`,
        [frank],
      );
      await db.query(
        'select public.refresh_personal_record(id) from public.personal_records where set_id is null',
      );
      expect((await personalRecords(db, frank, benchPress)).max_weight).toBe(90);
    });

    it('refresh_personal_record is not callable by app users', async () => {
      await expect(
        asUser(db, alice, (tx) =>
          tx.query(`select public.refresh_personal_record(gen_random_uuid())`),
        ),
      ).rejects.toThrow(/permission denied/);
    });

    it("leaves other users' records alone", async () => {
      const before = await personalRecords(db, alice, benchPress);
      const bobWorkout = await asUser(db, bob, async (tx) => {
        const id = await insertWorkout(tx, bob);
        const bench = await insertWorkoutExercise(tx, id, benchPress);
        await insertSet(tx, bench, 1, 30, 5);
        await tx.query('select public.finish_workout($1)', [id]);
        return id;
      });
      await asUser(db, bob, (tx) =>
        tx.query('delete from public.workouts where id = $1', [bobWorkout]),
      );
      expect(await personalRecords(db, alice, benchPress)).toEqual(before);
    });
  });

  describe('row level security', () => {
    it("hides other users' workouts, sets and records", async () => {
      const counts = await asUser(db, bob, async (tx) => {
        const workouts = await tx.query<{ n: number }>(
          'select count(*)::int as n from public.workouts',
        );
        const sets = await tx.query<{ n: number }>('select count(*)::int as n from public.sets');
        const records = await tx.query<{ n: number }>(
          'select count(*)::int as n from public.personal_records',
        );
        return [workouts.rows[0].n, sets.rows[0].n, records.rows[0].n];
      });
      expect(counts).toEqual([0, 0, 0]);
    });

    it('rejects inserting a workout on behalf of another user', async () => {
      await expect(asUser(db, bob, (tx) => insertWorkout(tx, alice))).rejects.toThrow(
        /row-level security/,
      );
    });

    it("hides other users' custom exercises from everyone else", async () => {
      await asUser(db, alice, (tx) =>
        tx.query(
          `insert into public.exercises (name, category, equipment, target_muscle, is_custom, created_by)
           values ('Alices Secret Curl', 'upper arms', 'dumbbell', 'biceps', true, $1)`,
          [alice],
        ),
      );
      const visibleToBob = await asUser(db, bob, (tx) =>
        tx.query<Row>(`select name from public.exercises where name = 'Alices Secret Curl'`),
      );
      const visibleToAlice = await asUser(db, alice, (tx) =>
        tx.query<Row>(`select name from public.exercises where name = 'Alices Secret Curl'`),
      );
      expect(visibleToBob.rows).toHaveLength(0);
      expect(visibleToAlice.rows).toHaveLength(1);
    });

    it('still shows the shared exercise library to signed-in users', async () => {
      const rows = await asUser(db, bob, (tx) =>
        tx.query<Row>('select name from public.exercises where is_custom = false'),
      );
      expect(rows.rows.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('value constraints (0007)', () => {
    it('rejects negative set weight and reps', async () => {
      await expect(
        asUser(db, alice, async (tx) => {
          const workoutId = await insertWorkout(tx, alice);
          const bench = await insertWorkoutExercise(tx, workoutId, benchPress);
          await insertSet(tx, bench, 1, -5, 10);
        }),
      ).rejects.toThrow(/sets_weight_nonnegative/);

      await expect(
        asUser(db, alice, async (tx) => {
          const workoutId = await insertWorkout(tx, alice);
          const bench = await insertWorkoutExercise(tx, workoutId, benchPress);
          await insertSet(tx, bench, 1, 5, -1);
        }),
      ).rejects.toThrow(/sets_reps_nonnegative/);
    });
  });

  describe('delete_account', () => {
    it('is not callable without a signed-in user', async () => {
      await expect(
        asUser(db, null, (tx) => tx.query('select public.delete_account()')),
      ).rejects.toThrow(/permission denied/);
    });

    it("removes every row the user owns, including custom exercises they've trained with", async () => {
      const carol = await createUser(db, 'carol@example.com');
      await asUser(db, carol, async (tx) => {
        const custom = await tx.query<{ id: string }>(
          `insert into public.exercises (name, category, equipment, target_muscle, is_custom, created_by)
           values ('Carols Curl', 'upper arms', 'dumbbell', 'biceps', true, $1) returning id`,
          [carol],
        );
        const customId = custom.rows[0].id;

        const routine = await tx.query<{ id: string }>(
          `insert into public.routines (user_id, name) values ($1, 'Arms') returning id`,
          [carol],
        );
        const routineExercise = await tx.query<{ id: string }>(
          `insert into public.routine_exercises (routine_id, exercise_id, order_index) values ($1, $2, 0) returning id`,
          [routine.rows[0].id, customId],
        );
        await tx.query(
          'insert into public.routine_exercise_sets (routine_exercise_id, set_number, target_weight, target_reps) values ($1, 1, 10, 12)',
          [routineExercise.rows[0].id],
        );
        await tx.query(
          'insert into public.favorite_exercises (user_id, exercise_id) values ($1, $2)',
          [carol, customId],
        );

        const workoutId = await insertWorkout(tx, carol);
        const curl = await insertWorkoutExercise(tx, workoutId, customId);
        await insertSet(tx, curl, 1, 12, 10);
        const bench = await insertWorkoutExercise(tx, workoutId, benchPress, 1);
        await insertSet(tx, bench, 1, 40, 10);
        await tx.query('select public.finish_workout($1)', [workoutId]);
      });

      await asUser(db, carol, (tx) => tx.query('select public.delete_account()'));

      const leftovers = await db.query<{ n: number }>(
        `select (
           (select count(*) from auth.users where id = $1) +
           (select count(*) from public.profiles where id = $1) +
           (select count(*) from public.routines where user_id = $1) +
           (select count(*) from public.workouts where user_id = $1) +
           (select count(*) from public.personal_records where user_id = $1) +
           (select count(*) from public.favorite_exercises where user_id = $1) +
           (select count(*) from public.exercises where created_by = $1)
         )::int as n`,
        [carol],
      );
      expect(leftovers.rows[0].n).toBe(0);
      // the shared library row Carol trained with must survive
      const bench = await db.query('select 1 from public.exercises where id = $1', [benchPress]);
      expect(bench.rows).toHaveLength(1);
    });
  });
});
