# Project Status

**Stand: 2026-07-26 (aktuellste Session).** Seit dem unten dokumentierten Stand (2026-07-24) zusätzlich passiert, nicht mehr in den folgenden Abschnitten nacherzählt: das **iOS-Redesign** hat Nocturne abgelöst (siehe `ARCHITECTURE.md`, Abschnitt „Design System" → „iOS-Redesign" für Details), ein vollständiges Produkt-/UX-/Architektur-/Sicherheitsaudit (`PRODUCT_AUDIT.md`) plus darauf aufbauender `LAUNCH_PLAN.md` (lokal beim Nutzer) wurden erstellt, und **Launch-Blocker #1 (Konto-Löschung, In-App-Teil)** wurde umgesetzt — neue Migration `0006_add_delete_account.sql`, `deleteAccount()`-Client-API, „Konto löschen"-UI im Profil-Tab. Details in `TODO.md`, Abschnitte „Produkt-Audit + Launch-Plan" und „Konto-Löschung".

Stand: 2026-07-24, Ende der Session. Phase 1 komplett, ursprüngliches Design System komplett (mittlerweile durch **Nocturne** ersetzt, siehe unten). **Phase 2 (Punkte 1–8) vollständig abgeschlossen** plus zwei ungeplante Zwischenschritte (Routinen-Liste, "Routine starten"). **Phase 3 (Punkte 1–4) vollständig abgeschlossen.** **Phase 4 ist jetzt vollständig abgeschlossen** (alle 7 von 7: Notizen, Custom Exercises, Rest-Timer, Plattenrechner, Favoriten, Kalender, Workout-Erinnerungen — Letzteres nach Nutzer-Entscheidung für Variante (a), rein lokal über `expo-notifications`, ohne Server/Push-Tokens). **Danach, außerhalb der Roadmap:** komplettes Redesign auf das Nocturne-Design-System. Der komplette Kernkreislauf ist Ende-zu-Ende gegen die echte Supabase-Datenbank verifiziert (Details unten). **Der Code läuft jetzt außerdem nachweislich auf einem echten Gerät** — der Nutzer hat die App selbst per Expo Go gestartet; dabei wurde ein echter, session-übergreifender Bug gefunden und behoben (siehe „Environment-Bug" unten). Vollständige On-Device-Funktionsprüfung (Navigation durch alle Screens, echte Workouts durchführen) steht weiterhin aus.

## Nocturne-Redesign (aktuellster Stand, nach Phase-4-Punkt-6, außerhalb der Roadmap)

Auf Nutzerwunsch importiert aus einem Claude-Design-Projekt (`claude.ai/design`, per `DesignSync`-Tool gelesen: `theme.json`, `styles.css`, `readme.md`) und vollständig umgesetzt: neue Farb-, Typografie-, Spacing- und Radius-Tokens (ein einzelnes dunkles Theme, kein Light Mode mehr), Buttons als Akzent-Outlines statt gefüllter Flächen, Inter-Schriftfamilie (`@expo-google-fonts/inter`), kompletter Icon-Wechsel von `lucide-react-native` zu `phosphor-react-native` (10 betroffene Dateien, alte Dependency entfernt). Ausführliche Begründung, alle Interpretations-Entscheidungen (u. a. warum `light`/`dark`-Tokens trotz Einzel-Theme strukturell bestehen blieben, warum der Token-Name `primary` nicht zu `accent` umbenannt wurde, die Anpassung der Web-Spacing-Skala an Mobile-Werte, die Falle mit `fontWeight`- vs. `fontFamily`-Utilities bei statisch geladenen Schriftschnitten) stehen in `ARCHITECTURE.md`, Abschnitt „Design System". Gegen `tsc`/`lint`/`expo export` verifiziert; die visuelle Umsetzung selbst lief zum ersten Mal echt auf einem Gerät, siehe „Environment-Bug" unten.

## Environment-Bug: `node_modules` nach Merge nicht synchron (gefunden + gefixt)

Nach dem Merge des Nocturne-Redesigns (neue Dependencies `phosphor-react-native`/`@expo-google-fonts/inter`, `lucide-react-native` entfernt) schlug `npm run start` im echten Checkout des Nutzers fehl: `Unable to resolve "phosphor-react-native"`. **Ursache:** Alle `npm install`-Läufe dieser Session fanden ausschließlich innerhalb temporärer Worktrees statt (`.claude/worktrees/*`, per `EnterWorktree`-Tool isoliert) — `package.json`/`package-lock.json` wurden dort aktualisiert und per Fast-Forward-Merge in `master` übernommen, aber `node_modules` im eigentlichen Checkout des Nutzers (`C:\Users\pavit\OneDrive\Desktop\OpenTracker`) wurde dabei nie angefasst, da `npm install` nur innerhalb des jeweiligen Worktrees lief. **Fix:** `npm install` direkt im Nutzer-Checkout nachgeholt (bestätigt: `phosphor-react-native` + Inter-Fonts jetzt vorhanden, `lucide-react-native` entfernt). Zusätzlich zu Beginn dieses Vorfalls ein harmloser, selbstheilender Metro-Cache-Fehler aufgetreten ("Unable to deserialize cloned data", "falling back to a full crawl") — vermutlich Alt-Cache mit inkompatiblem Format nach den vielen Dependency-Änderungen; der verwaiste Cache-Ordner (`%TEMP%/metro-cache`) wurde vorsorglich gelöscht.

**Lehre für künftige Sessions:** Nach jedem Merge, der `package.json` ändert, muss `npm install` zusätzlich im tatsächlichen Nutzer-Checkout laufen, nicht nur im Worktree, in dem die Änderung entstand — Worktree und Haupt-Checkout haben getrennte `node_modules`.

## Kurzfassung

- **Phase 1** (Scaffold, Navigation, Auth, DB-Schema, Seed-Skript): vollständig provisioniert, Migration live angewendet, `database.types.ts` aus dem echten Schema generiert, alle 1.324 Übungen samt Medien importiert. Registrierung war beim ersten echten Test kaputt — gefunden und gefixt (siehe „Gefundene Bugs" unten).
- **Phase 2** (Punkte 1–8): Home-Tab, Übungsauswahl, Routine erstellen/bearbeiten/auflisten/starten, Aktives Workout, Workout beenden (zweiter echter Bug gefunden, siehe unten), Workout-Detail, Übungsdetail (drei Tabs), Profil-Tab.
- **Phase 3** (Punkte 1–4): PR-Diagramm, One Rep Max (`estimated_1rm`), Muskel-Split, Rekorde-Übersicht. Architekturentscheidung vorab: eigene `react-native-svg`-Charts statt neuer Chart-Lib.
- **Phase 4** (alle sieben Punkte): Notizen, Custom Exercises, Rest-Timer, Plattenrechner, Favoriten, Kalender, Workout-Erinnerungen — alle Details inkl. Live-DB-Verifikation (bzw. für Erinnerungen: `tsc`/`lint`/Bundling-Verifikation, kein DB-Zugriff nötig) in `TODO.md`. Workout-Erinnerungen (Punkt 7): rein lokal über `expo-notifications`, neues Feature `src/features/reminders/`, neuer Screen `app/reminders.tsx`, Einstiegspunkt im Profil-Tab.
- **Nocturne-Redesign**: siehe eigener Abschnitt oben.

**Wichtig für alle künftigen Sessions:** Keine Test-Accounts (Supabase-Signups) mehr anlegen — hat beim Nutzer eine Warnmail von Supabase ausgelöst. Siehe Memory `no-test-signups`. Alle DB-Verifikationen liefen über direkte SQL-Operationen (per Supabase-MCP-Tools) mit der echten, bereits existierenden Nutzer-ID — nie über neue Auth-Accounts. Test-Zeilen wurden nach jeder Verifikation rückstandslos wieder gelöscht.

## Gefundene Bugs (alle gefunden + gefixt)

1. **Registrierung** (`src/features/auth/api/auth.api.ts`, `app/(auth)/sign-up.tsx`): Supabase-Projekt hat "Confirm email" aktiviert (Standard). `signUp()` gelang serverseitig, lieferte aber `session: null` zurück; der Screen leitete trotzdem bedingungslos weiter und wurde vom Auth-Gate zurückgeschickt. Fix: `signUpWithEmail` gibt jetzt `{ needsEmailConfirmation }` zurück.
2. **`finish_workout`-RPC** (`supabase/migrations/0002_fix_finish_workout_personal_records.sql`): Die `personal_records`-Upsert-Query erzeugte eine Zeile pro *Satz* statt pro *Übung* — brach bei mehr als einem completed Satz derselben Übung (der Normalfall). Fix: `distinct on (exercise_id) order by weight desc` vor dem Upsert.
3. **`node_modules` nach Merge nicht synchron** — siehe eigener Abschnitt oben.
4. **`expo-notifications` crasht die gesamte App auf Android in Expo Go** (`src/features/reminders/utils/notifications.ts`, `app/_layout.tsx`): Erster echter On-Device-Test der Workout-Erinnerungen (Nutzer, Android-Gerät, Expo Go) schlug sofort beim App-Start fehl — nicht erst beim Öffnen des Reminders-Screens. Ursache: seit Expo SDK 53 ist `expo-notifications` auf Android innerhalb von Expo Go nicht mehr unterstützt; **schon das bloße Importieren des Moduls wirft dort synchron einen Fehler**, nicht erst der Aufruf einer Push-spezifischen Funktion. Da das Modul bisher als statischer Seiteneffekt-Import ganz oben in `app/_layout.tsx` eingebunden war (um `setNotificationHandler` früh zu registrieren), riss das den kompletten Root-Layout-Render mit runter — jede Nutzer:in traf den Crash beim Start, nicht nur beim Öffnen der Erinnerungen. Fix: kein statischer Import von `expo-notifications` mehr irgendwo im Code; `notifications.ts` lädt es jetzt ausschließlich per `await import('expo-notifications')` innerhalb einzelner, async gekapselter Funktionen, und jede dieser Funktionen prüft zuerst `isReminderSchedulingSupported()` (`Constants.appOwnership === 'expo' && Platform.OS === 'android'`, via bereits vorhandenem `expo-constants`) — auf dieser Kombination wird das Modul gar nicht erst berührt. Der Reminders-Screen zeigt in diesem Fall eine erklärende Karte statt eines kaputten Buttons; `handleSave`/`handleDisable` fangen zusätzlich jeden unerwarteten Fehler ab, statt ihn unbehandelt durchzureichen. iOS Expo Go und jeder Development-/Standalone-Build (beide Plattformen) sind laut Doku nicht betroffen und funktionieren wie ursprünglich geplant.

## Git

Kein `git init`-Neustart nötig; **GitHub-Remote seit dieser Session vorhanden**: `origin` → `https://github.com/PavithV/OpenTracker.git` (auf Nutzerwunsch eingerichtet und gepusht, `master`-Branch, Auth lief automatisch über bereits vorhandene Git-Credential-Manager-Anmeldedaten). Workflow weiterhin: alle Änderungen über Worktree-Branches (`EnterWorktree`-Tool), Fast-Forward-Merge in `master`, danach `git push origin master`. Aktueller `master`-Head: `2d496e3` ("Add local workout reminders (Phase 4, item 7)"). Kein PR-Workflow (Direct-Push, da Solo-Projekt).

## Was funktioniert (verifiziert)

- `npx tsc --noEmit`, `npm run lint`, `npx expo export --platform ios` (Bundling-Smoke-Test) → nach jeder Änderung sauber geblieben.
- Supabase-Projekt (`rlcrhsubxcsjbqpgrwvs`) vollständig provisioniert: 9 Tabellen, RLS aktiv, 4 Migrationen angewendet, 1.324 Übungen samt Medien importiert.
- Kompletter Kernkreislauf end-to-end gegen die Live-DB verifiziert (per SQL-Simulation): Routine anlegen → bearbeiten → auflisten → starten → Workout durchführen → beenden → in Workout-Historie/-Detail, Übungsdetail, Profil-Aggregaten, Rekorde-Übersicht und Kalender korrekt erscheinen.
- **Neu diese Session:** Die App startet nachweislich echt über Expo Go auf dem Gerät des Nutzers (nach dem `node_modules`-Fix). Vollständige Navigation/Interaktion auf dem Gerät noch nicht rückgemeldet.

**Weiterhin nicht verifiziert:** Die visuelle Umsetzung des Nocturne-Redesigns (exakte Abstände, Fokus-Ringe, Press-Feedback) sowie eine vollständige Funktionsprüfung aller Screens auf dem Gerät.

## Implementierte Features

- **Navigation**: Expo Router mit `Stack.Protected`-Auth-Gate. Alle Screens voll funktionsfähig, kein Screen ohne Einstiegspunkt.
- **Design System „Nocturne"**: siehe `ARCHITECTURE.md`, Abschnitt „Design System".
- **Auth**: Sign-in/Sign-up gegen Supabase Auth, inkl. korrekter Behandlung von "Confirm email aktiv".
- **Home-Tab**: echte Workout-Historie inkl. Übungsvorschau mit rundem Bild + Satzanzahl, Kalender-Einstiegspunkt im Header.
- **Übungsauswahl**: Suche, Kategorie-/Geräte-/Favoriten-Filter, Mehrfachauswahl, Attributions-Hinweis, „Eigene Übung erstellen".
- **Routinen**: erstellen/bearbeiten/auflisten/starten, inkl. Notizfeld.
- **Aktives Workout**: Timer, Volumen/Satz-Anzeige, Satz-Erfassung, Rest-Timer, Plattenrechner-Einstiegspunkt, Notizen (Workout- und Pro-Übung-Ebene), lokale AsyncStorage-Persistenz.
- **Workout-Detail**: Header-Stats + alle Übungen mit Sätzen und Notizen.
- **Übungsdetail**: drei Tabs (Zusammenfassung inkl. PR-Diagramm + Favoriten-Stern, Historie, So geht's).
- **Profil-Tab**: echte Aggregate, Muskel-Split-Balkendiagramm, Einstieg zur Rekorde-Übersicht.
- **Rekorde-Übersicht**: alle Übungen mit persönlichen Rekorden.
- **Custom Exercises**: eigene Übung erstellen (Name/Kategorie/Gerät/Zielmuskel, optionale Bild-URL).
- **Rest-Timer**: Countdown im aktiven Workout, App-Kill-sicher.
- **Plattenrechner**: Plattenkombination pro Seite für Zielgewicht + Stangentyp.
- **Favoriten**: Übungen favorisieren (Stern-Icon im Picker + Übungsdetail, Filter-Chip im Picker).
- **Kalender**: Monatsraster der Trainings-Historie, Tag antippen zeigt Workouts dieses Tages.
- **Workout-Erinnerungen**: rein lokal geplante, wiederkehrende Erinnerungen (`expo-notifications`), Wochentag-/Uhrzeit-Auswahl, Einstiegspunkt im Profil-Tab.
- **DB-Schema**: `0001_init.sql` + `0002_fix_finish_workout_personal_records.sql` + `0003_add_estimated_1rm_personal_record.sql` + `0004_add_favorite_exercises.sql`.
- **Tooling**: ESLint + Prettier, `.npmrc` mit `legacy-peer-deps=true`, GitHub-Remote.

## Supabase-Projekt & MCP-Status

- Projekt `rlcrhsubxcsjbqpgrwvs`, MCP-Server über `ToolSearch` auffindbar und für alle Migrationen/Verifikationen/Bugfixes genutzt.
- `get_advisors(security)` zeigt nur erwartete, unkritische Warnungen (`SECURITY DEFINER` by design, "Leaked Password Protection Disabled" als Supabase-Standardempfehlung, bisher nicht bearbeitet).
- MCP-Tools geben keinen `service_role`-Key heraus — liegt manuell in `.env`.

## Bekannte offene Punkte aus der Konzeptphase

Siehe `MVP_REVIEW.md` für die vollständige Liste. Die meisten sind durch Phase 2/3/4 nicht adressiert, da außerhalb des jeweiligen Punkte-Scopes (z. B. Satz-Typen/Warm-up-Sets, Einheiten-Einstellung kg/lb — Letzteres auch beim Plattenrechner bewusst nicht adressiert, siehe `TODO.md`). Siehe `TODO.md` für den genauen Stand pro Punkt.
