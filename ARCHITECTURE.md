# Architektur

Ergänzt `TECH_STACK.md` (Feature-Based Architecture) um eine konkrete Ordner- und API-Struktur.

**Status (Stand 2026-07-23, Ende der Session):** Diese Struktur ist seit Phase 1 real angelegt (nicht mehr nur geplant). `[implementiert]` markiert Ordner mit echtem Inhalt, `[Platzhalter]` markiert angelegte, aber noch leere bzw. nur mit Stub-Screens gefüllte Ordner. `tests/` existiert noch nicht. Die Migration läuft live gegen das Supabase-Projekt (`rlcrhsubxcsjbqpgrwvs`, 2 Migrationen: Schema + ein Bugfix in `finish_workout`), `database.types.ts` ist aus dem echten Schema generiert, alle 1.324 Übungen samt Medien sind importiert. Phase 2, Punkte 1–8 sind umgesetzt — die komplette geplante Liste ist abgeschlossen (kompletter Kreislauf Routine/Workout Ende-zu-Ende funktionsfähig und gegen die Live-DB verifiziert, inkl. Workout-Detail, Übungsdetail und Profil-Aggregaten), dazu zwei ungeplante Ergänzungen (Routinen-Liste, "Routine starten") — siehe `PROJECT_STATUS.md` und `TODO.md` für Details, Begründungen und die zwei dabei gefundenen Bugs. Nächster Schritt: der ausstehende On-Device-Test durch den Nutzer, oder Phase 3 laut `ROADMAP.md` (Diagramme, One Rep Max, Muskel-Split, `personal_records` aktiv anzeigen).

## Ordnerstruktur

