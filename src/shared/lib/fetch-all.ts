import type { PostgrestError } from '@supabase/supabase-js';

// Two Supabase limits that queries over a user's whole history run into:
// - every response is capped at "Max rows" (1000 by default) -- silently, no error, so e.g. the
//   home history showed wrong set counts once a user had logged ~1000 sets;
// - an `in.(...)` filter puts every id into the GET URL, which the proxy in front of PostgREST
//   rejects (414) once the list is a few KB long (~200 UUIDs).
// Found with src/shared/lib/history-at-scale.integration.test.ts.
const PAGE_SIZE = 1000;
const ID_CHUNK_SIZE = 100; // ~4 KB of UUIDs per request

interface RangeQuery<T> {
  range(from: number, to: number): PromiseLike<{ data: T[] | null; error: PostgrestError | null }>;
}

/**
 * Every row of a query, fetched page by page. The query's order must end in a unique column
 * (e.g. `.order('id')`), otherwise rows can repeat or go missing across page boundaries.
 */
export async function fetchAllPages<T>(buildQuery: () => RangeQuery<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

/**
 * fetchAllPages for an `in` filter over any number of ids: one query per chunk of ids, results
 * concatenated in chunk order (rows of one id always come from the same chunk, so per-id order
 * is preserved).
 */
export async function fetchAllIn<T>(
  ids: readonly string[],
  buildQuery: (chunk: string[]) => RangeQuery<T>,
): Promise<T[]> {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += ID_CHUNK_SIZE) {
    chunks.push(ids.slice(index, index + ID_CHUNK_SIZE));
  }
  const results = await Promise.all(chunks.map((chunk) => fetchAllPages(() => buildQuery(chunk))));
  return results.flat();
}
