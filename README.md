# OpenTracker

Fitness-Tracking-App (Expo + React Native + Supabase). Siehe `PROJECT_OVERVIEW.md`, `MVP.md`, `TECH_STACK.md`, `ARCHITECTURE.md`, `DATABASE.md` und `ROADMAP.md` für das vollständige Konzept.

## Setup

1. **Supabase-Projekt anlegen** unter [supabase.com](https://supabase.com).
2. **Migration anwenden**: Inhalt von `supabase/migrations/0001_init.sql` im Supabase SQL-Editor ausführen (legt alle Tabellen, RLS-Policies und die `finish_workout`-Funktion an).
3. **Env-Datei anlegen**: `.env.example` nach `.env` kopieren und mit den Projekt-Credentials (Settings → API) befüllen.
4. **Dependencies installieren**: `npm install`
5. **Übungen importieren**: Das Dataset ist nicht Teil des Repos (siehe `.gitignore`) — den Ordner `exercises-dataset-main/` (mit `data/exercises.json` und den zugehörigen Bild-/GIF-Dateien) lokal ins Projekt-Root legen, dann `npm run db:seed` ausführen. Das Skript lädt die Medien in den Supabase-Storage-Bucket `exercise-media` und befüllt die `exercises`-Tabelle.
6. **App starten**: `npm run start` (dann `i`/`a` für iOS/Android-Simulator oder mit Expo Go scannen)

## Scripts

| Befehl | Zweck |
|---|---|
| `npm run start` | Expo-Dev-Server starten |
| `npm run ios` / `npm run android` | Direkt auf Simulator/Emulator starten |
| `npm run lint` | ESLint |
| `npm run format` | Prettier über das gesamte Projekt |
| `npm run db:seed` | Exercise-Dataset in Supabase importieren |

## Status

Phase 1 der Roadmap (Projekt-Setup, Navigation, Dark Mode, Design System, Supabase-Anbindung, Authentication, Exercise-Seed-Skript) ist umgesetzt. Die Screens der einzelnen Tabs sind bewusst noch Platzhalter — Phase 2 (`ROADMAP.md`) baut Workout-Tracking, Historie und Profil-Statistiken darauf auf.
