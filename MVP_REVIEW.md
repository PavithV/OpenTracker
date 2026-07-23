# MVP Review

Analyse von `MVP.md` gegen den Anspruch aus `PROJECT_OVERVIEW.md` (Clean Architecture, langfristig erweiterbar, skalierbar) und gegen das tatsächliche Schema von `exercises-dataset-main/data/exercises.schema.json`.

## Schwachstellen im aktuellen MVP-Scope

| Bereich | Schwachstelle |
|---|---|
| Aktives Workout | Kein Editieren/Löschen bereits erfasster Sätze, keine Möglichkeit eine Übung aus dem laufenden Workout zu entfernen/neu zu ordnen |
| Aktives Workout | Kein Crash-/Interrupt-Schutz (App-Kill mitten im Training → Datenverlust ohne lokale Zwischenspeicherung) |
| Routinen | Keine Soll-Werte (Ziel-Sätze/-Wiederholungen/-Gewicht) pro Übung in der Routine – "Routine starten" hat dadurch nichts vorzubefüllen |
| Sätze | Kein Satz-Typ (Warm-up vs. Working Set), kein Rest-Timer, keine zeitbasierten Übungen (Plank etc. haben nur Gewicht/Wiederholung, keine Dauer) |
| Home/Verlauf | Kein Bearbeiten/Löschen vergangener Workouts nach dem Speichern |
| Übungsauswahl | Keine nutzerdefinierten Übungen (reines Dataset, kein Weg eigene Übung anzulegen) |
| Allgemein | Keine Einheiten-Einstellung (kg/lb), keine leeren Zustände (Home ohne Historie), keine Fehler-/Ladezustände spezifiziert |
| Lizenz | Attributionspflicht (© Gym visual) für Bilder/GIFs taucht in keinem UI-Bereich auf – Pflicht laut `exercises-dataset-main/NOTICE.md` |
| Datenmodell | Ursprüngliche `DATABASE.md`-Exercise-Tabelle bildete das echte Dataset-Schema nicht ab (mehrsprachige `instructions`, `target`, `media_id`, `attribution` fehlten) – behoben in der überarbeiteten `DATABASE.md` |

Bewusst **nicht** als Schwachstelle gewertet: Fehlen von Diagrammen/Rekorden/Muskelverteilung im MVP – das ist laut `MVP.md` und `ROADMAP.md` explizit erst Phase 3 und damit kein Versehen, sondern eine sinnvolle Scope-Entscheidung.

## Fehlende Features (zur Einordnung in die Roadmap, nicht alle für MVP)

- Rest-Timer zwischen Sätzen
- Vorheriger-Satz-Referenz beim Logging ("letztes Mal: 60 kg × 8")
- Supersets/Zirkeltraining
- Plattenrechner (Plate Calculator)
- Körpergewichts-Tracking
- Trainingsnotizen pro Satz/Workout
- Custom Exercises (eigene Übungen anlegen)
- Datenexport (CSV/PDF)
- Drag-and-Drop-Reihenfolge im aktiven Workout
- Push-Erinnerungen (in Phase 4 nur als Idee vermerkt, ohne Mechanismus)
- Onboarding-Flow
- Barrierefreiheit (Screenreader-Labels, Kontrast)

Einsortierung in Roadmap-Phasen siehe `ROADMAP.md`.

## Verbesserungsvorschläge (übergreifend)

1. **Offline-first von Anfang an**: aktives Workout lokal (AsyncStorage/MMKV) zwischenspeichern, Sync zu Supabase erst bei „Workout beenden" – verhindert Datenverlust bei Absturz, unabhängig von späterem Multi-Device-Sync.
2. **Repository-/Service-Layer** zwischen UI und Supabase, damit die Datenquelle austauschbar bleibt (Dependency Inversion).
3. **Design-Tokens vor UI-Komponenten** definieren (Farben, Spacing, Typo, Dark Mode).
4. **Seed-Skript für das Exercise-Dataset** in Phase 1 einplanen statt es "irgendwann" zu tun.
5. **Personal Records über Tabelle/Trigger pflegen**, nicht bei jedem Read live aus der Satz-Historie berechnen.
6. **Einheiten-/Locale-Strategie früh festlegen** (kg/lb), da spätere Umstellung teuer ist.
