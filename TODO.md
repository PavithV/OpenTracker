# TODO

Reihenfolge ist bewusst so gewählt — jeder Punkt baut auf dem vorherigen auf. Siehe `PROJECT_STATUS.md` für den Gesamtüberblick und die zwei in dieser Session gefundenen Bugs.

## Phase 1 (Projekt-Setup) — ✅ vollständig abgeschlossen

MCP-Tools verifiziert, `.env` angelegt (URL/Anon-Key via MCP, `service_role`-Key vom Nutzer), Migration `0001_init.sql` live angewendet, alle 1.324 Übungen importiert (`npm run db:seed`). Einziger offener Punkt: **der echte On-Device-Test** (`npm run ios`/`npm run android`, Login/Registrierung, Navigation) — konnte in keiner Background-Job-Session durchgeführt werden (kein Simulator/Emulator verfügbar), muss der Nutzer selbst auf seiner Maschine machen.

## Design System — ✅ abgeschlossen

Auf Nutzerwunsch vor Phase-2-Punkt 2 eingeschoben: vollständiges Design System (Tokens, `Typography`/`Button`/`Card`/`Input`/`ListItem`/`EmptyState`, alle Screens umgestellt). Details + Begründungen in `ARCHITECTURE.md`, Abschnitt „Design System". Recherchiert über den `ui-ux-pro-max`-Skill; `andrej-karpathy-skills` gilt seitdem für den Rest der Arbeit an diesem Projekt.

## Phase 2 der Roadmap (Workout Tracking)

Siehe `ROADMAP.md` Phase 2 und `MVP.md` für die Feature-Definition, `MVP_REVIEW.md` für bekannte Konzept-Lücken.

1. ✅ **Home-Tab**: echte Workout-Historie aus `workouts` (`src/features/home/`). Karten mit Name/Datum/Dauer/Volumen/Anzahl Übungen, `EmptyState` nur wenn wirklich leer, Tap → `/workout/[id]`.
2. ✅ **Übungsauswahl** (`exercise/picker.tsx`, `src/features/exercises/`): debounced Suche, Kategorie-/Geräte-Filter-Chips, Mehrfachauswahl mit Bild-Thumbnails, Attributions-Footer. Wird per `?target=`-Param sowohl von der Routinen- als auch der Workout-Erstellung genutzt.
3. ✅ **Routine erstellen/bearbeiten** (`routine/create.tsx`, `routine/[id]/edit.tsx`, `src/features/routines/`): Name, Übungsauswahl, Reihenfolge, Soll-Sätze/-Wiederholungen/-Gewicht/-Pause. **Architektur-Entscheidung**: ein Zustand-Draft-Store (`routine-draft.store.ts`) statt Navigation-Params, damit die Mehrfachauswahl aus dem Picker zurück ins (weiterhin gemountete) Formular findet, unabhängig von React-Navigation-Mount-Verhalten.
   - *Ungeplante Ergänzung danach* (Nutzer bemerkte: erstellte Routinen waren nirgends sichtbar): **Routinen-Liste** im Training-Tab (`getRoutines()`, `RoutineCard`).
   - *Ungeplante Ergänzung direkt danach* (Nutzer bemerkte: Tap auf Routine startete kein Workout): **"Routine starten"** — befüllt `active-workout.store.ts` mit `target_sets` leeren Sätzen pro Übung und setzt `workouts.routine_id`. Nutzer stellte dafür Hevy-Referenz-Screenshots bereit (`screenshots/`, gitignored), an denen sich die neuen Routinen-Karten (Name + Übungs-Vorschau + Button) orientieren.
4. ✅ **Aktives Workout** (`workout/active.tsx`, `src/features/training/`): Timer, Gesamtvolumen, Satz-Erfassung pro Übung, lokale Zwischenspeicherung. `active-workout.store.ts` nutzt Zustands `persist`-Middleware direkt mit AsyncStorage. `start()`/`startFromRoutine()` sind bewusst idempotent (kein Reset bei erneutem Screen-Aufruf) — das Überleben eines App-Kills ist der Sinn dieses Stores, anders als beim Routine-Draft.
5. ✅ **Workout beenden**: `finishActiveWorkout()` synct `workouts`→`workout_exercises`→`sets` zu Supabase und ruft die `finish_workout`-RPC auf (berechnet `total_volume`/`duration_seconds`, aktualisiert `personal_records`). **Dabei Bug 2 aus `PROJECT_STATUS.md` gefunden+gefixt.**
6. ⬜ **Workout-Detail** (`workout/[id].tsx`): alle Übungen/Sätze eines abgeschlossenen Workouts anzeigen. Screen ist über die Home-Tab-Karten bereits erreichbar, zeigt aktuell nur Platzhalter-Text.
7. ⬜ **Übungsdetail** (`exercise/[id].tsx`): Tabs Zusammenfassung/Historie, persönlicher Rekord aus `personal_records`. **`screenshots/Übung.jpg`, `Übung_Anleitung.jpg`, `Übung_Historie.jpg` zeigen dafür eine sehr direkte Vorlage**: Zusammenfassung mit Diagramm-Bild + Primär-/Sekundärmuskel + PR-Chart, dritter Tab "So geht's" mit Schritt-für-Schritt-Anleitung (unser Schema hat `instructions` als mehrsprachiges JSON dafür schon). Noch kein UI-Einstiegspunkt vorhanden — bei diesem Punkt mitbauen (z. B. Tap auf eine Übung im Picker oder in der künftigen Workout-Detailansicht).
8. ⬜ **Profil-Tab**: echte Aggregate (Anzahl Workouts, Trainingsminuten, Gesamtvolumen) statt Platzhalter.

## Nächster Schritt

**Punkt 6, Workout-Detail.** Alle Daten dafür existieren bereits real in der DB (mehrere durchgespielte Test-Workouts wurden zwar wieder gelöscht, aber der Nutzer kann jetzt über die App selbst echte Workouts anlegen). Anzuzeigen: Name, Datum, Dauer, Gesamtvolumen, alle Übungen mit ihren Sätzen (Gewicht/Wiederholungen/completed) — analog zum Aufbau von `getRoutineForEdit`/`getWorkoutHistory` (flache Queries, in JS gejoint, keine tief verschachtelten Embeds, siehe Begründung in `routines.api.ts`).

## Sonstige offene Punkte

- **Nicht neu entscheiden, nur beachten:** `exercises-dataset-main/` und `screenshots/` sind beide bewusst `.gitignore`d (erstere: einmaliger Seed-Bedarf, 2.661 Dateien; letztere: Referenz-Screenshots einer dritten App, keine eigene IP).
- **Keine Test-Accounts mehr anlegen** (Supabase-Signups) — siehe Memory `no-test-signups`, hat eine Warnmail beim Nutzer ausgelöst. DB-Verifikationen laufen über direkte SQL-Operationen mit der echten, bestehenden Nutzer-ID.
- `src/shared/types/database.types.ts` ist aus dem Live-Schema generiert (`mcp__supabase__generate_typescript_types`), nicht mehr handgeschrieben. Falls striktere Typen (z. B. für `category`, `set_type`) gewünscht sind: als eigene Union-Types **neben** dem generierten `Database`-Typ ergänzen, nicht die generierte Datei von Hand bearbeiten (geht bei der nächsten Regenerierung sonst verloren).
- `routine/[id]/edit.tsx` und `workout/[id].tsx` sind beide bereits fertig gebaut und über echte Daten erreichbar. `exercise/[id].tsx` ist der letzte Screen ganz ohne Einstiegspunkt (siehe Punkt 7 oben).
