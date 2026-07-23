# Datenbank

Überarbeitetes, skalierbares Schema (PostgreSQL / Supabase). Kernänderungen gegenüber dem ersten Entwurf: UUID-Primärschlüssel statt String-IDs, `profiles` statt eigener `users`-Tabelle (Supabase verwaltet `auth.users`), vollständiges Exercise-Schema passend zu `exercises-dataset-main/data/exercises.schema.json`, Satz-Typen, zeitbasierte Sätze, Routinen-Sollwerte, Soft-Deletes, eigene `personal_records`-Tabelle, RLS pro Tabelle.

## profiles (1:1 zu auth.users)

- `id` uuid PK → `auth.users.id`
- `display_name` text
- `avatar_url` text
- `unit_preference` text (`'kg'` | `'lb'`), default `'kg'`
- `created_at`, `updated_at`

## exercises

- `id` uuid PK
- `external_id` text UNIQUE — Dataset-ID, z. B. `"0001"`
- `name` text
- `category` text — = `body_part` (enum: back, cardio, chest, lower arms, lower legs, neck, shoulders, upper arms, upper legs, waist)
- `equipment` text
- `target_muscle` text
- `secondary_muscles` text[]
- `instructions` jsonb — `{ en, es, it, tr, ru, zh, hi, pl, ko, fr }`
- `image_url` text
- `gif_url` text
- `attribution` text — Pflichtfeld, muss in der UI angezeigt werden (© Gym visual)
- `is_custom` boolean, default `false`
- `created_by` uuid NULL → `profiles.id` — nur bei `is_custom = true`
- `created_at`

## routines

- `id` uuid PK
- `user_id` uuid → `profiles.id`
- `name` text
- `notes` text
- `archived_at` timestamptz NULL — Soft Delete
- `created_at`, `updated_at`

## routine_exercises

- `id` uuid PK
- `routine_id` uuid → `routines.id`
- `exercise_id` uuid → `exercises.id`
- `order_index` int
- `target_sets` int
- `target_reps_min` int
- `target_reps_max` int NULL
- `target_weight` numeric NULL
- `rest_seconds` int NULL

## workouts

- `id` uuid PK
- `user_id` uuid → `profiles.id`
- `routine_id` uuid NULL → `routines.id`
- `name` text
- `started_at` timestamptz
- `ended_at` timestamptz NULL
- `duration_seconds` int — bei `ended_at` berechnet/gecacht
- `total_volume` numeric — gecacht, per Trigger/RPC aktualisiert
- `notes` text
- `created_at`

## workout_exercises

- `id` uuid PK
- `workout_id` uuid → `workouts.id`
- `exercise_id` uuid → `exercises.id`
- `order_index` int
- `notes` text

## sets

- `id` uuid PK
- `workout_exercise_id` uuid → `workout_exercises.id`
- `set_number` int
- `set_type` text — `'warmup'` | `'working'` | `'dropset'` | `'failure'`
- `weight` numeric NULL
- `reps` int NULL
- `duration_seconds` int NULL — für zeitbasierte Übungen (Plank etc.)
- `rpe` numeric NULL
- `completed` boolean, default `false`
- `completed_at` timestamptz NULL

## personal_records

- `id` uuid PK
- `user_id` uuid → `profiles.id`
- `exercise_id` uuid → `exercises.id`
- `record_type` text — `'max_weight'` | `'max_volume'` | `'max_reps'` | `'estimated_1rm'`
- `value` numeric
- `set_id` uuid → `sets.id`
- `achieved_at` timestamptz
- UNIQUE (`user_id`, `exercise_id`, `record_type`)

## Row Level Security

Jede nutzerbezogene Tabelle (`routines`, `workouts`, `sets` via Join über `workout_exercises`, `personal_records`, …) bekommt eine Policy `user_id = auth.uid()`. `exercises` ist lesend für alle offen; Schreiben nur wenn `is_custom = true AND created_by = auth.uid()`.

## Indizes

- `workouts(user_id, started_at desc)`
- `sets(workout_exercise_id)`
- `routine_exercises(routine_id, order_index)`
- `exercises(category)`
- GIN-Index auf `exercises(secondary_muscles)`

## Berechnungslogik

`total_volume`, `duration_seconds` und `personal_records` werden serverseitig per Postgres-Trigger oder RPC-Funktion `finish_workout(workout_id)` aktualisiert — nicht client-seitig, damit die Logik nicht dupliziert wird, sobald neben Mobile später auch Web existiert.
