# Project Status

Stand: 2026-07-23, Fortsetzungs-Session: Supabase-Projekt vollständig provisioniert, ein realer Registrierungs-Bug gefunden+gefixt, vollständiges Design System etabliert, Phase 2 Punkte 1–4 (Home-Historie, Übungsauswahl, Routine erstellen/bearbeiten, Aktives Workout) fertig. Nutzer hat sich zwischenzeitlich selbst erfolgreich registriert und testet On-Device, sobald Zeit ist. **Wichtig für alle künftigen Sessions:** keine Test-Accounts mehr anlegen — hat beim Nutzer eine Warnmail von Supabase ausgelöst, siehe Memory `no-test-signups`.

## Kurzfassung

Der App-Code für Phase 1 ("Projekt erstellen, Navigation, Dark Mode, Design System, Supabase verbinden, Authentication, Exercise-Seed-Skript") ist vollständig geschrieben, type-check- und lint-sauber, und per Metro-Export als Smoke-Test erfolgreich gebündelt worden. In dieser Session wurde das reale Supabase-Projekt vollständig provisioniert: Migration (`0001_init.sql`) läuft live gegen `rlcrhsubxcsjbqpgrwvs`, alle 8 Tabellen existieren mit RLS, `database.types.ts` wurde aus dem echten Schema regeneriert, der Nutzer hat den `service_role`-Key bereitgestellt, und `npm run db:seed` hat alle 1.324 Übungen samt Bildern/GIFs in den `exercise-media`-Storage-Bucket importiert. Beim ersten Testversuch des Nutzers stellte sich heraus, dass Registrierung nicht funktionierte — Ursache und Fix siehe „Registrierungs-Bug" unten. Danach, auf expliziten Nutzerwunsch vor weiteren Features, wurde ein vollständiges Design System gebaut (Tokens, Typography/Button/Card/Input/ListItem/EmptyState-Komponenten, alle Screens umgestellt — siehe `ARCHITECTURE.md`). Anschließend Phase 2: Home-Tab lädt echte Workout-Historie (Punkt 1), `exercise/picker.tsx` hat Suche/Filter/Mehrfachauswahl/Bilder/Attribution (Punkt 2), und `routine/create.tsx`+`routine/[id]/edit.tsx` sind jetzt vollständig funktionsfähig inkl. eines Zustand-Draft-Stores, der die Mehrfachauswahl aus dem Picker zurück ins Formular bringt (Punkt 3, siehe `TODO.md` für die Architektur-Begründung). Beim Verifizieren fiel auf, dass der Nutzer sich zwischenzeitlich selbst erfolgreich über die echte App registriert hat (`auth.users` enthält jetzt seinen echten Account, `vpavith02@gmail.com`) — der eingangs gemeldete Registrierungs-Bug ist also nachweislich behoben. Danach Punkt 4: `workout/active.tsx` hat jetzt Timer, Gesamtvolumen/Satz-Anzahl, Satz-Erfassung pro Übung und lokale Zwischenspeicherung über Zustands `persist`-Middleware + AsyncStorage (überlebt App-Kills) — rein lokal, keine Supabase-Schreibvorgänge (die kommen mit Punkt 5). Der Nutzer bat danach ausdrücklich darum, keine weiteren Test-Accounts mehr anzulegen (Supabase hatte deswegen eine Warnmail geschickt) — das ist jetzt in einer Memory (`no-test-signups`) festgehalten und gilt ab sofort. **Noch offen: der echte On-Device-Test** von Home/Picker/Routine/Workout — der Nutzer testet, sobald er dazu kommt.

## Registrierungs-Bug (gefunden 2026-07-23, gefixt)

Der Nutzer meldete: "man kann sich nur einloggen aber nicht registrieren". Direkt gegen die Live-Auth-API reproduziert: Das Supabase-Projekt hat "Confirm email" aktiviert (Standard bei neuen Projekten). `supabase.auth.signUp()` gelang serverseitig einwandfrei (Auth-User + Profil-Zeile über den `handle_new_user`-Trigger korrekt angelegt — per SQL verifiziert), lieferte aber `session: null` zurück, bis die E-Mail bestätigt wird. `sign-up.tsx` hat das ignoriert und bedingungslos zu `(tabs)/home` weitergeleitet; das Auth-Gate in `_layout.tsx` hat mangels Session sofort zurück zu `(auth)` geschickt — ganz ohne Fehlermeldung. Gefixt: `signUpWithEmail` (`src/features/auth/api/auth.api.ts`) gibt jetzt `{ needsEmailConfirmation }` zurück; `sign-up.tsx` zeigt in dem Fall einen Hinweis-Alert und leitet zu `sign-in` statt zu `tabs` weiter. Alle beim Debuggen angelegten Test-User wurden wieder gelöscht (`auth.users` ist wieder leer).