```
app/                        # Expo Router – nur Routing, keine Business-Logik      [implementiert]
  (auth)/
    sign-in.tsx                # funktionsfähig
    sign-up.tsx                # funktionsfähig
  (tabs)/
    home/index.tsx             # liest echte Workout-Historie aus `workouts`
    training/index.tsx         # Routinen-Liste (Name+Vorschau+"Routine starten"), "Routine erstellen", "Leeres Workout starten"
    profile/index.tsx          # echtes Profil + echte Aggregate (Workouts/Trainingszeit/Volumen)
  workout/
    active.tsx                 # Timer, Volumen/Satz-Anzahl, Satz-Erfassung, lokal AsyncStorage-persistiert
    [id].tsx                   # Workout-Detail: Name/Datum/Dauer/Volumen + alle Übungen mit Sätzen
  routine/
    create.tsx                 # funktionsfähig (Name, Übungsauswahl, Reihenfolge, Soll-Werte)
    [id]/edit.tsx               # funktionsfähig, erreichbar über die Routinen-Liste im Training-Tab
  exercise/
    picker.tsx                  # Suche, Kategorie-/Geräte-Filter, Mehrfachauswahl, Bilder
    [id].tsx                    # Übungsdetail: Tabs Zusammenfassung/Historie/So geht's, erreichbar über Workout-Detail
  _layout.tsx                   # Auth-Gate (Stack.Protected)

src/
  features/
    home/             {components, hooks, api, types}        [implementiert: api (Historie + Workout-Detail), components, types]
    training/          {components, hooks, api, types, store} [implementiert: store, api, components, types]
    routines/          {types, store, api, components}        [implementiert]
    exercises/         {components, hooks, api, types}        [implementiert: api (Picker + Detail/Historie/PR), components, types]
    profile/           {components, hooks, api, types}        [implementiert: api, components, types]
    auth/              {components, hooks, api, types}        [implementiert: api, types]
  shared/
    components/         # Button, Card, Input, Screen, EmptyState, Typography, ListItem [implementiert]
    hooks/
    theme/              # global.css, tailwind.config.js-Tokens, colors.ts, icons.ts [implementiert]
    lib/                # supabase.ts, query-client.ts             [implementiert]
    utils/
    types/               # database.types.ts (aus Live-Schema generiert), css.d.ts [implementiert]
  store/                # session.store.ts (Zustand)                [implementiert]

supabase/
  migrations/           # 0001_init.sql (Schema) + 0002 (finish_workout-Fix)  [implementiert, live angewendet]
  seed/                 # import-exercises.ts                            [implementiert, ausgeführt: 1.324 Übungen]
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

## Design System

Etabliert 2026-07-23 (siehe `TODO.md`), inspiriert an Hevy/Linear/Notion/Apple Fitness (nicht kopiert), dark-mode-first. Alle Screens nutzen ausschließlich diese Bausteine statt roher `Text`/`View`-Styling-Duplikate.

**Token-Quellen (zwei, mit klarer Aufgabenteilung):**
- `tailwind.config.js` — die eigentliche Quelle der Wahrheit für alles, was per `className` gestylt wird (Farben als `{light, dark}`-Paare + `dark:`-Variants, da NativeWind hier nicht mit CSS-Custom-Properties arbeitet, sondern mit klassenbasiertem Theming). Enthält `background`, `surface` (+ `surface.raised` für abgehobene Flächen), `border`, `text.primary/secondary/tertiary`, `primary`, `success`/`warning`/`danger` (je als `{DEFAULT, foreground}`-Paar mit geprüftem Kontrast), plus die Spacing-Skala (`xs`…`2xl`) und Radius-Skala (`sm`…`xl`).
- `src/shared/theme/colors.ts` — Rohwert-Spiegel derselben Farben für die wenigen RN-APIs, die kein `className` verstehen (Tab-Bar-Tint-Farben, `ActivityIndicator`-`color`-Prop). Muss von Hand synchron gehalten werden, da `tailwind.config.js` CommonJS ist und nicht sicher aus einem TS-Modul heraus importiert werden kann.
- `src/shared/theme/icons.ts` — `ICON_SIZE`-Konstanten (`sm`/`md`/`lg`), damit Icon-Größen nicht zufällig zwischen 18/20/24px variieren.

**Icons:** ausschließlich `lucide-react-native` (bereits vorhandene Dependency, `react-native-svg`-Peer bereits vorhanden) — keine Emojis als Icons, kein zweites Icon-Set.

**Komponenten (`src/shared/components/`):**
- `Typography` — `Text`-Wrapper mit Varianten `title | cardTitle | subtitle | body | label | caption` + optionalem `color`-Override (`muted`/`tertiary`/`danger`). Ersetzt die zuvor auf 15+ Stellen duplizierten rohen `className`-Strings für Titel/Untertitel.
- `Button` — Varianten `primary | secondary | ghost | destructive`, Größen `sm | md | lg`; alle Varianten haben jetzt sichtbares Press-Feedback (vorher nur `primary`).
- `Card` — optionales `onPress` (rendert dann als `Pressable` mit Press-Feedback statt einer externen, manuell gewrappten `Pressable`), `variant`: `default | elevated`.
- `Input` — Fokus-Zustand über kontrolliertes `onFocus`/`onBlur` (nicht über NativeWinds `focus:`-Variant, da in dieser Session nicht auf einem echten Gerät verifizierbar).
- `ListItem` — Listen-Zeilen-Primitive (leading/title/description/trailing/onPress), divider-agnostisch (Trennlinien über `FlatList`s `ItemSeparatorComponent`).
- `EmptyState` — optionales `icon`-Prop (lucide-Komponente).

Keine weiteren Komponenten (kein Badge/Alert/Dialog/Avatar) — nichts im bestehenden Code braucht sie aktuell.

## Tooling: Supabase MCP-Server

Zusätzlich zum manuellen Weg (SQL-Editor + `npm run db:seed`) ist ein projekt-gescopter Supabase-MCP-Server konfiguriert (`.mcp.json`, project_ref `rlcrhsubxcsjbqpgrwvs`, Features: docs/account/database/debugging/development/functions/branching/storage). Damit lassen sich Migrationen, Schema-Inspektion und Debugging direkt aus der Session heraus erledigen, statt SQL-Dateien nur zu schreiben und manuell ausführen zu lassen — die Migration in `supabase/migrations/0001_init.sql` wurde am 2026-07-23 genau so live angewendet. Authentifizierung läuft über `claude` → `/mcp` in einer interaktiven Session; in einem früheren Background-Job waren die Tools trotz "Connected"-Status nicht auffindbar, in dieser Session dagegen doch (siehe `PROJECT_STATUS.md`) — die MCP-Tools geben aus Sicherheitsgründen aber keinen `service_role`-Key heraus, der bleibt für `npm run db:seed` weiterhin manuell aus dem Dashboard zu holen. Ergänzend installiert: die Skills `supabase` und `supabase-postgres-best-practices` (`.agents/skills/`, `.claude/skills/`).
