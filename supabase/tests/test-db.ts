// In-process Postgres (PGlite, WASM) running the real migrations from supabase/migrations/, plus
// a minimal stand-in for the parts of Supabase's platform schema those migrations depend on:
// `auth.users`, `auth.uid()`, and the `anon`/`authenticated` roles with Supabase's default grants.
// Lets the SQL itself (finish_workout, delete_account, constraints, RLS) be tested without
// Docker, a local Supabase stack, or the live project (no-test-signups rule, see TODO.md).
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { PGlite, types, type Transaction } from '@electric-sql/pglite';

const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

// Mirrors what the Supabase platform provides before any project migration runs.
const SUPABASE_PLATFORM_STUB = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;

  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  -- Same definition Supabase ships: the JWT "sub" claim of the current request.
  create function auth.uid() returns uuid
  language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant execute on function auth.uid() to anon, authenticated, service_role;

  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

export function listMigrations(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

export async function createTestDb(): Promise<PGlite> {
  // Dynamic import: this contrib entry point ships as ESM only, and supabase/tsconfig.json
  // type-checks these files as CommonJS (node16 module resolution).
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  // PostgREST serialises numeric columns as JSON numbers; PGlite returns them as strings by default.
  const db = await PGlite.create({
    extensions: { pgcrypto },
    parsers: { [types.NUMERIC]: (value: string) => Number(value) },
  });
  await db.exec(SUPABASE_PLATFORM_STUB);
  for (const file of listMigrations()) {
    try {
      await db.exec(readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
    } catch (error) {
      throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
    }
  }
  return db;
}

export async function createUser(db: PGlite, email: string): Promise<string> {
  const result = await db.query<{ id: string }>(
    'insert into auth.users (email) values ($1) returning id',
    [email],
  );
  return result.rows[0].id;
}

// Runs `fn` the way PostgREST runs a request for a signed-in user: inside a transaction, as the
// `authenticated` role, with the JWT "sub" claim set -- so RLS and auth.uid() behave as in prod.
export async function asUser<T>(
  db: PGlite,
  userId: string | null,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${userId ? 'authenticated' : 'anon'}`);
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId ?? '']);
    return fn(tx);
  });
}

export async function insertExercise(
  db: PGlite,
  values: {
    name: string;
    category?: string;
    isCustom?: boolean;
    createdBy?: string | null;
    targetMuscle?: string;
  },
): Promise<string> {
  const result = await db.query<{ id: string }>(
    `insert into public.exercises (name, category, equipment, target_muscle, is_custom, created_by)
     values ($1, $2, 'barbell', $3, $4, $5) returning id`,
    [
      values.name,
      values.category ?? 'chest',
      values.targetMuscle ?? 'pectorals',
      values.isCustom ?? false,
      values.createdBy ?? null,
    ],
  );
  return result.rows[0].id;
}