## Git

Alles in dieser und der vorherigen Fortsetzungs-Session lief über den Worktree-Branch `worktree-phase1-continue` und wurde jeweils per Fast-Forward in `master` gemerged (kein GitHub-Remote vorhanden, daher kein PR):

1. `35d48e3` — Initial commit (create-expo-app-Scaffold)
2. `886c606` — Scaffold OpenTracker Phase 1 (Expo Router, Design System, Supabase-Client, DB-Migration, Seed-Skript)
3. `fc079b5` — Supabase MCP-Server-Config + Agent Skills
4. `782d0b1` — Session-Handover-Docs vor MCP-Neustart
5. `4b3754d` — Migration live angewendet, `database.types.ts` regeneriert
6. `77089ce` — Exercise-Dataset importiert und gegen Live-Projekt verifiziert
7. `105c606` — Registrierungs-Bug (fehlende Session bei ausstehender Email-Bestätigung) gefixt
8. *(diese Session, noch zu committen)* — Home-Tab-Workout-Historie, `exercises-dataset-main/` explizit `.gitignore`d

`exercises-dataset-main/` ist jetzt **absichtlich** und explizit in `.gitignore` (`/exercises-dataset-main`) statt nur zufällig untracked — Entscheidung aus `TODO.md` wurde in dieser Session getroffen (Option c: nicht committen, README dokumentiert den Download-Schritt vor dem Seed-Lauf).

## Was funktioniert (verifiziert)

- `npx tsc --noEmit` → sauber (App-Code und `supabase/seed` haben getrennte `tsconfig.json`s)
- `npm run lint` (ESLint + Prettier-Kompatibilität) → sauber
- `npx expo-doctor` → 20/20 Checks bestanden
- `npx expo export --platform ios` (reiner Bundling-Smoke-Test ohne Simulator) → erfolgreich, 3646 Module gebündelt

**Nicht verifiziert:** Kein Lauf auf echtem Simulator/Gerät/Expo Go — dafür fehlte in dieser Session die Möglichkeit. Auch keine Laufzeit-Tests gegen ein echtes Supabase-Backend (siehe unten).

## Implementierte Features (Phase 1)

