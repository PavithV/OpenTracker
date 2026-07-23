# TODO

Reihenfolge ist bewusst so gewählt — jeder Punkt baut auf dem vorherigen auf.

## Sofort (neue Session)

1. ~~**MCP-Tools verifizieren**~~ ✅ Erledigt (2026-07-23): In dieser Session waren die `mcp__supabase__*`-Tools direkt über `ToolSearch` auffindbar und funktionsfähig (Vermutung aus der letzten Session bestätigt: Background-Jobs übernehmen die Tool-Liste offenbar doch, sofern die MCP-Verbindung schon vor Session-Start stand — war hier der Fall).
2. **`.env` anlegen** — teilweise erledigt: `EXPO_PUBLIC_SUPABASE_URL` (`https://rlcrhsubxcsjbqpgrwvs.supabase.co`) und `EXPO_PUBLIC_SUPABASE_ANON_KEY` liegen bereits vor (per `mcp__supabase__get_project_url` / `get_publishable_keys` abgerufen). **Fehlt noch**: `SUPABASE_SERVICE_ROLE_KEY` — der wird von den MCP-Tools aus Sicherheitsgründen nicht herausgegeben, muss manuell aus dem Supabase-Dashboard (Settings → API → service_role) geholt und in `.env` eingetragen werden, bevor Punkt 4 laufen kann.
3. ~~**Migration anwenden**~~ ✅ Erledigt (2026-07-23): `supabase/migrations/0001_init.sql` per `mcp__supabase__apply_migration` gegen das Live-Projekt ausgeführt. Alle 8 Tabellen existieren mit aktiviertem RLS (`list_tables` verifiziert), `get_advisors` zeigt nur die erwarteten (unkritischen) Warnungen zu den beiden `SECURITY DEFINER`-Funktionen. `src/shared/types/database.types.ts` wurde daraufhin durch `mcp__supabase__generate_typescript_types` ersetzt (siehe „Nicht vergessen" unten) — `tsc --noEmit` und `npm run lint` bleiben sauber.
4. **Übungen importieren**: `npm run db:seed` ausführen, sobald Punkt 2 abgeschlossen ist. Dauert eine Weile (1.324 Übungen × 2 Media-Dateien, Concurrency 15). Bei Abbruch: Skript ist idempotent (upsert über `external_id`), einfach erneut ausführen. Legt dabei den Storage-Bucket `exercise-media` selbst an (noch nicht vorhanden — `list_storage_buckets` zeigt aktuell leer).
5. **Smoke-Test**: App auf Simulator/Gerät starten (`npm run ios` / `npm run android`), einloggen/registrieren, im Training-Tab zu `exercise/picker` navigieren (aktuell nur über direkten Deep-Link erreichbar, kein UI-Einstieg — siehe Punkt weiter unten) und prüfen, ob echte Übungen aus Supabase geladen werden. Konnte in dieser (Background-Job-)Session nicht durchgeführt werden — kein Simulator/Gerät verfügbar.

## Offene Entscheidung

- **`exercises-dataset-main/` in Git tracken oder nicht?** Aktuell untracked (2.661 Dateien, viele Bilder). Braucht es lokal nur für den einmaligen Seed-Lauf. Optionen: (a) als Submodule/externe Abhängigkeit dokumentieren und aus dem Arbeitsverzeichnis lösen, sobald der Seed einmal durchgelaufen ist, (b) committen und in Kauf nehmen, dass das Repo groß wird, (c) `.gitignore`n und stattdessen in der README als "vor dem ersten Seed-Lauf herunterladen" dokumentieren. Bisher nicht entschieden — nächste Session sollte das klären, bevor mehr Leute am Repo arbeiten.

## Danach: Phase 2 der Roadmap (Workout Tracking)

Siehe `ROADMAP.md` Phase 2 und `MVP.md` für die Feature-Definition, `MVP_REVIEW.md` für bekannte Lücken, die dabei mit bedacht werden sollten (z. B. Satz-Typen, Routinen-Sollwerte, lokale Zwischenspeicherung des aktiven Workouts). Konkret zu bauen, in dieser Reihenfolge:

1. Home-Tab: echte Workout-Historie aus `workouts` laden (Karten mit Name/Datum/Dauer/Volumen/Anzahl Übungen), `EmptyState` nur zeigen wenn Historie wirklich leer ist
2. Übungsauswahl (`exercise/picker.tsx` ausbauen): Suche, Filter nach Kategorie/Equipment, Mehrfachauswahl, Bilder anzeigen (inkl. Attributionspflicht © Gym visual — bisher in keinem Screen sichtbar, siehe `MVP_REVIEW.md`)
3. Routine erstellen/bearbeiten (`routine/create.tsx`, `routine/[id]/edit.tsx`): Name, Übungsauswahl, Reihenfolge, Soll-Sätze/-Wiederholungen (Spalten existieren bereits im Schema: `target_sets`, `target_reps_min/max`, `target_weight`, `rest_seconds`)
4. Aktives Workout (`workout/active.tsx`): Timer, Gesamtvolumen, Satz-Erfassung pro Übung, lokale Zwischenspeicherung (AsyncStorage/MMKV) bevor Sync — siehe `ARCHITECTURE.md`
5. Workout beenden → `finish_workout`-RPC aufrufen (bereits in der Migration implementiert)
6. Workout-Detail (`workout/[id].tsx`): alle Übungen/Sätze anzeigen
7. Übungsdetail (`exercise/[id].tsx`): Tabs Zusammenfassung/Historie, persönlicher Rekord aus `personal_records`
8. Profil-Tab: echte Aggregate (Anzahl Workouts, Trainingsminuten, Gesamtvolumen) statt Platzhalter

## Nicht vergessen

- Keine der Platzhalter-Screens (`workout/active.tsx`, `workout/[id].tsx`, `routine/create.tsx`, `routine/[id]/edit.tsx`, `exercise/[id].tsx`) hat aktuell einen UI-Einstiegspunkt außer `exercise/picker` (über den "Routine erstellen"-Button im Training-Tab) — beim Ausbau in Phase 2 auch die Navigation dorthin ergänzen.
- ~~`src/shared/types/database.types.ts` ist handgeschrieben...~~ ✅ Erledigt (2026-07-23): durch `mcp__supabase__generate_typescript_types` gegen das jetzt live geschaltete Schema ersetzt. Die bisherigen String-Literal-Unions (`UnitPreference`, `SetType`, `PersonalRecordType`, `Instructions`) sind dabei entfallen, da der generierte Typ diese Spalten als `string`/`Json` führt und nirgends im Code (nur `supabase.ts` importiert `Database`) auf die engeren Literale angewiesen war — geprüft per Grep vor dem Ersetzen. Falls in Phase 2 striktere Typen für `category`, `unit_preference`, `set_type` etc. gewünscht sind, separat als eigene Union-Types neben dem generierten `Database`-Typ ergänzen statt die generierte Datei erneut von Hand zu bearbeiten (sonst geht das bei der nächsten Regenerierung wieder verloren).
