/// <reference types="node" />
// Local stand-in for a Supabase project, for browser smoke tests of the web build.
//
// Database: PGlite with the real migrations (same harness as the SQL tests), so RLS, triggers,
// constraints and the finish_workout/delete_account RPCs behave exactly as in production.
// HTTP: the small subset of PostgREST + GoTrue that supabase-js actually uses in this app
// (flat selects, eq/neq/gt/gte/lt/lte/in/is/ilike/not filters, order, limit, insert/update/delete
// with `return=representation`, `.single()`, rpc). Every REST request runs as the signed-in user
// (role `authenticated` + JWT sub), exactly like PostgREST does.
//
// Not a general PostgREST implementation -- only what this app needs. Run: npx tsx e2e/fake-supabase.ts
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import type { PGlite } from '@electric-sql/pglite';

import { asUser, createTestDb, createUser } from '../supabase/tests/test-db';

export const E2E_EMAIL = 'e2e@example.com';
export const E2E_PASSWORD = 'correct-horse-battery';

const IDENT = /^[a-z_][a-z0-9_]*$/;
const FILTER_OPS: Record<string, string> = {
  eq: '=',
  neq: '<>',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  ilike: 'ilike',
  like: 'like',
};

function ident(name: string): string {
  if (!IDENT.test(name)) throw new HttpError(400, `bad identifier: ${name}`);
  return `"${name}"`;
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function base64url(value: object | string): string {
  return Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString(
    'base64url',
  );
}

function makeJwt(userId: string, email: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url({ alg: 'HS256', typ: 'JWT' });
  const payload = base64url({
    sub: userId,
    email,
    role: 'authenticated',
    aud: 'authenticated',
    iat: now,
    exp: now + 3600,
  });
  return `${header}.${payload}.${base64url('fake-signature')}`;
}

function userIdFromRequest(req: IncomingMessage): string | null {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null; // the anon key
  }
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString();
  return text ? JSON.parse(text) : undefined;
}

function parseValue(raw: string): string {
  return raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw;
}

// Turns PostgREST query params into a WHERE clause with positional parameters.
function buildWhere(params: URLSearchParams, values: unknown[]): string {
  const clauses: string[] = [];
  for (const [key, rawValue] of params) {
    if (['select', 'order', 'limit', 'offset', 'columns', 'on_conflict'].includes(key)) continue;
    const column = ident(key);
    let expression = rawValue;
    let negate = false;
    if (expression.startsWith('not.')) {
      negate = true;
      expression = expression.slice(4);
    }
    const dot = expression.indexOf('.');
    const op = expression.slice(0, dot);
    const operand = expression.slice(dot + 1);
    let clause: string;
    if (op === 'is') {
      const keyword = { null: 'null', true: 'true', false: 'false' }[operand];
      if (!keyword) throw new HttpError(400, `bad is operand: ${operand}`);
      clause = `${column} is ${keyword}`;
    } else if (op === 'in') {
      const items = operand
        .replace(/^\(|\)$/g, '')
        .split(',')
        .filter((item) => item.length > 0)
        .map(parseValue);
      if (items.length === 0) {
        clause = 'false';
      } else {
        clause = `${column}::text in (${items.map((item) => {
          values.push(item);
          return `$${values.length}`;
        })})`;
      }
    } else if (FILTER_OPS[op]) {
      const isPattern = op === 'ilike' || op === 'like';
      values.push(isPattern ? operand.replaceAll('*', '%') : parseValue(operand));
      // untyped parameter: Postgres infers it from the column, so numbers/timestamps compare correctly
      clause = `${isPattern ? `${column}::text` : column} ${FILTER_OPS[op]} $${values.length}`;
    } else {
      throw new HttpError(400, `unsupported filter: ${key}=${rawValue}`);
    }
    clauses.push(negate ? `not (${clause})` : clause);
  }
  return clauses.length ? `where ${clauses.join(' and ')}` : '';
}

function buildSelectList(params: URLSearchParams): string {
  const select = params.get('select') ?? '*';
  if (select === '*') return '*';
  return select
    .split(',')
    .map((column) => column.trim())
    .map((column) => {
      if (column === '*') return '*';
      if (column.includes('('))
        throw new HttpError(400, `embedded selects are not supported: ${column}`);
      return ident(column);
    })
    .join(', ');
}

function buildOrder(params: URLSearchParams): string {
  const order = params.get('order');
  if (!order) return '';
  const parts = order.split(',').map((part) => {
    const [column, ...modifiers] = part.split('.');
    let sql = ident(column);
    if (modifiers.includes('desc')) sql += ' desc';
    if (modifiers.includes('nullsfirst')) sql += ' nulls first';
    if (modifiers.includes('nullslast')) sql += ' nulls last';
    return sql;
  });
  return `order by ${parts.join(', ')}`;
}

