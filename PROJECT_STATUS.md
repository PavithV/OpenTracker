# Project Status

Stand: 2026-07-23, Fortsetzungs-Session: Supabase-Projekt provisioniert (Migration live, Typen regeneriert), Seed-Lauf noch offen.

## Kurzfassung

Der App-Code für Phase 1 ("Projekt erstellen, Navigation, Dark Mode, Design System, Supabase verbinden, Authentication, Exercise-Seed-Skript") ist vollständig geschrieben, type-check- und lint-sauber, und per Metro-Export als Smoke-Test erfolgreich gebündelt worden. In dieser Session wurde zusätzlich das reale Supabase-Projekt provisioniert: Die Migration (`0001_init.sql`) läuft jetzt live gegen `rlcrhsubxcsjbqpgrwvs`, alle 8 Tabellen existieren mit RLS, und `database.types.ts` wurde aus dem echten Schema regeneriert. **Noch nicht erledigt: Übungen sind noch nicht importiert** — dafür fehlt noch `SUPABASE_SERVICE_ROLE_KEY` in `.env` (aus Sicherheitsgründen nicht über MCP abrufbar, siehe unten). Das ist der nächste Schritt (siehe `TODO.md`, Punkt 2/4).

## Git

3 Commits auf `master` zu Beginn dieser Session (unverändert, siehe vorherige Einträge unten); Doku-Updates dieser Session laufen über einen Feature-Branch/PR, da die Session als isolierter Background-Job lief:

1. `35d48e3` — Initial commit (create-expo-app-Scaffold)
2. `886c606` — Scaffold OpenTracker Phase 1 (Expo Router, Design System, Supabase-Client, DB-Migration, Seed-Skript)
3. `fc079b5` — Supabase MCP-Server-Config + Agent Skills

`exercises-dataset-main/` ist weiterhin **untracked** (bewusst noch nicht committet — siehe `TODO.md`, Punkt zur Entscheidung ob/wie das Dataset ins Repo gehört — diese Entscheidung wurde in dieser Session bewusst nicht getroffen, siehe dort).

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
- **Supabase-Client**: typisiert (`src/shared/types/database.types.ts`, seit dieser Session per `mcp__supabase__generate_typescript_types` aus dem echten Live-Schema generiert statt handgeschrieben), Session-Handling über Zustand-Store (`src/store/session.store.ts`)
- **Authentication**: funktionierende Sign-in/Sign-up-Screens gegen Supabase Auth (`src/features/auth/`), inkl. Zod-Validierung
- **DB-Schema**: `supabase/migrations/0001_init.sql` — vollständiges Schema aus `DATABASE.md` (profiles, exercises, routines, routine_exercises, workouts, workout_exercises, sets, personal_records), RLS-Policies pro Tabelle, `finish_workout`-RPC-Funktion, Auto-Profile-Trigger bei Signup
- **Exercise-Seed-Skript**: `supabase/seed/import-exercises.ts` — lädt `exercises-dataset-main/data/exercises.json` + Medien in einen `exercise-media`-Storage-Bucket und upserted die `exercises`-Tabelle (Concurrency-limitiert, idempotent über `external_id`)
- **Tooling**: ESLint + Prettier, `.npmrc` mit `legacy-peer-deps=true` (nötig wegen eines Peer-Konflikts zwischen `expo-router`s Web-Tabs und `nativewind`)

## Supabase-Projekt & MCP-Status

- Supabase-Projekt existiert bereits (project_ref `rlcrhsubxcsjbqpgrwvs`), referenziert in `.mcp.json`
- MCP-Server ist registriert (project scope) und laut `claude mcp list` **authentifiziert und "Connected"**
- **Bestätigt (2026-07-23)**: In dieser Session waren die `mcp__supabase__*`-Tools von Anfang an über `ToolSearch` auffindbar und funktionsfähig — die Vermutung aus der Vorsession (Background-Jobs laden neu verbundene MCP-Tools nicht nach) hat sich hier nicht bestätigt, vermutlich weil die MCP-Verbindung diesmal schon vor Session-Start stand. Alle folgenden Schritte liefen über die MCP-Tools, kein manueller SQL-Editor-Umweg nötig.
- **Migration ist jetzt live angewendet** (`mcp__supabase__apply_migration`, Name `init_schema`) — `list_tables` zeigt alle 8 Tabellen mit `rls_enabled: true`, `list_migrations` bestätigt den Eintrag. `get_advisors(security)` meldet nur die beiden erwarteten `SECURITY DEFINER`-Warnungen zu `finish_workout` und `handle_new_user` (by design, siehe `ARCHITECTURE.md`) — keine unerwarteten Findings.
- **`database.types.ts` wurde regeneriert** über `mcp__supabase__generate_typescript_types` und ersetzt die bisherige handgeschriebene Version. `npx tsc --noEmit` und `npm run lint` bleiben danach sauber (verifiziert).
- **Seed-Skript noch nicht ausgeführt** und **Storage-Bucket `exercise-media` existiert noch nicht** (`list_storage_buckets` liefert leer) — beides hängt an der fehlenden `SUPABASE_SERVICE_ROLE_KEY`. Dieser Key wird von den MCP-Tools bewusst nicht herausgegeben (`get_publishable_keys` liefert nur `anon`/`publishable`-Keys, keinen `service_role`-Key) — das ist eine Sicherheitsgrenze der MCP-Integration, kein Bug. Der Key muss manuell aus dem Supabase-Dashboard (Settings → API) geholt werden, siehe `TODO.md` Punkt 2.

## Bekannte offene Punkte aus der Konzeptphase

Siehe `MVP_REVIEW.md` für die vollständige Liste der MVP-Schwachstellen und fehlenden Features — die sind unverändert gültig, da Phase 2 (Workout-Tracking) noch nicht begonnen wurde. Aktuell sind Home/Training/Profil/Workout/Routine/Exercise-Screens bewusst nur Platzhalter mit `TODO`-Kommentaren, die auf die jeweilige Stelle in `MVP.md` verweisen.
