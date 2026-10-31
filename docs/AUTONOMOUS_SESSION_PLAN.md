# Autonome Session 2026-10-31 (18:50–23:00 MEZ) — Plan & Protokoll

Branch: `claude/autonomous-session-2026-10-31`. Push wurde anfangs mit 403 abgelehnt (Claude GitHub App
fehlte) — Zwischenstände gingen deshalb als `git bundle` an den Nutzer. Nach Installation der App um
~20:10 per Fast-Forward nach `master` gepusht (Workflow laut `AGENTS.md`).

## Ausgangslage (verifiziert zu Sessionbeginn)

- `npx vitest run`: 4 Dateien, 18 Tests grün. `npx tsc --noEmit`: sauber. `npm run lint`: sauber.
- `npx expo export --platform web` funktioniert, sobald `react-dom`/`react-native-web`/`@expo/metro-runtime`
  vorhanden sind (hier per `npm i --no-save` nur für Tests installiert, `package.json` unverändert).
- Alle 10 Launch-Blocker bis auf #4 (Supabase-Pro-Plan) erledigt. Offene Punkte laut `PRODUCT_AUDIT.md`
  „Priorisierte Gesamt-Roadmap" (Hoch/Mittel) und `TODO.md` „Bewusste Lücke": die SQL-Logik von
  `finish_workout` ist ungetestet, und die App wurde nie vollständig Ende-zu-Ende durchgeklickt.

## Leitplanken

- Keine echten Supabase-Accounts/Signups, keine Zugriffe auf die Live-DB (Regel `no-test-signups`).
- Kein Push nach `master` (geht ohnehin nicht); alles bleibt auf dem Branch, der Nutzer entscheidet.
- Kleine, einzeln verifizierte Commits. Nach jeder Änderung: `vitest`, `tsc`, `lint`.
- Keine neuen Runtime-Dependencies ohne Not. Test-Tooling nur als devDependency.

## Plan (in Reihenfolge)

1. **SQL-Tests gegen echte Migrationen** — PGlite (Postgres als WASM, läuft in Vitest ohne Docker) +
   minimaler `auth`-Schema-Stub (`auth.users`, `auth.uid()`, Rollen). Testet: alle Migrationen laufen
   durch, `finish_workout` (Volumen, PR-Upsert inkl. `distinct on`, `estimated_1rm`), Owner-Check,
   `delete_account`-Kaskade, Wertebereichs-Constraints, RLS (fremde Zeilen unsichtbar).
2. **Web-E2E-Smoke-Test** — Web-Build + Playwright gegen einen lokalen Fake-Supabase-Server
   (PostgREST-Teilmenge + Auth-Endpunkte, im Hintergrund dieselbe PGlite-DB mit echten Migrationen und
   echter RLS). Kernkreislauf durchklicken: Login → Routine anlegen → Workout starten → Sätze loggen →
   beenden → Historie/Detail/Profil/Rekorde/Kalender. Screenshots als Beleg.
3. **Gefundene Bugs fixen** (mit Regressionstest, wo sinnvoll).
4. **Roadmap-Punkte „Hoch/Mittel" mit gutem Aufwand/Nutzen**, je nach verbleibender Zeit, z. B.:
   - #20 Query-Invalidierung nach `createRoutine`/`updateRoutine`/`finishActiveWorkout` prüfen/ergänzen
   - #21 Sekunden-Timer im aktiven Workout isolieren (kein Re-Render des ganzen Screens)
   - #28 `DATABASE.md` auf Schema-Stand 0007 bringen
   - #42 Routine duplizieren
5. **Doku + Übergabe**: `PROJECT_STATUS.md`/`TODO.md` aktualisieren, Bundle/Patches an den Nutzer.

## Protokoll

Zeiten MEZ. Jeder Schritt einzeln committet, nach jedem: `vitest` + `tsc` + `lint` (+ `npm run e2e` ab 19:30).

| Zeit | Ergebnis |
| --- | --- |
| 18:50 | Repo geklont, Branch angelegt. Push → 403 (Claude GitHub App fehlt) → Lieferung als Bundle. Baseline grün (18 Tests). |
| 18:55 | **SQL-Tests** (PGlite, alle Migrationen). Finden sofort 2 Bugs: `delete_account` scheitert an RESTRICT-FK bei benutzten eigenen Übungen; eigene Übungen für alle lesbar. → Migration `0008`. |
| 19:05 | **Web-E2E-Harness**: Fake-Supabase (PostgREST/GoTrue-Teilmenge über derselben PGlite-DB), Web-Export, Playwright. |
| 19:10 | **625-kg-Bug** im Browser reproduziert („62.5" → 625; „62,5" → leer). → `WeightInput`, Komma, Ganzzahl-Parser. |
| 19:15 | Home zeigt beendetes Workout nicht → Query-Invalidierung. Profil-Achse/E-Mail. |
| 19:30 | Smoke-Test als `npm run e2e` committet. Findet Routinen-Editor-Bug (alte Version nach Wiederöffnen; erster Fix-Versuch mit `gcTime`/`isFetchedAfterMount` griff nicht — Ursache: Draft wird aus dem gecachten Stand hydriert, bevor der Refetch zurück ist → Edit-Query vor dem Schließen awaited neu laden). |
| 19:40 | Zwischen-Backup (Bundle) an Nutzer. |
| 19:40 | **Rekorde gelöschter Workouts** bleiben stehen → `0009`. Erster Ansatz (Statement-Trigger auf `workouts`) feuert vor der FK-Kaskade; Statement-Trigger mit Übergangstabelle liefert in PGlite leere Ergebnisse → Zeilen-Trigger auf `personal_records` (set_id → NULL) + Backfill. |
| 19:42 | Timer-Isolation (#21), Rest-Timer im Smoke-Test. |
| 19:44 | Smoke-Test: „Letztes Mal" + Workout überlebt Reload. |
| 19:45 | `DATABASE.md` (#28), Pull-to-Refresh (#15). |
| 19:49 | Soll-Wdh. aus Routine als Platzhalter, Abhaken übernimmt sie; neue Übung startet mit 1 Satz. |
| 19:54 | Routine duplizieren (#42). Diff-Review, Doku. |
| 19:57 | Smoke-Test: Picker-Suche + Favoriten. |
| 20:00 | Unberührte leere Sätze werden beim Beenden nicht mehr gespeichert. Bundle per Fast-Forward auf frischem Klon von `master` verifiziert; E2E 3×, Unit/SQL 3× hintereinander grün (keine Flakiness). |
| 20:00 | Paket (Bundle, Patches, Anleitung) an Nutzer. |
| 20:05 | **Lange Historie**: Fake erzwingt Supabase-1000-Zeilen-Cap + 8-KB-URL-Limit; Integrationstest (App-API + supabase-js, 120 Workouts/2160 Sätze) reproduziert falsche Satz-Zahlen und 414er → `fetchAllPages`/`fetchAllIn`. |

Stand danach: 55 Unit-/SQL-/Integrationstests (9 Dateien, davon 18 SQL, 6 Integration), 14 E2E-Schritte + Fehler-Check grün, `tsc`/`lint` sauber.