// Supabase's API caps every response at "Max rows" (default 1000) -- silently, without an error.
// Mirrored here so code that assumes it gets every row fails in tests the way it would in prod.
export const MAX_ROWS = 1000;
export const MAX_URL_LENGTH = 8 * 1024;

function buildLimit(params: URLSearchParams): string {
  const requested = params.get('limit');
  const limit = Math.min(requested ? Number(requested) : MAX_ROWS, MAX_ROWS);
  const offset = params.get('offset');
  return `limit ${limit} ${offset ? `offset ${Number(offset)}` : ''}`;
}

async function handleRest(db: PGlite, req: IncomingMessage, url: URL, userId: string | null) {
  const path = url.pathname.replace(/^\/rest\/v1\//, '');
  const params = url.searchParams;
  const prefer = req.headers.prefer ?? '';
  const wantsSingle = (req.headers.accept ?? '').includes('application/vnd.pgrst.object+json');

  const rows = await asUser(db, userId, async (tx) => {
    if (path.startsWith('rpc/')) {
      const fn = ident(path.slice(4));
      const args = ((await readBody(req)) ?? {}) as Record<string, unknown>;
      const names = Object.keys(args);
      const values = names.map((name) => args[name]);
      const argList = names.map((name, index) => `${ident(name)} => $${index + 1}`).join(', ');
      const result = await tx.query<Record<string, unknown>>(
        `select * from public.${fn}(${argList})`,
        values,
      );
      return result.rows;
    }

    const table = `public.${ident(path)}`;
    const values: unknown[] = [];
    const returning = prefer.includes('return=representation');

    if (req.method === 'GET' || req.method === 'HEAD') {
      const where = buildWhere(params, values);
      const sql = `select ${buildSelectList(params)} from ${table} ${where} ${buildOrder(params)} ${buildLimit(params)}`;
      return (await tx.query<Record<string, unknown>>(sql, values)).rows;
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const records = (Array.isArray(body) ? body : [body]) as Record<string, unknown>[];
      const columns = Array.from(new Set(records.flatMap((record) => Object.keys(record))));
      const tuples = records.map(
        (record) =>
          `(${columns
            .map((column) => {
              if (!(column in record)) return 'default';
              const value = record[column];
              values.push(
                value !== null && typeof value === 'object' && !Array.isArray(value)
                  ? JSON.stringify(value)
                  : value,
              );
              return `$${values.length}`;
            })
            .join(', ')})`,
      );
      const sql = `with written as (insert into ${table} (${columns.map(ident).join(', ')}) values ${tuples.join(', ')} returning *)
        select ${returning ? buildSelectList(params) : '1'} from written ${returning ? buildOrder(params) : ''}`;
      return (await tx.query<Record<string, unknown>>(sql, values)).rows;
    }

    if (req.method === 'PATCH') {
      const body = (await readBody(req)) as Record<string, unknown>;
      const assignments = Object.entries(body).map(([column, value]) => {
        values.push(value);
        return `${ident(column)} = $${values.length}`;
      });
      const where = buildWhere(params, values);
      const sql = `with written as (update ${table} set ${assignments.join(', ')} ${where} returning *)
        select ${returning ? buildSelectList(params) : '1'} from written`;
      return (await tx.query<Record<string, unknown>>(sql, values)).rows;
    }

    if (req.method === 'DELETE') {
      const where = buildWhere(params, values);
      const sql = `with written as (delete from ${table} ${where} returning *) select ${returning ? buildSelectList(params) : '1'} from written`;
      return (await tx.query<Record<string, unknown>>(sql, values)).rows;
    }

    throw new HttpError(405, `method ${req.method} not supported`);
  });

  if (path.startsWith('rpc/')) {
    // scalar/void functions come back as a single row with the function name as column
    const [first] = rows;
    if (!first) return null;
    const keys = Object.keys(first);
    if (rows.length === 1 && keys.length === 1 && keys[0] === path.slice(4)) return first[keys[0]];
    return rows.length === 1 ? first : rows;
  }
  if (wantsSingle) {
    if (rows.length !== 1)
      throw new HttpError(
        406,
        `JSON object requested, multiple (or no) rows returned (${rows.length})`,
      );
    return rows[0];
  }
  if (req.method !== 'GET' && !prefer.includes('return=representation')) return undefined;
  return rows;
}

async function handleAuth(db: PGlite, req: IncomingMessage, url: URL) {
  const path = url.pathname.replace(/^\/auth\/v1\//, '');
  const userResponse = (id: string, email: string) => ({
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: new Date().toISOString(),
    app_metadata: { provider: 'email' },
    user_metadata: {},
    created_at: new Date().toISOString(),
  });
  const session = (id: string, email: string) => ({
    access_token: makeJwt(id, email),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: `refresh-${id}`,
    user: userResponse(id, email),
  });

  if (path === 'token') {
    const body = (await readBody(req)) as Record<string, string>;
    const grantType = url.searchParams.get('grant_type');
    let email: string | undefined;
    if (grantType === 'password') {
      if (body.email !== E2E_EMAIL || body.password !== E2E_PASSWORD) {
        throw new HttpError(
          400,
          JSON.stringify({ code: 'invalid_credentials', message: 'Invalid login credentials' }),
        );
      }
      email = body.email;
    } else if (grantType === 'refresh_token') {
      const id = body.refresh_token?.replace(/^refresh-/, '');
      const result = await db.query<{ email: string }>(
        'select email from auth.users where id::text = $1',
        [id],
      );
      email = result.rows[0]?.email;
    }
    const result = await db.query<{ id: string }>('select id from auth.users where email = $1', [
      email ?? '',
    ]);
    if (!result.rows[0])
      throw new HttpError(
        400,
        JSON.stringify({ code: 'invalid_grant', message: 'Invalid Refresh Token' }),
      );
    return session(result.rows[0].id, email!);
  }
  if (path === 'logout') return undefined;
  if (path === 'user') {
    const id = userIdFromRequest(req);
    const result = await db.query<{ email: string }>(
      'select email from auth.users where id::text = $1',
      [id ?? ''],
    );
    if (!result.rows[0])
      throw new HttpError(
        401,
        JSON.stringify({ code: 'user_not_found', message: 'User not found' }),
      );
    if (req.method === 'PUT') await readBody(req);
    return userResponse(id!, result.rows[0].email);
  }
  if (path === 'recover' || path === 'signup') {
    await readBody(req);
    return {};
  }
  throw new HttpError(404, `auth endpoint ${path} not implemented`);
}

const FIXTURE_EXERCISES: [string, string, string, string][] = [
  ['Bench Press', 'chest', 'barbell', 'pectorals'],
  ['Incline Dumbbell Press', 'chest', 'dumbbell', 'pectorals'],
  ['Squat', 'upper legs', 'barbell', 'quads'],
  ['Romanian Deadlift', 'upper legs', 'barbell', 'hamstrings'],
  ['Pull Up', 'back', 'body weight', 'lats'],
  ['Barbell Row', 'back', 'barbell', 'upper back'],
  ['Overhead Press', 'shoulders', 'barbell', 'delts'],
  ['Lateral Raise', 'shoulders', 'dumbbell', 'delts'],
  ['Barbell Curl', 'upper arms', 'barbell', 'biceps'],
  ['Triceps Pushdown', 'upper arms', 'cable', 'triceps'],
  ['Plank', 'waist', 'body weight', 'abs'],
  ['Calf Raise', 'lower legs', 'body weight', 'calves'],
];

export async function startFakeSupabase(port = 54321) {
  const db = await createTestDb();
  await createUser(db, E2E_EMAIL);
  for (const [name, category, equipment, target] of FIXTURE_EXERCISES) {
    await db.query(
      `insert into public.exercises (name, category, equipment, target_muscle, instructions)
       values ($1, $2, $3, $4, $5)`,
      [
        name,
        category,
        equipment,
        target,
        JSON.stringify({ en: [`Do the ${name.toLowerCase()} with control.`] }),
      ],
    );
  }

  const requestLog: string[] = [];
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS,HEAD');
    res.setHeader('Access-Control-Expose-Headers', '*');
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);
    try {
      // Like an nginx-style proxy in front of PostgREST (8 KB request-line buffer): long `in.(...)`
      // id lists in a GET URL fail there with 414 rather than reaching the database.
      if ((req.url ?? '').length > MAX_URL_LENGTH) throw new HttpError(414, 'URI Too Long');
      let body: unknown;
      if (url.pathname.startsWith('/rest/v1/'))
        body = await handleRest(db, req, url, userIdFromRequest(req));
      else if (url.pathname.startsWith('/auth/v1/')) body = await handleAuth(db, req, url);
      else throw new HttpError(404, 'not found');
      requestLog.push(`${req.method} ${url.pathname}${url.search} -> 200`);
      if (body === undefined) {
        res.writeHead(204).end();
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
      }
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 400;
      const message = (error as Error).message;
      requestLog.push(`${req.method} ${url.pathname}${url.search} -> ${status} ${message}`);
      let payload: object;
      try {
        payload = JSON.parse(message);
      } catch {
        payload = { code: String(status), message, details: null, hint: null };
      }
      res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(payload));
    }
  });

  await new Promise<void>((resolve) => server.listen(port, resolve));
  return {
    db,
    requestLog,
    url: `http://localhost:${port}`,
    close: async () => {
      await new Promise((resolve) => server.close(resolve));
      await db.close();
    },
  };
}

if (require.main === module) {
  startFakeSupabase().then(({ url }) => console.log(`fake supabase listening on ${url}`));
}