- **Navigation**: Expo Router mit `Stack.Protected`-Auth-Gate — `(auth)` (Sign-in/Sign-up) vs. `(tabs)` (Home/Training/Profil); `exercise/picker`, `routine/create`, `routine/[id]/edit` sind voll funktionsfähig, `workout/active`, `workout/[id]`, `exercise/[id]` bleiben Stub-Routen für Phase 2
- **Dark Mode**: `userInterfaceStyle: "automatic"` + NativeWind `darkMode: 'class'`, alle Screens/Komponenten unterstützen beide Modi
- **Design System**: vollständig etabliert diese Session (Tokens + `Typography`/`Button`/`Card`/`Input`/`ListItem`/`EmptyState` in `src/shared/components/`, alle Screens umgestellt) — Details in `ARCHITECTURE.md`, Abschnitt „Design System".
- **Supabase-Client**: typisiert (`src/shared/types/database.types.ts`, seit dieser Session per `mcp__supabase__generate_typescript_types` aus dem echten Live-Schema generiert statt handgeschrieben), Session-Handling über Zustand-Store (`src/store/session.store.ts`)
- **Authentication**: funktionierende Sign-in/Sign-up-Screens gegen Supabase Auth (`src/features/auth/`), inkl. Zod-Validierung; behandelt seit dieser Session korrekt den Fall "Confirm email aktiv, keine Session nach signUp" (siehe „Registrierungs-Bug" oben)
- **Home-Tab**: `src/features/home/{api,components,types}` (`getWorkoutHistory`, `WorkoutHistoryCard`) — lädt abgeschlossene Workouts des Users aus `workouts` (inkl. eingebettetem `workout_exercises(count)`), zeigt Karten mit Name/Datum/Dauer/Volumen/Anzahl Übungen, `EmptyState` nur wenn wirklich leer, Tap navigiert zu `/workout/[id]`. Ungetestet gegen echte Daten (es gibt noch keinen Weg, ein Workout abzuschließen — hängt an Phase-2-Punkt 4/5).
- **Übungsauswahl**: `src/features/exercises/{api,components,types}` — `exercise/picker.tsx` hat debounced Suche, Kategorie-/Geräte-Filter-Chips, Mehrfachauswahl mit Bild-Thumbnails, und den zuvor fehlenden Attributions-Hinweis. Filterlogik gegen die Live-DB verifiziert.
- **Routinen erstellen/bearbeiten**: `src/features/routines/{types,store,api,components}` — `routine-draft.store.ts` (Zustand) hält den in Arbeit befindlichen Entwurf, damit die Mehrfachauswahl aus dem Picker zurück ins Formular findet; `routines.api.ts` (`createRoutine`/`updateRoutine`/`getRoutineForEdit`); `RoutineForm`+`RoutineExerciseRow` (Reorder, Entfernen, Soll-Sätze/-Wiederholungen/-Gewicht/-Pause pro Übung). Create→Update-Ablauf per SQL gegen die Live-DB durchgespielt und wieder aufgeräumt.
- **DB-Schema**: `supabase/migrations/0001_init.sql` — vollständiges Schema aus `DATABASE.md` (profiles, exercises, routines, routine_exercises, workouts, workout_exercises, sets, personal_records), RLS-Policies pro Tabelle, `finish_workout`-RPC-Funktion, Auto-Profile-Trigger bei Signup
- **Exercise-Seed-Skript**: `supabase/seed/import-exercises.ts` — lädt `exercises-dataset-main/data/exercises.json` + Medien in einen `exercise-media`-Storage-Bucket und upserted die `exercises`-Tabelle (Concurrency-limitiert, idempotent über `external_id`)
- **Tooling**: ESLint + Prettier, `.npmrc` mit `legacy-peer-deps=true` (nötig wegen eines Peer-Konflikts zwischen `expo-router`s Web-Tabs und `nativewind`)

## Supabase-Projekt & MCP-Status

- Supabase-Projekt existiert bereits (project_ref `rlcrhsubxcsjbqpgrwvs`), referenziert in `.mcp.json`
- MCP-Server ist registriert (project scope) und laut `claude mcp list` **authentifiziert und "Connected"**
- **Bestätigt (2026-07-23)**: In dieser Session waren die `mcp__supabase__*`-Tools von Anfang an über `ToolSearch` auffindbar und funktionsfähig — die Vermutung aus der Vorsession (Background-Jobs laden neu verbundene MCP-Tools nicht nach) hat sich hier nicht bestätigt, vermutlich weil die MCP-Verbindung diesmal schon vor Session-Start stand. Alle folgenden Schritte liefen über die MCP-Tools, kein manueller SQL-Editor-Umweg nötig.
- **Migration ist jetzt live angewendet** (`mcp__supabase__apply_migration`, Name `init_schema`) — `list_tables` zeigt alle 8 Tabellen mit `rls_enabled: true`, `list_migrations` bestätigt den Eintrag. `get_advisors(security)` meldet nur die beiden erwarteten `SECURITY DEFINER`-Warnungen zu `finish_workout` und `handle_new_user` (by design, siehe `ARCHITECTURE.md`) — keine unerwarteten Findings.
- **`database.types.ts` wurde regeneriert** über `mcp__supabase__generate_typescript_types` und ersetzt die bisherige handgeschriebene Version. `npx tsc --noEmit` und `npm run lint` bleiben danach sauber (verifiziert).
- **Seed-Lauf abgeschlossen**: `SUPABASE_SERVICE_ROLE_KEY` wurde vom Nutzer bereitgestellt (dieser Key wird von den MCP-Tools bewusst nicht herausgegeben — `get_publishable_keys` liefert nur `anon`/`publishable`-Keys, das ist eine Sicherheitsgrenze der MCP-Integration, kein Bug). `.env` liegt jetzt im Hauptcheckout. `npm run db:seed` hat alle 1.324 Übungen importiert, Storage-Bucket `exercise-media` (public) wurde dabei automatisch angelegt. Verifiziert: `select count(*), count(image_url), count(gif_url) from exercises` → `1324/1324/1324`; ein Bild-URL aus dem Bucket ist per HTTP 200 öffentlich erreichbar; `GET /rest/v1/exercises` mit dem `anon`-Key liefert echte Zeilen (RLS-Policy funktioniert wie erwartet).

## Bekannte offene Punkte aus der Konzeptphase

Siehe `MVP_REVIEW.md` für die vollständige Liste der MVP-Schwachstellen und fehlenden Features — die sind unverändert gültig, da Phase 2 (Workout-Tracking) noch nicht begonnen wurde. Aktuell sind Home/Training/Profil/Workout/Routine/Exercise-Screens bewusst nur Platzhalter mit `TODO`-Kommentaren, die auf die jeweilige Stelle in `MVP.md` verweisen.
