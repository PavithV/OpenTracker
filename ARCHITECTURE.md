# Architektur

Ergänzt `TECH_STACK.md` (Feature-Based Architecture) um eine konkrete Ordner- und API-Struktur.

## Ordnerstruktur

```
app/                        # Expo Router – nur Routing, keine Business-Logik
  (auth)/
    sign-in.tsx
    sign-up.tsx
  (tabs)/
    home/index.tsx
    training/index.tsx
    profile/index.tsx
  workout/
    active.tsx
    [id].tsx                # Workout-Detail
  routine/
    create.tsx
    [id]/edit.tsx
  exercise/
    picker.tsx
    [id].tsx                 # Detail: Zusammenfassung/Historie-Tabs
  _layout.tsx

src/
  features/
    home/             {components, hooks, api, types}
    training/          {components, hooks, api, types, store}   # aktives Workout = eigener Zustand-Store
    routines/          {components, hooks, api, types}
    exercises/         {components, hooks, api, types}
    profile/           {components, hooks, api, types}
    auth/              {components, hooks, api, types}
  shared/
    components/         # Design-System: Button, Card, Input, Sheet …
    hooks/
    theme/              # Tokens, Dark Mode, NativeWind-Config
    lib/                # supabase-client.ts, query-client.ts
    utils/
    types/
  store/                # globale Zustand-Stores (Session/User)

supabase/
  migrations/
  seed/                 # Import-Skript für exercises.json
  functions/            # Edge Functions (später)

tests/
```

**Prinzip:** `app/` bleibt dünn (nur Navigation + Screen-Zusammensetzung). Jedes `features/*` kapselt seine eigene API/Hooks/Types – UI, Business-Logik und Data-Layer sind getrennt (siehe `PROJECT_OVERVIEW.md`).

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
