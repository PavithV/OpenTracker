# Project Status

Stand: 2026-07-24, Ende der Session. Phase 1 komplett, Design System komplett, **Phase 2 (Punkte 1–8) vollständig abgeschlossen** plus zwei ungeplante Zwischenschritte (Routinen-Liste, "Routine starten"). **Phase 3 (die komplette aktuelle Planungsgrundlage, Punkte 1–4) ebenfalls vollständig abgeschlossen.** Phase 4 ist begonnen (Punkte 1–3 von 7 fertig: Notizen, Custom Exercises, Rest-Timer). Der komplette Kernkreislauf **Registrieren → Routine erstellen → Routine starten → Workout durchführen → Workout beenden → Workout-Historie ansehen → Workout-Detail ansehen → Übungsdetail ansehen → Profil-Aggregate ansehen → Rekorde-Übersicht ansehen** ist Ende-zu-Ende gegen die echte Supabase-Datenbank verifiziert. Zwei reale, vorbestehende Bugs wurden dabei gefunden und gefixt (siehe unten). **Ausstehend ist nach wie vor nur der echte On-Device-Test** durch den Nutzer selbst — konnte in keiner Background-Job-Session durchgeführt werden.

## Kurzfassung

- **Phase 1** (Scaffold, Navigation, Auth, DB-Schema, Seed-Skript) war zu Beginn dieser Session-Reihe bereits geschrieben, aber gegen kein echtes Supabase-Projekt getestet. Vollständig provisioniert: Migration live angewendet, `database.types.ts` aus dem echten Schema generiert, alle 1.324 Übungen samt Medien importiert. Registrierung war beim ersten echten Test kaputt — gefunden und gefixt (siehe „Gefundene Bugs" unten). Der Nutzer hat sich seitdem selbst erfolgreich über die echte App registriert (`vpavith02@gmail.com`).
- Auf Nutzerwunsch vor den eigentlichen Features ein **vollständiges Design System** gebaut (Tokens, `Typography`/`Button`/`Card`/`Input`/`ListItem`/`EmptyState`, alle Screens umgestellt) — siehe Abschnitt „Design System" in `ARCHITECTURE.md`.
- **Phase 2** (Punkte 1–8, siehe `TODO.md` für alle Details): Home-Tab, Übungsauswahl, Routine erstellen/bearbeiten, Aktives Workout, Workout beenden (dabei der zweite echte Bug gefunden, siehe unten), Workout-Detail, Übungsdetail (drei Tabs), Profil-Tab. Dazu zwei ungeplante Zwischenschritte, weil der Nutzer beim Testen echte UX-Lücken bemerkte: Routinen-Liste im Training-Tab, und "Routine starten" (vorher nur ein TODO-Kommentar) — beide orientiert an vom Nutzer bereitgestellten Hevy-Referenz-Screenshots (`screenshots/`, gitignored, dritte Partei, nicht unsere IP).
- **Phase 3** (Punkte 1–4, alle umgesetzt): PR-Diagramm im Übungsdetail, One Rep Max (`estimated_1rm`, dritte Live-Migration), Muskel-Split im Profil-Tab, Rekorde-Übersicht als neuer Top-Level-Screen. Vorab musste der Nutzer eine echte Architekturfrage entscheiden — eigene `react-native-svg`-Chart-Komponenten statt einer neuen Chart-Lib —, danach wurden alle vier Punkte ohne weitere offene Fragen der Reihe nach umgesetzt.
- Beim Übergang zu Phase 4 bemerkte der Nutzer eine echte, bisher nirgends dokumentierte Lücke: runde Übungsbilder fehlten im Home-Bereich (anders als in den Hevy-Screenshots). Untersuchung von `MVP.md`/`MVP_REVIEW.md`/`ROADMAP.md` bestätigte: kein bewusst verschobener Punkt, sondern beim Übersetzen der Screenshots in `MVP.md` schlicht vergessen. Auf Nutzerwunsch vor Phase 4 nachgezogen (Home-Karten, Workout-Detail, Übungshistorie, plus Formkonsistenz-Fix im Picker).
- **Phase 4** (sieben Punkte laut `ROADMAP.md`, technische Bestandsaufnahme in `TODO.md`): Punkt 1 (Notizen) ist umgesetzt — alle drei bereits im Schema vorhandenen, aber ungenutzten `notes`-Spalten (Routine/Workout/Workout-Übung) sind jetzt an die UI angebunden. Punkt 2 (Custom Exercises) ist ebenfalls umgesetzt — neues Formular (`CustomExerciseForm.tsx`) + neuer Screen (`app/exercise/create.tsx`) + Einstiegspunkt im Picker, nutzt die seit `0001_init.sql` bestehenden, aber bis dahin ungenutzten `is_custom`/`created_by`-Spalten und RLS-Policies. Punkt 3 (Rest-Timer) ist ebenfalls umgesetzt — rein clientseitig, `routine_exercises.rest_seconds` wurde bereits geladen, aber bis dahin nie in den aktiven Workout-State übernommen; jetzt ein Countdown ab einem persistierten Endzeitpunkt (`restEndsAt`, App-Kill-sicher wie `startedAt`), getriggert beim Abhaken eines Satzes. Zwei der verbleibenden vier Punkte sind als klärungsbedürftig markiert (Kalender: mehrdeutig, was gemeint ist; Workout-Erinnerungen: braucht eine echte Architekturentscheidung lokal vs. serverseitig).

**Wichtig für alle künftigen Sessions:** Keine Test-Accounts (Supabase-Signups) mehr anlegen — hat beim Nutzer eine Warnmail von Supabase ausgelöst. Siehe Memory `no-test-signups`. Alle DB-Verifikationen liefen stattdessen über direkte SQL-Operationen (per Supabase-MCP-Tools) auf Datentabellen, unter Verwendung der echten, bereits existierenden Nutzer-ID — nie über neue Auth-Accounts. Test-Zeilen wurden nach jeder Verifikation rückstandslos wieder gelöscht.

## Gefundene Bugs (beide gefunden + gefixt)

1. **Registrierung** (`src/features/auth/api/auth.api.ts`, `app/(auth)/sign-up.tsx`): Supabase-Projekt hat "Confirm email" aktiviert (Standard). `signUp()` gelang serverseitig (Auth-User + Profil korrekt angelegt), lieferte aber `session: null` zurück. `sign-up.tsx` hat das ignoriert und bedingungslos zu `(tabs)/home` weitergeleitet, wurde dann vom Auth-Gate ohne jede Fehlermeldung zurückgeschickt. Fix: `signUpWithEmail` gibt jetzt `{ needsEmailConfirmation }` zurück; Screen zeigt in dem Fall einen Hinweis und leitet zu `sign-in`.
2. **`finish_workout`-RPC** (`supabase/migrations/0002_fix_finish_workout_personal_records.sql`): Die `personal_records`-Upsert-Query erzeugte eine Zeile pro *Satz* statt pro *Übung* — bei mehr als einem completed Satz derselben Übung im selben Workout (der Normalfall) versuchte ein einzelnes INSERT zwei Zeilen mit demselben Konflikt-Ziel zu behandeln, was Postgres ablehnt. Hätte "Workout beenden" für praktisch jedes reale Workout brechen lassen. Fix: `distinct on (exercise_id) order by weight desc` vor dem Upsert. `0001_init.sql` bewusst unverändert gelassen (Prinzip: keine bereits angewendete Migration nachträglich bearbeiten, stattdessen eine neue).

Beide durch direkte SQL-Simulation der jeweiligen Abläufe gegen die Live-DB gefunden und nach dem Fix erneut verifiziert.

## Git

Alle Änderungen liefen über Worktree-Branches und wurden per Fast-Forward in `master` gemerged (kein GitHub-Remote vorhanden, daher kein PR):

```
6ac1678 Build routine/workout/exercise notes (Phase 4, item 1)
d0839c2 Add Phase 4 planning to TODO.md/PROJECT_STATUS.md
884a758 Add exercise thumbnails to Home, workout detail, exercise history
a79cfb3 Build personal records overview screen (Phase 3, item 4)
3ed20a5 Build muscle split view in profile tab (Phase 3, item 3)
16fe465 Add estimated 1RM to finish_workout (Phase 3, item 2)
072b6e5 Build PR chart in exercise detail (Phase 3, item 1)
859aae1 Decide Phase 3 chart approach: custom react-native-svg, no new dep
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

- `npx tsc --noEmit`, `npm run lint`, `npx expo export --platform ios` (Bundling-Smoke-Test) → alle drei nach jeder Änderung sauber geblieben.
- Supabase-Projekt (`rlcrhsubxcsjbqpgrwvs`) vollständig provisioniert: 8 Tabellen, RLS aktiv, 3 Migrationen angewendet, 1.324 Übungen samt Medien importiert.
- Kompletter Kernkreislauf end-to-end gegen die Live-DB verifiziert (per SQL-Simulation, siehe „Gefundene Bugs" und die einzelnen Punkte in `TODO.md`): Routine anlegen → bearbeiten → auflisten → starten → Workout mit mehreren Sätzen und Notizen durchführen → beenden (Sync + `finish_workout` + `personal_records` inkl. `estimated_1rm`) → in Workout-Historie/-Detail, Übungsdetail (inkl. PR-Diagramm), Profil-Aggregaten (inkl. Muskel-Split) und Rekorde-Übersicht korrekt erscheinen.
- Ein echter Nutzer-Account existiert und hat sich selbst erfolgreich registriert.

**Nicht verifiziert:** Kein Lauf auf echtem Simulator/Gerät/Expo Go — dafür fehlte in jeder bisherigen (Background-Job-)Session durchgehend die Möglichkeit. Das ist der einzige verbleibende Schritt, um das gesamte bisher Gebaute (Phase 1 + 2 + 3 + Phase-4-Punkt-1) vollständig abzuschließen.

## Implementierte Features

- **Navigation**: Expo Router mit `Stack.Protected`-Auth-Gate. Alle Screens (`(auth)`, `(tabs)` Home/Training/Profil, `exercise/picker`, `exercise/[id]`, `routine/create`, `routine/[id]/edit`, `workout/active`, `workout/[id]`, `records`) sind voll funktionsfähig. Keine Platzhalter mehr.
- **Design System**: siehe `ARCHITECTURE.md`, Abschnitt „Design System" — Tokens + shared Components (inkl. `LineChart`/`BarChart`, eigene `react-native-svg`-Charts ohne externe Dependency), alle Screens umgestellt.
- **Auth**: Sign-in/Sign-up gegen Supabase Auth, inkl. korrekter Behandlung von "Confirm email aktiv" (siehe Bug 1 oben).
- **Home-Tab**: echte Workout-Historie (Name/Datum/Dauer/Volumen/Anzahl Übungen), darunter bis zu 3 Übungen mit rundem Bild + Satzanzahl je Karte (und „N weitere" falls mehr), Tap → `workout/[id]`.
- **Übungsauswahl**: Suche, Kategorie-/Geräte-Filter, Mehrfachauswahl mit runden Bildern, Attributions-Hinweis. Wird sowohl von der Routinen- als auch der Workout-Erstellung genutzt (`?target=`-Param).
- **Routinen** (erstellen/bearbeiten/auflisten/starten): vollständiger Kreislauf inkl. Notizfeld, Zustand-Draft-Store statt Navigation-Params (siehe `TODO.md` Punkt 3 für die Architektur-Begründung).
- **Aktives Workout + Beenden**: Timer, Volumen/Satz-Anzeige, Satz-Erfassung, Workout- und Pro-Übung-Notizen, lokale AsyncStorage-Persistenz (übersteht App-Kills), echter Sync zu Supabase + `finish_workout`-RPC beim Beenden.
- **Workout-Detail** (`workout/[id]`): Name/Datum/Dauer/Volumen/Anzahl Übungen/Notizen im Header, darunter alle Übungen (mit rundem Bild und eigenen Notizen) mit ihren Sätzen. Übungsname ist tappbar → `exercise/[id]`.
- **Übungsdetail** (`exercise/[id]`): Tab „Zusammenfassung" (Bild/GIF, Primär-/Sekundärmuskel, persönlicher Rekord + geschätztes 1RM aus `personal_records`, Gewichtsverlauf-Diagramm über `LineChart`, Attribution), Tab „Historie" (alle abgeschlossenen Workouts mit dieser Übung samt Sätzen, Tap → `workout/[id]`), Tab „So geht's" (Anleitungstext aus `instructions`, Fallback auf Englisch).
- **Profil-Tab**: echtes Profil (Name/E-Mail) + echte Aggregate (Anzahl Workouts, Trainingszeit, Gesamtvolumen) aus `workouts`, plus Muskel-Split (Gesamtvolumen pro Muskelgruppe) als horizontale `BarChart`-Balken, plus Einstiegspunkt zur Rekorde-Übersicht.
- **Rekorde-Übersicht** (`records`): Liste aller Übungen mit `personal_records`, je Zeile Bestes Gewicht + Geschätztes 1RM, alphabetisch sortiert, Tap → `exercise/[id]`.
- **Notizen**: auf allen drei im Schema vorgesehenen Ebenen (Routine, Workout, Workout-Übung) lesbar und schreibbar.
- **Custom Exercises**: eigene Übung erstellen (Name/Kategorie/Gerät/Zielmuskel, optionale Bild-URL) über einen neuen Screen (`exercise/create`), erreichbar per neuem Button im Picker; landet mit `is_custom: true`/`created_by: <user>` in `exercises` und wird direkt in die aktuelle Routine bzw. das aktive Workout übernommen.
- **Rest-Timer**: Countdown im aktiven Workout, startet automatisch beim Abhaken eines Satzes mit dem in der Routine hinterlegten `rest_seconds`-Sollwert; App-Kill-sicher (absoluter Endzeitpunkt statt gespeichertem Sekunden-Countdown), überspringbar per Button.
- **DB-Schema**: `0001_init.sql` (vollständiges Schema aus `DATABASE.md`) + `0002_fix_finish_workout_personal_records.sql` (Bugfix) + `0003_add_estimated_1rm_personal_record.sql` (One Rep Max).
- **Exercise-Seed-Skript**: ausgeführt, 1.324 Übungen importiert.
- **Tooling**: ESLint + Prettier, `.npmrc` mit `legacy-peer-deps=true`.

## Supabase-Projekt & MCP-Status

- Projekt `rlcrhsubxcsjbqpgrwvs`, MCP-Server über `ToolSearch` auffindbar und für alle Migrationen/Verifikationen/Bugfixes genutzt, kein manueller SQL-Editor-Umweg nötig.
- `get_advisors(security)` zeigt nur die erwarteten (unkritischen) `SECURITY DEFINER`-Warnungen zu `finish_workout`/`handle_new_user` (by design) sowie einen generellen Hinweis zu "Leaked Password Protection Disabled" (Supabase-Standardempfehlung, bisher nicht bearbeitet, da unabhängig von den bisherigen Aufgaben).
- MCP-Tools geben aus Sicherheitsgründen keinen `service_role`-Key heraus — der muss weiterhin manuell aus dem Dashboard geholt werden (bereits geschehen, liegt in `.env`).

## Bekannte offene Punkte aus der Konzeptphase

Siehe `MVP_REVIEW.md` für die vollständige Liste der ursprünglichen MVP-Schwachstellen. Die meisten sind durch Phase 2/3/4 (bisher) nicht adressiert, da außerhalb des jeweiligen Punkte-Scopes (z. B. Satz-Typen/Warm-up-Sets, Einheiten-Einstellung kg/lb). Siehe `TODO.md` für den genauen Stand pro Punkt.
