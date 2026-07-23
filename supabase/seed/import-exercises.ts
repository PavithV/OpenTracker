/**
 * Imports exercises-dataset-main/data/exercises.json into Supabase:
 *   1. Uploads each exercise's thumbnail (image) and animation (gif) to the
 *      "exercise-media" storage bucket (created automatically if missing).
 *   2. Upserts the exercise row (keyed on external_id) with the resulting
 *      public URLs, keeping the exercises table in sync with the dataset.
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (see .env.example) —
 * the service role key bypasses RLS and must never ship in the app bundle.
 *
 * Usage: npm run db:seed
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const BUCKET = 'exercise-media';
const DATASET_ROOT = path.resolve(__dirname, '../../exercises-dataset-main');
const CONCURRENCY = 15;

interface DatasetExercise {
  id: string;
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  instructions: Record<string, string>;
  muscle_group: string;
  secondary_muscles: string[];
  target: string;
  media_id: string;
  image: string;
  gif_url: string;
  attribution: string;
}

function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

const supabaseUrl = assertEnv('EXPO_PUBLIC_SUPABASE_URL');
const serviceRoleKey = assertEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureBucket(): Promise<void> {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (buckets.some((bucket) => bucket.name === BUCKET)) return;

  const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (createError) throw createError;
  console.log(`Created public storage bucket "${BUCKET}".`);
}

async function uploadMedia(relativePath: string, contentType: string): Promise<string> {
  const absolutePath = path.join(DATASET_ROOT, relativePath);
  const fileBuffer = await readFile(absolutePath);

  const { error } = await supabase.storage.from(BUCKET).upload(relativePath, fileBuffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(relativePath);
  return data.publicUrl;
}

async function importExercise(exercise: DatasetExercise): Promise<void> {
  const [imageUrl, gifUrl] = await Promise.all([
    uploadMedia(exercise.image, 'image/jpeg'),
    uploadMedia(exercise.gif_url, 'image/gif'),
  ]);

  const { error } = await supabase.from('exercises').upsert(
    {
      external_id: exercise.id,
      name: exercise.name,
      category: exercise.body_part,
      equipment: exercise.equipment,
      target_muscle: exercise.target,
      secondary_muscles: exercise.secondary_muscles,
      instructions: exercise.instructions,
      image_url: imageUrl,
      gif_url: gifUrl,
      attribution: exercise.attribution,
      is_custom: false,
    },
    { onConflict: 'external_id' },
  );
  if (error) throw error;
}

async function runWithConcurrency<T>(items: T[], limit: number, task: (item: T, index: number) => Promise<void>) {
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      await task(items[index], index);
      completed += 1;
      if (completed % 50 === 0 || completed === items.length) {
        console.log(`  ${completed}/${items.length} exercises imported`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

async function main() {
  console.log('Reading dataset...');
  const raw = await readFile(path.join(DATASET_ROOT, 'data/exercises.json'), 'utf-8');
  const exercises: DatasetExercise[] = JSON.parse(raw);
  console.log(`Found ${exercises.length} exercises.`);

  await ensureBucket();

  console.log('Uploading media and upserting exercise rows...');
  await runWithConcurrency(exercises, CONCURRENCY, importExercise);

  console.log('Done.');
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
