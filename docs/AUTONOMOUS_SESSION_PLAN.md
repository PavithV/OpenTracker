# Autonome Session 2026-10-31 (18:50–23:00 MEZ) — Plan & Protokoll

Branch: `claude/autonomous-session-2026-10-31` (lokal; Push aus der Cloud-Session wurde von GitHub mit 403
abgelehnt, weil die Claude GitHub App für das Repo fehlt — Lieferung daher als `git bundle` + Patches).

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

(wird während der Session fortgeschrieben)
