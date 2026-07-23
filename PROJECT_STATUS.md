# Project Status

Stand: 2026-07-23, Ende der Session, in der Phase 1 der Roadmap umgesetzt wurde.

## Kurzfassung

Der App-Code für Phase 1 ("Projekt erstellen, Navigation, Dark Mode, Design System, Supabase verbinden, Authentication, Exercise-Seed-Skript") ist vollständig geschrieben, type-check- und lint-sauber, und per Metro-Export als Smoke-Test erfolgreich gebündelt worden. **Noch nicht erledigt: Das reale Supabase-Projekt ist noch nicht provisioniert** — Migration wurde noch nicht angewendet, Übungen wurden noch nicht importiert, es gibt noch keine `.env`. Das ist der nächste Schritt in der neuen Session (siehe `TODO.md`).

## Git

3 Commits auf `master`:

1. `35d48e3` — Initial commit (create-expo-app-Scaffold)
2. `886c606` — Scaffold OpenTracker Phase 1 (Expo Router, Design System, Supabase-Client, DB-Migration, Seed-Skript)
3. `fc079b5` — Supabase MCP-Server-Config + Agent Skills

`exercises-dataset-main/` ist weiterhin **untracked** (bewusst noch nicht committet — siehe `TODO.md`, Punkt zur Entscheidung ob/wie das Dataset ins Repo gehört).

## Was funktioniert (verifiziert)

- `npx tsc --noEmit` → sauber (App-Code und `supabase/seed` haben getrennte `tsconfig.json`s)
- `npm run lint` (ESLint + Prettier-Kompatibilität) → sauber
- `npx expo-doctor` → 20/20 Checks bestanden
- `npx expo export --platform ios` (reiner Bundling-Smoke-Test ohne Simulator) → erfolgreich, 3646 Module gebündelt

**Nicht verifiziert:** Kein Lauf auf echtem Simulator/Gerät/Expo Go — dafür fehlte in dieser Session die Möglichkeit. Auch keine Laufzeit-Tests gegen ein echtes Supabase-Backend (siehe unten).

## Implementierte Features (Phase 1)

- **Navigation**: Expo Router mit `Stack.Protected`-Auth-Gate — `(auth)` (Sign-in/Sign-up) vs. `(tabs)` (Home/Training/Profil); Stub-Routen für `workout/active`, `workout/[id]`, `routine/create`, `routine/[id]/edit`, `exercise/picker`, `exercise/[id]`
- **Dark Mode**: `userInterfaceStyle: "automatic"` + NativeWind `darkMode: 'class'`, alle Screens/Komponenten unterstützen beide Modi
- **Design System**: Design-Tokens (Farben, Spacing, Radius) in `tailwind.config.js`; Basis-Komponenten `Button`, `Card`, `Input`, `Screen`, `EmptyState` in `src/shared/components/`
- **Supabase-Client**: typisiert (`src/shared/types/database.types.ts`, handgeschrieben passend zu `DATABASE.md` — noch nicht durch `supabase gen types` ersetzt, da noch kein Live-Projekt verbunden), Session-Handling über Zustand-Store (`src/store/session.store.ts`)
- **Authentication**: funktionierende Sign-in/Sign-up-Screens gegen Supabase Auth (`src/features/auth/`), inkl. Zod-Validierung
- **DB-Schema**: `supabase/migrations/0001_init.sql` — vollständiges Schema aus `DATABASE.md` (profiles, exercises, routines, routine_exercises, workouts, workout_exercises, sets, personal_records), RLS-Policies pro Tabelle, `finish_workout`-RPC-Funktion, Auto-Profile-Trigger bei Signup
- **Exercise-Seed-Skript**: `supabase/seed/import-exercises.ts` — lädt `exercises-dataset-main/data/exercises.json` + Medien in einen `exercise-media`-Storage-Bucket und upserted die `exercises`-Tabelle (Concurrency-limitiert, idempotent über `external_id`)
- **Tooling**: ESLint + Prettier, `.npmrc` mit `legacy-peer-deps=true` (nötig wegen eines Peer-Konflikts zwischen `expo-router`s Web-Tabs und `nativewind`)

## Supabase-Projekt & MCP-Status

- Supabase-Projekt existiert bereits (project_ref `rlcrhsubxcsjbqpgrwvs`), referenziert in `.mcp.json`
- MCP-Server ist registriert (project scope) und laut `claude mcp list` **authentifiziert und "Connected"**
- **Aber**: In dieser (Background-Job-)Session wurden die Supabase-MCP-Tools trotz "Connected"-Status nie über `ToolSearch` auffindbar — auch nicht nach einem Neustart der interaktiven Session durch den Nutzer. Vermutung: Background-Job-Sessions übernehmen neu verbundene MCP-Tools nicht automatisch nach, da die Tool-Liste beim Start der Session fixiert wird. Das ist der konkrete Anlass für den Session-Neustart — muss in der neuen Session zuerst verifiziert werden (siehe `TODO.md`, Punkt 1)
- **Migration wurde noch nicht angewendet** und **Seed-Skript wurde noch nicht ausgeführt** — es existiert noch keine `.env`-Datei (nur `.env.example`)

## Bekannte offene Punkte aus der Konzeptphase

Siehe `MVP_REVIEW.md` für die vollständige Liste der MVP-Schwachstellen und fehlenden Features — die sind unverändert gültig, da Phase 2 (Workout-Tracking) noch nicht begonnen wurde. Aktuell sind Home/Training/Profil/Workout/Routine/Exercise-Screens bewusst nur Platzhalter mit `TODO`-Kommentaren, die auf die jeweilige Stelle in `MVP.md` verweisen.
