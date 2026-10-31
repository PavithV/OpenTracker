# Datenbank

Überarbeitetes, skalierbares Schema (PostgreSQL / Supabase). Kernänderungen gegenüber dem ersten Entwurf: UUID-Primärschlüssel statt String-IDs, `profiles` statt eigener `users`-Tabelle (Supabase verwaltet `auth.users`), vollständiges Exercise-Schema passend zu `exercises-dataset-main/data/exercises.schema.json`, Satz-Typen, zeitbasierte Sätze, Routinen-Sollwerte, Soft-Deletes, eigene `personal_records`-Tabelle, RLS pro Tabelle.

**Stand: nach Migration `0009_recompute_personal_records_on_workout_delete.sql`.** Alle Migrationen werden automatisch gegen ein echtes Postgres (PGlite) getestet: `npm test` → `supabase/tests/migrations.test.ts`. Für eine vollständige DB-/Sicherheitsanalyse (fehlende Indizes, fehlende Wertebereichs-Constraints, Security-Advisor-Befunde) siehe `PRODUCT_AUDIT.md`, Abschnitte 6 und 7.

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
- `rest_seconds` int NULL

Die früheren Aggregat-Spalten (`target_sets`, `target_reps_min`, `target_reps_max`, `target_weight`) wurden in Migration `0005_add_routine_exercise_sets.sql` entfernt und durch die untenstehende `routine_exercise_sets`-Tabelle ersetzt (echtes Pro-Satz-Zielmodell statt eines Aggregats).

## routine_exercise_sets

- `id` uuid PK
- `routine_exercise_id` uuid → `routine_exercises.id` (`on delete cascade`)
- `set_number` int
- `target_weight` numeric NULL — CHECK `>= 0` (0007)
- `target_reps` int NULL — CHECK `>= 0` (0007)

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
- `weight` numeric NULL — CHECK `>= 0` (0007)
- `reps` int NULL — CHECK `>= 0` (0007)
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
- `set_id` uuid → `sets.id` (`on delete set null`)
- `achieved_at` timestamptz
- UNIQUE (`user_id`, `exercise_id`, `record_type`)

Tatsächlich befüllt werden nur `max_weight` und `estimated_1rm` (Epley, `weight * (1 + reps/30)`, auf 2 Stellen gerundet) — beide von `finish_workout`. Rekorde steigen dort nur. Wird ein Workout gelöscht, setzt die FK-Kaskade `set_id` der betroffenen Rekorde auf NULL; ein Trigger (0009) berechnet sie dann aus den verbleibenden Workouts neu bzw. löscht sie, wenn nichts mehr übrig ist.

## favorite_exercises

- `user_id` uuid → `profiles.id`
- `exercise_id` uuid → `exercises.id`
- `created_at`
- PK (`user_id`, `exercise_id`)

## Row Level Security

Jede nutzerbezogene Tabelle (`routines`, `workouts`, `sets` via Join über `workout_exercises`, `personal_records`, …) bekommt eine Policy `user_id = auth.uid()`. `exercises`: die gemeinsame Bibliothek (`is_custom = false`) ist für alle lesbar, eigene Übungen nur für ihren Ersteller (seit 0008 — vorher waren eigene Übungen aller Nutzer für alle lesbar und tauchten im Picker anderer auf). Schreiben nur wenn `is_custom = true AND created_by = auth.uid()`.

## Indizes

- `workouts(user_id, started_at desc)`
- `sets(workout_exercise_id)`
- `routine_exercises(routine_id, order_index)`
- `routine_exercise_sets(routine_exercise_id, set_number)`
- `workout_exercises(workout_id)` und `workout_exercises(exercise_id)` (0007)
- `exercises(category)`
- GIN-Index auf `exercises(secondary_muscles)`

## Funktionen & Trigger

| Name | Art | Zweck |
| --- | --- | --- |
| `handle_new_user()` | Trigger auf `auth.users` (insert) | legt die `profiles`-Zeile an |
| `finish_workout(p_workout_id)` | RPC, security definer | setzt `ended_at`/`duration_seconds`/`total_volume` (nur abgeschlossene Sätze mit Gewicht und Wdh.), aktualisiert `max_weight`/`estimated_1rm`; prüft `auth.uid()` |
| `delete_account()` | RPC, security definer, nur `authenticated` | löscht Routinen, Workouts, eigene Übungen und dann den Auth-User (Rest per Kaskade). Seit 0008 in dieser Reihenfolge — vorher schlug sie fehl, sobald eine eigene Übung in einer Routine/einem Workout steckte |
| `refresh_personal_record(p_record_id)` | intern (für App-Nutzer gesperrt) | berechnet einen Rekord aus den verbleibenden Workouts neu oder löscht ihn (0009) |
| `recompute_orphaned_personal_record()` | Trigger auf `personal_records` (update of `set_id` → NULL) | ruft obige Funktion auf, wenn eine Kaskade einem Rekord den Satz entzieht (0009) |

Berechnungen laufen serverseitig, nicht im Client, damit die Logik nicht dupliziert wird, sobald neben Mobile später auch Web existiert.

## Migrationen

| Datei | Inhalt |
| --- | --- |
| `0001_init.sql` | Grundschema, RLS, `finish_workout` |
| `0002_fix_finish_workout_personal_records.sql` | ein PR-Upsert pro Übung statt pro Satz |
| `0003_add_estimated_1rm_personal_record.sql` | `estimated_1rm` |
| `0004_add_favorite_exercises.sql` | Favoriten |
| `0005_add_routine_exercise_sets.sql` | Pro-Satz-Ziele für Routinen |
| `0006_add_delete_account.sql` | Konto-Löschung |
| `0007_add_workout_exercises_indexes_and_value_constraints.sql` | Indizes + CHECK-Constraints |
| `0008_fix_delete_account_and_custom_exercise_visibility.sql` | `delete_account`-Reihenfolge, eigene Übungen nur für den Ersteller sichtbar |
| `0009_recompute_personal_records_on_workout_delete.sql` | Rekorde nach Workout-Löschung neu berechnen + einmaliger Backfill |
