# Architektur

Ergänzt `TECH_STACK.md` (Feature-Based Architecture) um eine konkrete Ordner- und API-Struktur.

**Status:** Diese Struktur ist seit Phase 1 real angelegt (nicht mehr nur geplant). `[implementiert]` markiert Ordner mit echtem Inhalt, `[Platzhalter]` markiert angelegte, aber noch leere bzw. nur mit Stub-Screens gefüllte Ordner (werden in Phase 2 befüllt, siehe `TODO.md`). `tests/` existiert noch nicht — bisher gibt es keine Tests.

## Ordnerstruktur

```
app/                        # Expo Router – nur Routing, keine Business-Logik      [implementiert]
  (auth)/
    sign-in.tsx                # funktionsfähig
    sign-up.tsx                # funktionsfähig
  (tabs)/
    home/index.tsx             # Platzhalter (EmptyState)
    training/index.tsx         # Platzhalter (Buttons ohne Datenanbindung)
    profile/index.tsx          # liest bereits echte `profiles`-Zeile
  workout/
    active.tsx                 # Platzhalter               [Platzhalter]
    [id].tsx                   # Platzhalter                [Platzhalter]
  routine/
    create.tsx                 # Platzhalter                [Platzhalter]
    [id]/edit.tsx               # Platzhalter               [Platzhalter]
  exercise/
    picker.tsx                  # liest bereits echte `exercises`-Zeilen (Smoke-Test)
    [id].tsx                    # Platzhalter               [Platzhalter]
  _layout.tsx                   # Auth-Gate (Stack.Protected)

src/
  features/
    home/             {components, hooks, api, types}        [Platzhalter, leer]
    training/          {components, hooks, api, types, store} [Platzhalter, leer]
    routines/          {components, hooks, api, types}        [Platzhalter, leer]
    exercises/         {components, hooks, api, types}        [Platzhalter, leer]
    profile/           {components, hooks, api, types}        [Platzhalter, leer]
    auth/              {components, hooks, api, types}        [implementiert: api, types]
  shared/
    components/         # Button, Card, Input, Screen, EmptyState  [implementiert]
    hooks/
    theme/              # global.css, Tokens in tailwind.config.js [implementiert]
    lib/                # supabase.ts, query-client.ts             [implementiert]
    utils/
    types/               # database.types.ts (handgeschrieben), css.d.ts [implementiert]
  store/                # session.store.ts (Zustand)                [implementiert]

supabase/
  migrations/           # 0001_init.sql — komplettes DATABASE.md-Schema  [implementiert, noch nicht live angewendet]
  seed/                 # import-exercises.ts                            [implementiert, noch nicht ausgeführt]
  functions/            # Edge Functions (später)                        [leer]

tests/                   # existiert noch nicht
```

**Prinzip:** `app/` bleibt dünn (nur Navigation + Screen-Zusammensetzung). Jedes `features/*` kapselt seine eigene API/Hooks/Types – UI, Business-Logik und Data-Layer sind getrennt (siehe `PROJECT_OVERVIEW.md`). Die leeren `features/*`-Unterordner (home, training, routines, exercises, profile) werden erst befüllt, sobald die jeweilige Logik aus den Stub-Screens herausgezogen wird (Phase 2).

## API-Struktur

Supabase liefert kein separates REST-Backend – der Zugriff läuft über den Supabase-Client. Um UI und Datenquelle zu entkoppeln (SOLID: Dependency Inversion), wird pro Feature ein API-Modul definiert, das den Supabase-Client kapselt:

```
features/training/api/
  workouts.api.ts     # startWorkout(), finishWorkout(), getWorkoutHistory()
  sets.api.ts         # addSet(), updateSet(), deleteSet()
```

Drei Zugriffsarten, je nach Bedarf:

1. **Direkte PostgREST-Queries** (via `supabase-js`) für einfache CRUD-Fälle (z. B. Routine anlegen, Übungen filtern).
2. **Postgres-RPC-Funktionen** (`supabase.rpc(...)`) für Operationen, die mehrere Tabellen konsistent verändern müssen und nicht dupliziert werden sollen (z. B. `finish_workout(workout_id)` berechnet `total_volume`, `duration_seconds` und aktualisiert `personal_records` serverseitig – wichtig, sobald neben Mobile später auch Web existiert).
3. **Edge Functions** für alles, was Server-Secrets oder schwerere Logik braucht (z. B. zukünftige Push-Benachrichtigungen, Empfehlungen) – im MVP noch nicht benötigt.

Jedes API-Modul gibt typisierte DTOs zurück (Zod-validiert), Fehler werden normalisiert an TanStack Query weitergereicht. UI-Komponenten rufen nie direkt `supabase-js` auf, sondern nur die Feature-API – das hält die Datenquelle austauschbar.

## Aktives Workout: lokaler State

Der aktive Trainingszustand (`features/training/store`) lebt in einem Zustand-Store und wird zusätzlich in AsyncStorage/MMKV gespiegelt, damit ein App-Kill während des Trainings keine Daten verliert. Sync zu Supabase passiert erst beim „Workout beenden" (`finish_workout`-RPC).

## Tooling: Supabase MCP-Server

Zusätzlich zum manuellen Weg (SQL-Editor + `npm run db:seed`) ist ein projekt-gescopter Supabase-MCP-Server konfiguriert (`.mcp.json`, project_ref `rlcrhsubxcsjbqpgrwvs`, Features: docs/account/database/debugging/development/functions/branching/storage). Damit lassen sich Migrationen, Schema-Inspektion und Debugging direkt aus der Session heraus erledigen, statt SQL-Dateien nur zu schreiben und manuell ausführen zu lassen. Authentifizierung läuft über `claude` → `/mcp` in einer interaktiven Session (nicht in Background-Jobs — dort wurden verbundene MCP-Tools in der Praxis nicht immer nachgeladen, siehe `PROJECT_STATUS.md`). Ergänzend installiert: die Skills `supabase` und `supabase-postgres-best-practices` (`.agents/skills/`, `.claude/skills/`).
