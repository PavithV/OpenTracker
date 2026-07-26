# Architektur

Ergänzt `TECH_STACK.md` (Feature-Based Architecture) um eine konkrete Ordner- und API-Struktur.

**Audit-Hinweis (2026-07-24):** Eine vollständige Architektur-/React-Native-Performance-Analyse (Abweichungen von dieser Struktur, Query-Key-Duplikation, fehlende Memoisierung, Re-Render-Probleme im aktiven Workout, DRY/SOLID-Kandidaten) findet sich in `PRODUCT_AUDIT.md`, Abschnitte 4 und 5.

**Status (Stand 2026-07-24, Ende der Session):** Diese Struktur ist seit Phase 1 real angelegt (nicht mehr nur geplant). `[implementiert]` markiert Ordner mit echtem Inhalt, `[Platzhalter]` markiert angelegte, aber noch leere bzw. nur mit Stub-Screens gefüllte Ordner. `tests/` existiert noch nicht. Die Migration läuft live gegen das Supabase-Projekt (`rlcrhsubxcsjbqpgrwvs`, 4 Migrationen: Schema + Bugfix in `finish_workout` + `estimated_1rm`-Erweiterung + `favorite_exercises`), `database.types.ts` ist aus dem echten Schema generiert, alle 1.324 Übungen samt Medien sind importiert. Phase 2 (Punkte 1–8) und die komplette aktuelle Phase-3-Planungsgrundlage (Punkte 1–4: PR-Diagramm, One Rep Max, Muskel-Split, Rekorde-Übersicht) sind vollständig umgesetzt und gegen die Live-DB verifiziert — siehe `PROJECT_STATUS.md` und `TODO.md` für Details, Begründungen und die zwei in Phase 2 gefundenen Bugs. Vor Phase 4 wurde außerdem eine zuvor undokumentierte Lücke geschlossen: runde Übungsbild-Thumbnails fehlten im Home-Bereich, Workout-Detail und Übungshistorie. Für Phase 4 existiert eine technische Bestandsaufnahme (sieben Punkte laut `ROADMAP.md`); Punkt 1 (Notizen), Punkt 2 (Custom Exercises: neues Formular + Screen `exercise/create`, nutzt die seit `0001_init.sql` bestehenden `is_custom`/`created_by`-Spalten und RLS-Policies), Punkt 3 (Rest-Timer: rein clientseitiger Countdown im aktiven Workout, App-Kill-sicher über einen persistierten Endzeitpunkt statt eines Sekunden-Zählers), Punkt 4 (Plattenrechner: reine Client-Logik, neuer Screen `plate-calculator`), Punkt 5 (Favoriten: neue vierte Migration `favorite_exercises`, Nutzer entschied sich für "nur Übungen", Stern-Toggle im Picker und in der Übungsdetailseite, geteilter React-Query-Key für Konsistenz zwischen beiden Stellen) und Punkt 6 (Kalender: Historie-Ansicht per Nutzer-Entscheidung, selbstgebautes Monatsraster ohne neue Lib, wiederverwendet `getWorkoutHistory()` und `WorkoutHistoryCard` vom Home-Tab) und Punkt 7 (Workout-Erinnerungen: Nutzer entschied sich für Variante (a), rein lokal über `expo-notifications` — neue Dependency, Config-Plugin in `app.json`, neues Feature `src/features/reminders/` mit Zustand-`persist`-Store und einem `notifications.ts`-Utility-Modul, neuer Screen `app/reminders.tsx`, Wochentag-Auswahl + Uhrzeit, wiederkehrende `WEEKLY`-Trigger pro ausgewähltem Tag, keine serverseitige Planung/Push-Tokens) sind umgesetzt. **Phase 4 ist damit vollständig abgeschlossen.** **Danach, außerhalb der Phase-4-Liste:** vollständiges Redesign auf das **Nocturne**-Design-System (aus einem Claude-Design-Projekt importiert) — neue Farb-/Typografie-/Spacing-/Radius-Tokens, Buttons als Outlines statt Flächen, Inter-Schriftfamilie, Icon-Wechsel von `lucide-react-native` zu `phosphor-react-native`. Details, Interpretations-Entscheidungen und bekannte Vereinfachungen im Abschnitt „Design System" unten. **Danach außerdem:** ein echter GitHub-Remote eingerichtet (`origin` → `https://github.com/PavithV/OpenTracker.git`, gepusht) und ein echter Environment-Bug gefunden + gefixt — `node_modules` im Nutzer-Checkout war nach dem Merge nicht mit dem geänderten `package.json` synchron, da alle `npm install`-Läufe dieser Session nur innerhalb isolierter Worktrees liefen (Details in `PROJECT_STATUS.md`). Die App startet seitdem nachweislich echt über Expo Go auf dem Gerät des Nutzers; eine vollständige On-Device-Funktions- und Visualprüfung steht weiterhin aus. **Danach (2026-07-26):** Nocturne wieder abgelöst durch das **iOS-Redesign** (ebenfalls aus einem Claude-Design-Projekt importiert, diesmal per `DesignSync`-Tool aus einem regulären Projekt statt einem Design-System-Projekt gelesen) — echter Light+Dark-Modus statt einer einzelnen dunklen Palette, gefüllte Akzent-Buttons statt Outlines, fette 34px-Titel statt max. Gewicht 500, blurred Tab-Bar via neuer Dependency `expo-blur`. Details im Abschnitt „Design System" unten (Unterabschnitt „iOS-Redesign").

## Ordnerstruktur

```
app/                        # Expo Router – nur Routing, keine Business-Logik      [implementiert]
  (auth)/
    sign-in.tsx                # funktionsfähig
    sign-up.tsx                # funktionsfähig
  (tabs)/
    home/index.tsx             # liest echte Workout-Historie aus `workouts`, je Karte bis zu 3 Übungen mit rundem Bild + Satzanzahl
    training/index.tsx         # Routinen-Liste (Name+Vorschau+"Routine starten"), "Routine erstellen", "Leeres Workout starten"
    profile/index.tsx          # echtes Profil + Aggregate (Workouts/Trainingszeit/Volumen) + Muskel-Split-Balkendiagramm
  workout/
    active.tsx                 # Timer, Volumen/Satz-Anzahl, Satz-Erfassung, lokal AsyncStorage-persistiert
    [id].tsx                   # Workout-Detail: Name/Datum/Dauer/Volumen + alle Übungen (mit Bild) mit Sätzen
  routine/
    create.tsx                 # funktionsfähig (Name, Übungsauswahl, Reihenfolge, Soll-Werte)
    [id]/edit.tsx               # funktionsfähig, erreichbar über die Routinen-Liste im Training-Tab
  exercise/
    picker.tsx                  # Suche, Kategorie-/Geräte-Filter, Mehrfachauswahl, runde Bilder
    [id].tsx                    # Übungsdetail: Tabs Zusammenfassung (inkl. PR-Chart)/Historie/So geht's, erreichbar über Workout-Detail
  records.tsx                   # Rekorde-Übersicht: alle Übungen mit personal_records, erreichbar über den Profil-Tab
  _layout.tsx                   # Auth-Gate (Stack.Protected)

src/
  features/
    home/             {components, hooks, api, types}        [implementiert: api (Historie + Workout-Detail), components, types]
    training/          {components, hooks, api, types, store} [implementiert: store, api, components, types]
    routines/          {types, store, api, components}        [implementiert]
    exercises/         {components, hooks, api, types}        [implementiert: api (Picker + Detail/Historie/PR), components, types]
    profile/           {components, hooks, api, types}        [implementiert: api (Stats + Muskel-Split), components, types]
    records/            {api, types}                          [implementiert]
    reminders/          {store, utils}                         [implementiert]
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
  migrations/           # 0001_init.sql (Schema) + 0002 (finish_workout-Fix) + 0003 (estimated_1rm)  [implementiert, live angewendet]
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

**Nocturne** (Stand 2026-07-24) — ersetzt das ursprüngliche, 2026-07-23 etablierte Design System vollständig. Importiert aus einem Claude-Design-Projekt (`claude.ai/design`, Projekt "Nocturne", per `DesignSync`-Tool gelesen: `theme.json`, `styles.css`, `readme.md`) und von dessen Web/Deck-Tokens auf eine React-Native-App übertragen — kein Copy-Paste-Port, sondern eine Übersetzung der Prinzipien (siehe „Interpretations-Entscheidungen" unten für die Stellen, an denen das Web-Original keine 1:1-Entsprechung in RN hat). Ein dunkler, ruhiger Ton-in-Ton-Look: nahezu neutrales Blau-Grau als Grund, Inter in Medium-Gewicht, weiche 8px-Radien, ein einzelner Akzent (ein Blurple, `#9184d9`) als Linie/Glow statt als Fläche. **Einziges Theme** — `theme.json` definiert nur eine (dunkle) Palette, kein Light Mode.

**Token-Quellen (zwei, mit klarer Aufgabenteilung):**
- `tailwind.config.js` — die eigentliche Quelle der Wahrheit für alles, was per `className` gestylt wird. Enthält `background`, `surface` (+ `surface.raised`), `border`, `text.primary/secondary/tertiary`, `primary` (= Nocturnes Akzent), `success`/`warning`/`danger`, die Spacing-Skala (`xs`…`2xl`) und Radius-Skala (`sm`…`xl`), sowie `fontFamily` (`sans`/`sans-medium`/`sans-semibold`/`sans-bold`, siehe „Typografie" unten).
- `src/shared/theme/colors.ts` — Rohwert-Spiegel derselben Farben für die wenigen RN-APIs, die kein `className` verstehen (Tab-Bar-Tint-Farben, `ActivityIndicator`-`color`-Prop, `placeholderTextColor`). Muss von Hand synchron gehalten werden.
- `src/shared/theme/icons.ts` — `ICON_SIZE`-Konstanten (`sm`/`md`/`lg`).

**Architektur-Entscheidung — `light`/`dark`-Token-Paare bleiben bestehen, obwohl es nur noch ein Theme gibt:** Nocturne definiert nur eine dunkle Palette, aber `tailwind.config.js`/`colors.ts` behalten die `{light, dark}`-Struktur bei — beide Werte sind jetzt einfach identisch, statt das gesamte `dark:`-Variant-System und jeden `useColorScheme()`-Aufruf app-weit zu entfernen. Grund: die Token-*Architektur* (semantische Namen + Light/Dark-Struktur) ist funktionierende Infrastruktur, die nicht kaputt war — nur ihre *Werte* mussten sich ändern. Eine vollständige Entfernung hätte ~20 zusätzliche Dateien anfassen müssen, ohne einen sichtbaren Unterschied zu erzeugen (jeder `dark:`-Klassenname löst jetzt einfach auf denselben Wert auf wie sein Nicht-`dark:`-Gegenstück). Aus demselben Grund blieb der Token-*Name* `primary` erhalten statt zu `accent` umbenannt zu werden (~10 Dateien referenzieren `bg-primary`/`text-primary`/`colors.primary.DEFAULT`) — die Farb-*Werte* wurden auf Nocturnes Akzent geändert, der Code-Name ist reine interne Konvention.

**Typografie:** Inter, geladen über `@expo-google-fonts/inter` (`app/_layout.tsx`, `useFonts`-Gate analog zum bestehenden `isInitializing`-Gate). **Wichtige Falle vermieden:** Inter wird als vier einzelne, gewichtsfeste `.ttf`-Dateien geladen (kein Variable Font) — Tailwinds eingebaute `fontWeight`-Utilities (`font-bold`, `font-semibold`, `font-medium`) ändern in RN nur die CSS-Eigenschaft `font-weight`, was bei einer bereits fest-gewichteten Schriftdatei wirkungslos ist (RN kann kein Gewicht aus einer einzelnen statischen Datei synthetisieren). Deshalb eigene `fontFamily`-Tokens mit Namen, die *nicht* mit Tailwinds `fontWeight`-Klassennamen kollidieren: `font-sans` (Inter_400Regular), `font-sans-medium` (Inter_500Medium), `font-sans-semibold`/`font-sans-bold` (geladen, aber von keiner Komponente verwendet — Nocturnes eigenes `styles.css` benutzt nirgends mehr als Gewicht 500, siehe readme: „Don't bolden headings past their 500 weight"). Alle `Typography`-Varianten sowie jedes rohe `<Text>`/`<TextInput>` außerhalb von `Typography` (`Button`, `Input`, `EmptyState`, `FilterChip`, `calendar.tsx`) tragen jetzt explizit `font-sans` bzw. `font-sans-medium` — RN vererbt Textstile nicht automatisch von Elternelementen, ein globaler Default war ohne riskante `Text.defaultProps`-Mutation (in React 19 für Funktionskomponenten ohnehin nicht mehr zuverlässig) nicht sauber erreichbar.

**Buttons sind Outlines, keine Flächen:** Nocturnes `.btn-primary` ist eine 1px-Akzent-Outline auf transparentem Grund, nie eine gefüllte Fläche („the primary is an accent outline, never a fill"). `Button.tsx`s `primary`-Variante wurde entsprechend umgebaut (`border-primary` + `text-primary`, Press-Tint über Tailwinds Opacity-Modifier `bg-primary/20` statt eines soliden `active:bg-primary-dark`). `FilterChip`s ausgewählter Zustand folgt demselben Prinzip (`border-primary bg-primary/15` statt vorher solidem `bg-primary`) — Nocturnes readme verbietet explizit großflächige Akzentflächen ("Don't: flood large areas with the accent"). `destructive` hat in Nocturne keine Entsprechung (das System kennt keine Danger-Rolle) und blieb bewusst eine solide Fläche, damit destruktive Aktionen sich weiterhin sichtbar von den sonst überall gedämpften Outline-Aktionen abheben.

**Icons:** ausschließlich `phosphor-react-native` (Nocturnes `iconSet: "phosphor"`), ersetzt `lucide-react-native` vollständig (Dependency entfernt) — 1:1-Mapping über alle 10 betroffenen Dateien (`CalendarDays→Calendar`, `History→ClockCounterClockwise`, `ChevronLeft/Right/Up/Down→CaretLeft/Right/Up/Down`, `SearchX→MagnifyingGlass`, `Dumbbell→Barbell`, `Trash2→Trash`, `Check`/`Circle`/`Star`/`X`/`Trophy`/`House`/`User` unverändert). **Falle:** Phosphors `Circle`-Icon heißt `CircleIcon` (Namenskollision mit `react-native-svg`s eigenem `Circle`-Export vermieden, der in `LineChart.tsx`/`BarChart.tsx` bereits verwendet wird) — importiert als `CircleIcon as Circle`. Aktive/gefüllte Icon-Zustände (Favoriten-Stern) nutzen jetzt Phosphors `weight="fill"`-Prop statt lucides `fill`-Farb-Prop.

**Spacing/Radius — an Mobile angepasst, nicht 1:1 übernommen:** Nocturnes eigene `--space-*`-Tokens (2.8/5.6/8.4/11.2/16.8/22.4px, "density 0.7×... this system is dense on purpose") sind für Desktop-Deck-HTML-Padding kalibriert, nicht für RN-Touch-Abstände. Übertragen auf runde, weiterhin kompakte Mobile-Werte in etwa derselben Reduktion (`xs`: 4px, `sm`: 6px, `md`: 12px, `lg`: 18px, `xl`: 24px, `2xl`: 34px, vorher 4/8/16/24/32/48px). Radius direkt übernommen (`sm`: 4px, `md`: 8px, `lg`: 14px), `xl` (20px) selbst ergänzt, da Nocturne keinen vierten Schritt kennt und nichts im Code `rounded-xl` nutzte.

**Bewusste Vereinfachungen / Bekannte Abweichungen:**
- `success`/`warning`/`danger` bleiben funktional unverändert (kein Nocturne-Äquivalent — das System definiert keine semantischen Zustandsfarben, nur Neutral- und Akzent-Ramp). Der Favoriten-Stern behält seinen warmen Gold-Ton (`warning`) bewusst bei, obwohl er außerhalb der Palette liegt — Sterne/Favoriten sind eine derart universelle UI-Konvention, dass das als Ausnahme wie bei den anderen semantischen Farben behandelt wird, nicht als Bruch mit "keine Sättigung außerhalb des Akzents".
- Keine Mehrschicht-`box-shadow`-Nachbildung (Nocturnes `--shadow-md/lg` sind zweischichtige CSS-Shadows) — `Card`s `elevated`-Variante nutzt weiterhin NativeWinds Standard-`shadow-md`-Utility (plattformspezifische RN-Shadow-Props), keine Pixel-genaue Nachbildung der Web-Werte.
- `@expo-google-fonts/inter` bündelt beim Build alle 18 Inter-Gewichte/-Kursivvarianten (nicht nur die 4 tatsächlich geladenen) — bekannter Kompromiss dieses Pakets (ein einziges `index.js` mit unbedingten `require()`s für jede Datei), erhöht die Bundle-Größe um ca. 5 MB. Nicht behoben (Standard-Nutzungsmuster laut Expo-Doku), aber hier dokumentiert.
- **Visuell noch nicht auf einem echten Gerät bestätigt** — die App startet inzwischen nachweislich echt über Expo Go (siehe `PROJECT_STATUS.md`, Abschnitt „Environment-Bug" — ein `node_modules`-Sync-Problem nach dem Merge wurde dabei gefunden und gefixt), aber eine visuelle Prüfung des Redesigns selbst (exakte Abstände, Fokus-Ringe, Press-Feedback-Intensität) durch den Nutzer steht noch aus.

**Komponenten (`src/shared/components/`):** unverändert in ihrer API (`Typography`, `Button`, `Card`, `Input`, `ListItem`, `EmptyState`, `LineChart`, `BarChart`) — nur die zugrundeliegenden Tokens/Klassen wurden angepasst. `Card`, `ListItem`, `Screen`, `LineChart`, `BarChart` und `ExerciseDetailTabs` brauchten *keine* Änderung, da sie ausschließlich über die Token-Schicht stylen (kein hartkodierter Hex-Wert, kein `fontWeight`-Utility) — der Nutzen der ursprünglichen Token-Architektur-Entscheidung. Keine weiteren Komponenten (kein Badge/Alert/Dialog/Avatar) — nichts im bestehenden Code braucht sie aktuell.

### iOS-Redesign (Stand 2026-07-26, löst Nocturne ab)

Importiert aus einem Claude-Design-Projekt ("OpenTracker iOS redesign", `projectId 5ef100a4-…`, per `DesignSync`-Tool gelesen: `OpenTracker Redesign.dc.html`). Anders als Nocturne kein Design-System-Projekt, sondern ein reguläres Claude-Design-Canvas-Projekt mit einem einzigen Mockup-File — `ios-frame.jsx`/`support.js`, die dieses File importiert, sind reine Vorschau-Infrastruktur des Design-Canvas (Gerätechrome + Render-Engine) und wurden bewusst **nicht** portiert. Ein iOS-26-("Liquid Glass")-Look für Home/Training/Profil plus den aktiven Workout-Screen: echter Light+Dark-Modus, gefüllte Akzentflächen statt Outlines, fette große Titel, weiche 20px-Karten, eine durchscheinende Tab-Bar.

**Kippt zwei explizite Nocturne-Prinzipien (Nutzer-Entscheidung, nicht versehentlich):**
- Buttons sind jetzt gefüllte Flächen, keine Outlines mehr (`Button.tsx`: `primary` = Akzentfläche + weißer Text, `secondary` = `surface-raised`-Fläche statt Border, `ghost` bleibt transparent/textbasiert — trägt jetzt zusätzlich ein `color="danger"`-Prop für die "Sign Out"-Zeile statt eines eigenen Variants).
- `Typography`s `title`-Variante geht auf 34px/`font-sans-bold` (Inter_700Bold, vorher geladen aber ungenutzt) statt max. Gewicht 500.

**Echter Light+Dark statt einer Palette:** `tailwind.config.js`/`colors.ts` bekommen erstmals wirklich unterschiedliche `light`/`dark`-Werte (vorher bei Nocturne bewusst identisch, siehe Abschnitt oben) — übersetzt aus den oklch-Werten in `dc.html`s `renderVals()`-Funktion auf Hex/RGBA, da RNs Style-Prozessor kein `oklch()` parst. **Ausnahme:** `primary`/`danger` bleiben in `colors.ts` (dem *rohen* Mirror für RN-APIs ohne `className`) weiterhin je ein einzelner, schemaunabhängiger Wert — jeder rohe Verbraucher (Chart-Füllfarben, Tab-Bar-Tint, kleine Icon-Farben) ist ein dekorativer Akzent, kein Fließtext, ein Wert, der auf einem nahezu-weißen *und* einem nahezu-schwarzen Grund noch gut lesbar ist, ist hier ein akzeptabler Kompromiss. Für die Stellen, an denen Kontrast wirklich zählt (Links, Fokus-Ringe, ausgewählte Zustände in `FilterChip`, `ExerciseDetailTabs`, `calendar.tsx`, den Auth-Links), existiert das echte Paar als `className`s (`text-primary-light dark:text-primary-dark` usw.) — `Typography` bekam dafür ein fünftes `color`-Prop, `accent`, das genau dieses Paar kapselt, statt es an sieben Stellen einzeln zu wiederholen.

**Tab-Bar-Blur:** neue Dependency `expo-blur` (`BlurView` als `tabBarBackground`, `tabBarStyle.backgroundColor: 'transparent'`) — bewusst *nicht* `position: 'absolute'` (das ist der übliche Ansatz für einen echten iOS-Overlay-Effekt, bei dem Inhalt unter der Bar durchscrollt), weil jede Tab-Screen ihr `Screen`-`edges`-Prop schon so gesetzt hat, dass die Tab-Bar als eigener Layout-Bereich den unteren Abstand übernimmt („the tab bar is the bottom buffer") — `position: 'absolute'` hätte das für alle drei Tab-Screens neu austarieren müssen, ohne zusätzlichen visuellen Gewinn.

**Bewusst nicht 1:1 übernommen:**
- Der große Satz-Checkbox-Touch-Bereich in `ActiveWorkoutExerciseCard.tsx` (kürzlich extra vergrößert, siehe Commits „Larger set-checkbox"/„Enlarge set checkbox further") bleibt `flex-1` statt auf die kleine kreisförmige Checkbox aus dem Mockup zurückgebaut zu werden — eine sehr aktuelle, explizite Nutzer-Entscheidung wiegt hier schwerer als Mockup-Treue an dieser einen Stelle. Nur die Akzentfarbe wurde aktualisiert.
- Keine Mehrschicht-Shadows (gleiche RN-Einschränkung wie bei Nocturne) — `Card`s Schatten bleibt NativeWinds `shadow-sm`/`shadow-md`.
- Bildlose Übungs-/Workout-Avatare (bisher ein neutraler grauer Kreis) zeigen jetzt einen Anfangsbuchstaben auf akzent-getöntem Grund (`WorkoutHistoryCard`, `WorkoutDetailExerciseCard`, `ActiveWorkoutExerciseCard`, `RoutineExerciseRow`, `ExerciseHistoryEntryCard`, `exercise/picker.tsx`) — im Mockup nur für die Home-Historie gezeigt (`ex.initial`), hier aus Konsistenzgründen auf alle gleichartigen Stellen übertragen, nicht im Mockup selbst spezifiziert.
- Nicht bespielte Screens (Auth, Kalender, Rekorde, Erinnerungen, Routine erstellen/bearbeiten, Übungsdetail, Plattenrechner) wurden nicht einzeln umgebaut — sie erben den neuen Look automatisch über die Token-/Komponentenschicht, da für sie kein eigenes Mockup existiert.
- **Visuell noch nicht auf einem echten Gerät bestätigt** (gleicher Vorbehalt wie beim Nocturne-Redesign).

## Tooling: Supabase MCP-Server

Zusätzlich zum manuellen Weg (SQL-Editor + `npm run db:seed`) ist ein projekt-gescopter Supabase-MCP-Server konfiguriert (`.mcp.json`, project_ref `rlcrhsubxcsjbqpgrwvs`, Features: docs/account/database/debugging/development/functions/branching/storage). Damit lassen sich Migrationen, Schema-Inspektion und Debugging direkt aus der Session heraus erledigen, statt SQL-Dateien nur zu schreiben und manuell ausführen zu lassen — die Migration in `supabase/migrations/0001_init.sql` wurde am 2026-07-23 genau so live angewendet. Authentifizierung läuft über `claude` → `/mcp` in einer interaktiven Session; in einem früheren Background-Job waren die Tools trotz "Connected"-Status nicht auffindbar, in dieser Session dagegen doch (siehe `PROJECT_STATUS.md`) — die MCP-Tools geben aus Sicherheitsgründen aber keinen `service_role`-Key heraus, der bleibt für `npm run db:seed` weiterhin manuell aus dem Dashboard zu holen. Ergänzend installiert: die Skills `supabase` und `supabase-postgres-best-practices` (`.agents/skills/`, `.claude/skills/`).
