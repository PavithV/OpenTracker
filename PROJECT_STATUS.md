# Project Status

Stand: 2026-07-23, Ende der Session. Phase 1 komplett, Design System komplett, **Phase 2 (Punkte 1–8) vollständig abgeschlossen** plus zwei ungeplante Zwischenschritte (Routinen-Liste, "Routine starten"). Der komplette Kernkreislauf **Registrieren → Routine erstellen → Routine starten → Workout durchführen → Workout beenden → Workout-Historie ansehen → Workout-Detail ansehen → Übungsdetail ansehen → Profil-Aggregate ansehen** ist Ende-zu-Ende gegen die echte Supabase-Datenbank verifiziert. Zwei reale, vorbestehende Bugs wurden dabei gefunden und gefixt (siehe unten). **Ausstehend ist nur noch der echte On-Device-Test** durch den Nutzer selbst. `TODO.md` enthält jetzt außerdem eine erste Planungsgrundlage für **Phase 3** (Diagramme, One Rep Max, Muskel-Split, Rekorde) — noch nicht umgesetzt, siehe dort für die vier Punkte. Die Chart-Lib-Frage ist entschieden: eigene `react-native-svg`-Komponenten, kein neuer Dependency.

## Kurzfassung

- Phase 1 (Scaffold, Navigation, Auth, DB-Schema, Seed-Skript) war zu Sessionbeginn bereits geschrieben, aber gegen kein echtes Supabase-Projekt getestet. Diese Session hat das Projekt vollständig provisioniert: Migration live angewendet, `database.types.ts` aus dem echten Schema generiert, `service_role`-Key vom Nutzer erhalten, alle 1.324 Übungen samt Medien importiert.
- Beim ersten echten Test durch den Nutzer stellte sich heraus, dass Registrierung nicht funktionierte — echter Bug, gefunden und gefixt (siehe „Gefundene Bugs" unten).
- Auf ausdrücklichen Nutzerwunsch wurde vor weiteren Features ein **vollständiges Design System** gebaut (Tokens, `Typography`/`Button`/`Card`/`Input`/`ListItem`/`EmptyState`, alle Screens umgestellt) — siehe `ARCHITECTURE.md`, Abschnitt „Design System".
- Danach Phase 2 der Reihe nach: Home-Tab (echte Workout-Historie), Übungsauswahl (Suche/Filter/Mehrfachauswahl/Bilder/Attribution), Routine erstellen/bearbeiten, Aktives Workout (Timer/Volumen/Sätze, lokal AsyncStorage-persistiert), Workout beenden (echter Sync zu Supabase + `finish_workout`-RPC).
- Beim Testen von "Workout beenden" ein zweiter echter Bug gefunden und gefixt (siehe unten).
- Der Nutzer meldete danach zwei UX-Lücken, die sich beide als bewusst offen gelassene, noch nicht gebaute Funktionalität herausstellten (kein Bug): keine Routinen-Listen-Ansicht, und "Routine starten" war nur ein TODO-Kommentar. Beide auf Nutzerwunsch vor Punkt 6 nachgezogen, letzteres orientiert an vom Nutzer bereitgestellten Hevy-Referenz-Screenshots (`screenshots/`, gitignored, dritte Partei).
- Der Nutzer hat sich zwischenzeitlich selbst erfolgreich über die echte App registriert (`vpavith02@gmail.com`) — bestätigt, dass der Registrierungs-Fix funktioniert.
- Punkt 6 (Workout-Detail) umgesetzt: `getWorkoutDetail()` (drei flache Queries, in JS gejoint, gleiches Muster wie `getRoutineForEdit`) + `WorkoutDetailExerciseCard`. Gegen die Live-DB verifiziert per SQL-Simulation (echter Nutzer, Test-Workout danach rückstandslos gelöscht inkl. der dabei von `finish_workout` erzeugten `personal_records`-Zeile).
- Punkt 7 (Übungsdetail) umgesetzt: drei Tabs (Zusammenfassung/Historie/So geht's) nach Hevy-Referenz, mit zwei bewussten Scope-Abweichungen vom Screenshot — kein interaktives PR-Chart (keine Chart-Lib im Projekt, stattdessen eine einfache Rekord-Karte) und Fließtext statt nummerierter Schritte in "So geht's" (`instructions` ist pro Sprache ein Absatz, kein Schritte-Array; Fallback auf `en`, da kein `de`-Key im Datensatz). UI-Einstiegspunkt: Tap auf eine Übung in der Workout-Detailansicht. Auch hier per SQL-Simulation gegen die Live-DB verifiziert (Test-Workout + die davon erzeugte `personal_records`-Zeile danach wieder gelöscht).
- Punkt 8 (Profil-Tab) umgesetzt: `getProfileStats()` aggregiert Anzahl Workouts/Trainingszeit/Gesamtvolumen aus `workouts` (flache Query, in JS summiert). Bewusst kein Balkendiagramm und keine Follower-Zahlen aus `screenshots/Profile statistics.jpg` — beides ist laut `ROADMAP.md` Phase 3 bzw. Phase 5, nicht Phase-2-Scope. Die bisher inline im Screen liegende `profiles`-Query wurde dabei in ein reguläres `getProfile()`-API-Modul verschoben. **Damit ist die komplette geplante Phase-2-Liste (Punkte 1–8) abgeschlossen.** Verifiziert per SQL-Simulation (zwei Test-Workouts für den echten Nutzer, Aggregat-Query bestätigt exakt den von `getProfileStats()` erwarteten Wert, danach rückstandslos gelöscht inkl. der von `finish_workout` erzeugten `personal_records`-Zeilen).
- Auf Nutzerwunsch danach `TODO.md`/`PROJECT_STATUS.md` um eine erste **Phase-3-Planungsgrundlage** ergänzt (kein Code, reine Doku): vier Punkte (PR-Diagramm im Übungsdetail, One Rep Max, Muskel-Split, Rekorde-Übersicht) plus eine zunächst offene Chart-Lib-Entscheidung. Details in `TODO.md`, Abschnitt „Phase 3 der Roadmap".
- Der Nutzer hat sich direkt danach für Option (a) entschieden: eigene, minimale Chart-Komponenten auf dem bereits vorhandenen `react-native-svg` (Peer von `lucide-react-native`), kein neuer Dependency (`victory-native`/`react-native-gifted-charts` bewusst nicht installiert). `TODO.md` entsprechend aktualisiert — Punkt 1 (PR-Diagramm) und Punkt 3 (Muskel-Split) sind damit nicht mehr durch eine offene Architekturfrage blockiert.

**Wichtig für alle künftigen Sessions:** Keine Test-Accounts (Supabase-Signups) mehr anlegen — hat beim Nutzer eine Warnmail von Supabase ausgelöst. Siehe Memory `no-test-signups`. Alle DB-Verifikationen in dieser Session liefen stattdessen über direkte SQL-Operationen (per Supabase-MCP-Tools) auf Datentabellen, unter Verwendung der echten, bereits existierenden Nutzer-ID — nie über neue Auth-Accounts. Test-Zeilen wurden nach jeder Verifikation rückstandslos wieder gelöscht.

## Gefundene Bugs (beide gefunden + gefixt, diese Session)

1. **Registrierung** (`src/features/auth/api/auth.api.ts`, `app/(auth)/sign-up.tsx`): Supabase-Projekt hat "Confirm email" aktiviert (Standard). `signUp()` gelang serverseitig (Auth-User + Profil korrekt angelegt), lieferte aber `session: null` zurück. `sign-up.tsx` hat das ignoriert und bedingungslos zu `(tabs)/home` weitergeleitet, wurde dann vom Auth-Gate ohne jede Fehlermeldung zurückgeschickt. Fix: `signUpWithEmail` gibt jetzt `{ needsEmailConfirmation }` zurück; Screen zeigt in dem Fall einen Hinweis und leitet zu `sign-in`.
2. **`finish_workout`-RPC** (`supabase/migrations/0002_fix_finish_workout_personal_records.sql`): Die `personal_records`-Upsert-Query erzeugte eine Zeile pro *Satz* statt pro *Übung* — bei mehr als einem completed Satz derselben Übung im selben Workout (der Normalfall) versuchte ein einzelnes INSERT zwei Zeilen mit demselben Konflikt-Ziel zu behandeln, was Postgres ablehnt. Hätte "Workout beenden" für praktisch jedes reale Workout brechen lassen. Fix: `distinct on (exercise_id) order by weight desc` vor dem Upsert. `0001_init.sql` bewusst unverändert gelassen (Prinzip: keine bereits angewendete Migration nachträglich bearbeiten, stattdessen eine neue).

Beide durch direkte SQL-Simulation der jeweiligen Abläufe gegen die Live-DB gefunden und nach dem Fix erneut verifiziert.

## Git

Alle Änderungen dieser und der vorherigen Fortsetzungs-Session liefen über einen Worktree-Branch und wurden per Fast-Forward in `master` gemerged (kein GitHub-Remote vorhanden, daher kein PR):

```
(neu) Decide Phase 3 chart approach: custom react-native-svg, no new dep
e42819c Add Phase 3 planning to TODO.md/PROJECT_STATUS.md
b377242 Build profile stats screen (Phase 2, item 8)
c62baff Build exercise detail screen (Phase 2, item 7)
e441a31 Build workout detail screen (Phase 2, item 6)
99bac1b Implement "Routine starten" using Hevy screenshots as reference
0606b91 Add routines list to Training tab (unscheduled gap, inserted before item 6)
c9809ac Wire "Workout beenden" to sync + finish_workout (Phase 2, item 5)
a4785a8 Build active workout screen (Phase 2, item 4)
6644407 Build routine create/edit flow (Phase 2, item 3)
d077e51 Build out exercise picker: search, filters, multi-select, images
8902e3a Establish design system: tokens, component library, screen refactor
52ef39d Load real workout history on Home tab; gitignore exercise dataset
105c606 Fix sign-up silently failing when email confirmation is pending
77089ce Import exercise dataset and verify against live Supabase project
4b3754d Apply Supabase migration live, regenerate database types
782d0b1 Add session handover docs before restarting for MCP fix
fc079b5 Add Supabase MCP server config and agent skills
886c606 Scaffold OpenTracker Phase 1: Expo Router app, Supabase schema, design system
35d48e3 Initial commit
```

`exercises-dataset-main/` und `screenshots/` sind beide bewusst in `.gitignore` (nicht nur zufällig untracked) — ersteres weil es nur einmalig für den Seed-Lauf gebraucht wird (2.661 Dateien), letzteres weil es Referenz-Screenshots einer dritten App (Hevy) sind, nicht unsere IP.

## Was funktioniert (verifiziert)

- `npx tsc --noEmit`, `npm run lint`, `npx expo export --platform ios` (Bundling-Smoke-Test) → alle drei nach jeder Änderung dieser Session sauber geblieben.
- Supabase-Projekt (`rlcrhsubxcsjbqpgrwvs`) vollständig provisioniert: 8 Tabellen, RLS aktiv, 2 Migrationen angewendet, 1.324 Übungen samt Medien importiert.
- Kompletter Kernkreislauf end-to-end gegen die Live-DB verifiziert (per SQL-Simulation, siehe „Gefundene Bugs" und die einzelnen Punkte in `TODO.md`): Routine anlegen → bearbeiten → auflisten → starten → Workout mit mehreren Sätzen durchführen → beenden (Sync + `finish_workout` + `personal_records`) → in der Workout-Historie erscheinen.
- Ein echter Nutzer-Account existiert und hat sich selbst erfolgreich registriert.

**Nicht verifiziert:** Kein Lauf auf echtem Simulator/Gerät/Expo Go — dafür fehlte in dieser (Background-Job-)Session durchgehend die Möglichkeit. Das ist der einzige verbleibende Schritt, um Phase 1 + die komplette Phase-2-Liste vollständig abzuschließen.

## Implementierte Features

- **Navigation**: Expo Router mit `Stack.Protected`-Auth-Gate. Alle Screens (`(auth)`, `(tabs)` Home/Training/Profil, `exercise/picker`, `exercise/[id]`, `routine/create`, `routine/[id]/edit`, `workout/active`, `workout/[id]`) sind voll funktionsfähig. Keine Platzhalter mehr.
- **Design System**: siehe `ARCHITECTURE.md`, Abschnitt „Design System" — Tokens + 6 shared Components, alle Screens umgestellt.
- **Auth**: Sign-in/Sign-up gegen Supabase Auth, inkl. korrekter Behandlung von "Confirm email aktiv" (siehe Bug 1 oben).
- **Home-Tab**: echte Workout-Historie (Name/Datum/Dauer/Volumen/Anzahl Übungen), Tap → `workout/[id]`.
- **Workout-Detail** (`workout/[id]`): Name/Datum/Dauer/Volumen/Anzahl Übungen im Header, darunter alle Übungen mit ihren Sätzen (Gewicht/Wiederholungen/completed-Status). Übungsname ist tappbar → `exercise/[id]`.
- **Übungsauswahl**: Suche, Kategorie-/Geräte-Filter, Mehrfachauswahl mit Bildern, Attributions-Hinweis. Wird sowohl von der Routinen- als auch der Workout-Erstellung genutzt (`?target=`-Param).
- **Übungsdetail** (`exercise/[id]`): Tab "Zusammenfassung" (Bild/GIF, Primär-/Sekundärmuskel, persönlicher Rekord aus `personal_records`, Attribution), Tab "Historie" (alle abgeschlossenen Workouts mit dieser Übung samt Sätzen, Tap → `workout/[id]`), Tab "So geht's" (Anleitungstext aus `instructions`, Fallback auf Englisch).
- **Profil-Tab**: echtes Profil (Name/E-Mail) + echte Aggregate (Anzahl Workouts, Trainingszeit, Gesamtvolumen) aus `workouts`, per `getProfileStats()`.
- **Routinen** (erstellen/bearbeiten/auflisten/starten): vollständiger Kreislauf, siehe `TODO.md` Punkte 3 und die beiden Zwischenschritte für die Architektur-Begründung (Zustand-Draft-Store statt Navigation-Params).
- **Aktives Workout + Beenden**: Timer, Volumen/Satz-Anzeige, Satz-Erfassung, lokale AsyncStorage-Persistenz (übersteht App-Kills), echter Sync zu Supabase + `finish_workout`-RPC beim Beenden.
- **DB-Schema**: `0001_init.sql` (vollständiges Schema aus `DATABASE.md`) + `0002_fix_finish_workout_personal_records.sql` (Bugfix).
- **Exercise-Seed-Skript**: ausgeführt, 1.324 Übungen importiert.
- **Tooling**: ESLint + Prettier, `.npmrc` mit `legacy-peer-deps=true`.

## Supabase-Projekt & MCP-Status

- Projekt `rlcrhsubxcsjbqpgrwvs`, MCP-Server registriert und in dieser Session durchgehend über `ToolSearch` auffindbar (im Gegensatz zu einer früheren Session, in der das nicht der Fall war — vermutlich weil die MCP-Verbindung diesmal schon vor Session-Start stand).
- Alle DB-Arbeiten (Migrationen, Verifikation, Bugfixes) liefen über die MCP-Tools, kein manueller SQL-Editor-Umweg nötig.
- `get_advisors(security)` zeigt nur die erwarteten (unkritischen) `SECURITY DEFINER`-Warnungen zu `finish_workout`/`handle_new_user` (by design) sowie einen generellen Hinweis zu "Leaked Password Protection Disabled" (Supabase-Standardempfehlung, nicht in dieser Session bearbeitet, da unabhängig von den aktuellen Aufgaben).
- MCP-Tools geben aus Sicherheitsgründen keinen `service_role`-Key heraus — der muss weiterhin manuell aus dem Dashboard geholt werden (bereits geschehen, liegt in `.env`).

## Bekannte offene Punkte aus der Konzeptphase

Siehe `MVP_REVIEW.md` für die vollständige Liste der ursprünglichen MVP-Schwachstellen. Die meisten sind durch Phase 2 (bisher) nicht adressiert, da außerhalb des jeweiligen Punkte-Scopes (z. B. Satz-Typen/Warm-up-Sets, Rest-Timer, Einheiten-Einstellung kg/lb). Siehe `TODO.md` für den genauen Stand pro Punkt.
