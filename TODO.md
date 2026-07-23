# TODO

Reihenfolge ist bewusst so gewählt — jeder Punkt baut auf dem vorherigen auf.

## Sofort (neue Session)

1. **MCP-Tools verifizieren**: Prüfen, ob die Supabase-MCP-Tools in der neuen Session über `ToolSearch`/normale Tool-Liste auffindbar sind (in der alten Background-Job-Session war das trotz "Connected"-Status nie der Fall). Falls wieder nicht: Fallback ist der manuelle Weg über den Supabase SQL-Editor + `npm run db:seed` lokal — funktioniert unabhängig vom MCP.
2. **`.env` anlegen**: `.env.example` kopieren, mit den echten Credentials aus dem Supabase-Projekt (project_ref `rlcrhsubxcsjbqpgrwvs`, Settings → API) befüllen: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. **Migration anwenden**: Inhalt von `supabase/migrations/0001_init.sql` gegen das Projekt ausführen — per MCP-Tool (falls verfügbar) oder manuell im SQL-Editor.
4. **Übungen importieren**: `npm run db:seed` ausführen. Dauert eine Weile (1.324 Übungen × 2 Media-Dateien, Concurrency 15). Bei Abbruch: Skript ist idempotent (upsert über `external_id`), einfach erneut ausführen.
5. **Smoke-Test**: App auf Simulator/Gerät starten (`npm run ios` / `npm run android`), einloggen/registrieren, im Training-Tab zu `exercise/picker` navigieren (aktuell nur über direkten Deep-Link erreichbar, kein UI-Einstieg — siehe Punkt weiter unten) und prüfen, ob echte Übungen aus Supabase geladen werden.

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
- `src/shared/types/database.types.ts` ist handgeschrieben. Sobald die Migration live angewendet wurde, idealerweise durch `npx supabase gen types typescript --project-id rlcrhsubxcsjbqpgrwvs > src/shared/types/database.types.ts` ersetzen, damit Typen und echtes Schema garantiert übereinstimmen.
