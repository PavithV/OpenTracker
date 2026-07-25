# Produkt-, UX-, Architektur- und Sicherheitsaudit

**Stand: 2026-07-24.** Reine Analyse, keine Implementierung — dieses Dokument ist die Grundlage für zukünftige Priorisierungsentscheidungen, kein Umsetzungsauftrag. Methodik: drei parallele Read-Only-Recherche-Agenten (Screen-für-Screen-UX-Inventar, Design-System-Audit, Architektur-/RN-Performance-Audit), eigene Datenbank-/Sicherheitsprüfung direkt über die Supabase-MCP-Tools (`get_advisors`, `list_tables`, `execute_sql`, alle Migrationen gelesen), der `ui-ux-pro-max`-Skill für die UX/UI-Bewertungsraster (Accessibility/Touch/Performance/Navigation-Prioritätstabelle + native-App-Pre-Delivery-Checklist), sowie ein vollständiger Abgleich gegen `MVP.md`, `MVP_REVIEW.md`, `PROJECT_OVERVIEW.md`, `TECH_STACK.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `TODO.md`, `PROJECT_STATUS.md`, `DATABASE.md`. Alle Befunde sind mit `Datei:Zeile` belegt, wo sinnvoll.

**Priorisierungsskala** (einheitlich im gesamten Dokument): **Kritisch** (blockiert Release / echtes Sicherheits- oder Datenverlustrisiko) → **Hoch** (spürbare Nutzerfrustration oder App-Store-Ablehnungsrisiko) → **Mittel** (Politur, die vor breiterem Rollout gemacht werden sollte) → **Niedrig** (nice-to-have, jederzeit nachrüstbar).

---

## 1. Produktanalyse

### 1.1 Bewertung pro Bereich

| Bereich | Sehr gut | Fehlt / unfertig | Würde Nutzer stören | Priorität |
|---|---|---|---|---|
| **Home** | Echte Historie, bis zu 3 Übungs-Thumbnails pro Karte, Kalender-Einstieg | Kein Pull-to-Refresh, kein Ladezustand (Blank-Screen beim Laden), kein Fehlerzustand (still hängender leerer State bei Fetch-Fehler) | Nutzer sieht bei langsamer Verbindung nur eine leere Fläche ohne jedes Signal, dass etwas passiert | Hoch |
| **Training/Routinen** | Drag-and-Drop-Reihenfolge, echtes Pro-Satz-Zielmodell (SET/KG/WDH), Bild-Thumbnails, Löschen mit Bestätigung | Kein Undo nach Löschen, keine Routinen-Duplizierung ("Als Kopie speichern"), kein Ordnen/Gruppieren mehrerer Routinen (z. B. nach Tag/Split) | Versehentliches Löschen einer mühsam aufgebauten Routine ist endgültig (kein Undo, kein Papierkorb) | Hoch |
| **Aktives Workout** | Persistenter Store (App-Kill-sicher), Rest-Timer, Plattenrechner-Verknüpfung, Notizen auf 3 Ebenen | Kein Vorheriger-Satz-Hinweis ("letztes Mal: 60 kg × 8" — im MVP-Review bereits 2026 als Lücke notiert, weiterhin offen), kein Superset/Zirkeltraining, kein Körpergewichts-Tracking, kein Warm-up-Satz-UI trotz DB-Unterstützung (`set_type` existiert, wird nirgends in der aktiven Workout-UI gesetzt) | Ohne Referenzwert zum letzten Mal muss der Nutzer sein Trainingstagebuch "im Kopf" führen — der mit Abstand am häufigsten genannte Grund für App-Wechsel bei Kraft-Tracking-Apps | Kritisch |
| **Übungsauswahl/-detail** | Suche, Filter, Favoriten, Custom Exercises, 3-Tab-Detail inkl. PR-Chart | Leerer-Zustand-Text bei Katalog-Fehler ist eine Entwickler-Anweisung ("Führe `npm run db:seed` aus...", `exercise/picker.tsx:160`) statt Endnutzer-Text — würde 1:1 in Produktion sichtbar, falls die Tabelle je leer wäre | Ein Produktionsnutzer, der eine leere Übungsliste sieht, bekommt eine Seed-Skript-Anweisung angezeigt, die er nicht ausführen kann | Kritisch |
| **Profil** | Echte Aggregate, neues Zeitreihen-Diagramm mit Zeitraum-/Metrik-Auswahl | Kein Avatar-Upload trotz `avatar_url`-Spalte im Schema, kein Einstellungsbereich überhaupt (keine Einheiten-Umstellung kg/lb trotz `unit_preference`-Spalte), Abmelden ohne Bestätigung | "Abmelden" ohne Rückfrage ist ein klassischer Fehltritt-Auslöser; `unit_preference` existiert seit Migration 0001, wird aber nirgends in der UI respektiert (bereits in `TODO.md` dokumentiert, weiterhin unadressiert) | Hoch |
| **Rekorde** | Klare, alphabetische Liste mit bestem Gewicht + geschätztem 1RM | Keine Filterung/Sortierung (z. B. nach Datum des letzten PRs, nach Muskelgruppe), kein "neuer PR"-Badge/Hervorhebung kürzlich gebrochener Rekorde | Nutzer, die stolz auf einen frischen PR sind, bekommen dafür keinerlei visuelle Anerkennung — verschenktes Motivations-Feature | Mittel |
| **Kalender** | Historien-Ansicht mit Tagesmarkierung, Wiederverwendung der Home-Karten-Komponente | Kein Wochen-/Jahres-Überblick, keine Streak-Anzeige, Monatsraster ist nicht swipebar (nur Pfeil-Tap) | Kalender-Apps werden von Nutzern reflexhaft mit Wisch-Gesten bedient — die fehlende Swipe-Geste fällt sofort auf | Niedrig |
| **Erinnerungen** | Lokale, wiederkehrende Benachrichtigungen ohne Server-Overhead | Nur ein einziger globaler Zeitplan (keine unterschiedlichen Zeiten pro Wochentag), kein "Snooze", funktioniert nicht in Expo Go auf Android (dokumentierte SDK-Einschränkung) | Nutzer, die Montags früh und Freitags abends trainieren, können das nicht unterschiedlich einstellen | Niedrig |
| **Plattenrechner** | Sauberer Algorithmus, Vorbefüllung aus dem aktiven Satz | Nur kg, kein lb-Scheibensatz (bewusste, dokumentierte Vereinfachung), keine gespeicherten "Lieblings-Stangentypen" | International reisende/US-Nutzer mit lb-Ausrüstung bekommen keinen Nutzen aus dem Rechner | Niedrig |
| **Auth** | Funktionierender Sign-in/Sign-up-Flow, E-Mail-Bestätigung korrekt behandelt | Kein "Passwort vergessen"-Flow, kein Social Login (Apple/Google Sign-In — auf iOS von Apple für Apps mit Drittanbieter-Login sogar vorgeschrieben, falls je ein solcher hinzukäme), kein Onboarding nach Erstregistrierung | "Passwort vergessen" fehlt komplett — ein Nutzer, der sein Passwort vergisst, hat keinen Weg zurück in die App außer einer neuen Registrierung | Kritisch |

### 1.2 Feature-Vergleich zu modernen Fitness-Apps (Hevy/Strong/Strava/Whoop-Klasse)

| Feature-Kategorie | Bei modernen Apps Standard | In OpenTracker vorhanden? |
|---|---|---|
| Vorheriger-Satz-Referenz beim Logging | Ja (Hevy, Strong) | ❌ Fehlt |
| Supersets/Zirkeltraining | Ja | ❌ Fehlt |
| Warm-up-Satz-Kennzeichnung in der UI | Ja | ⚠️ DB-Spalte existiert (`set_type`), UI nutzt sie nirgends |
| Soziales Feed/Kudos/Kommentare | Ja (Hevy, Strava) | ❌ Fehlt (bewusst auf Phase 5 verschoben) |
| Apple Health / Google Fit Sync | Ja (praktisch überall Standard) | ❌ Fehlt komplett, keine `expo-health`-artige Dependency |
| Wearable-Unterstützung (Watch-App, Herzfrequenz) | Ja (Hevy, Strong, Whoop) | ❌ Fehlt komplett |
| Trainingsplan-/Programm-Vorlagen (z. B. 5/3/1, PPL) | Ja | ❌ Fehlt — nur eigene Routinen, keine Vorlagen-Bibliothek |
| Körpermaße/Körpergewicht-Tracking | Ja | ❌ Fehlt (im MVP-Review bereits 2026 notiert) |
| Fortschrittsfotos | Ja (Hevy) | ❌ Fehlt |
| Offline-Nutzung über aktives Workout hinaus (z. B. Historie offline durchsuchen) | Teilweise | ⚠️ Nur das aktive Workout ist offline-sicher; alles andere braucht Netz |
| Export (CSV/PDF) | Ja (Strong) | ❌ Fehlt (im MVP-Review bereits 2026 notiert) |
| Push-Erinnerungen | Ja | ✅ Vorhanden (nur lokal, kein Server) |
| Rest-Timer mit Sound/Vibration | Ja | ⚠️ Nur visueller Countdown, bewusst ohne Haptik/Sound |
| Barcode-/KI-Ernährungstracking | Ja (MyFitnessPal-Klasse) | ❌ Fehlt (aber auch nie im Scope — reines Workout-Tracking) |
| Dunkelmodus | Ja | ✅ Vorhanden (einziges Theme) |
| Hellmodus | Ja (meist beide) | ❌ Fehlt vollständig, nicht mal als Option |

### 1.3 "Wow"-Feature-Kandidaten (Differenzierung, nicht nur Aufholen)

1. **KI-gestützte Trainingsanalyse** ("Dein Volumen für Schultern ist seit 3 Wochen stagniert — hier sind 2 Übungsvarianten") — nutzt bereits vorhandene `personal_records`/`muscle-split`-Daten, kein neues Datenmodell nötig.
2. **Automatische Deload-Erkennung**: erkennt anhand des `total_volume`-Trends, wann eine Entlastungswoche sinnvoll wäre, und schlägt sie proaktiv vor.
3. **"Perfekte Woche"-Streak-Visualisierung** direkt im Kalender (Wochen mit ≥N Workouts golden markiert) — Gamification, die auf bereits vorhandenen Daten aufbaut.
4. **Sprachgesteuerte Satz-Erfassung** ("100 Kilo, 8 Wiederholungen") während des aktiven Workouts, für Nutzer mit verschwitzten/staubigen Händen.
5. **Automatischer Trainingsplan-Generator** aus Zielen (Kraft/Hypertrophie/Ausdauer) + verfügbaren Geräten, basierend auf dem bereits vorhandenen `category`/`equipment`-Schema der Übungsdatenbank.

---

## 2. UX-Analyse (Screen für Screen)

### 2.1 Globale Befunde (gelten screenübergreifend)

| Befund | Belegt durch | Priorität |
|---|---|---|
| **0 Accessibility-Props im gesamten Code** — kein `accessibilityLabel`/`accessibilityRole`/`accessibilityHint` in `app/` oder `src/` (verifiziert per Grep, unabhängig gegengeprüft) | App-weit | Kritisch |
| **Kein Pull-to-Refresh irgendwo** — kein `RefreshControl` im gesamten Code | App-weit | Hoch |
| **Keine App-eigenen Animationen** — `react-native-reanimated` ist installiert, aber nirgends direkt genutzt (nur als Peer-Dependency von `react-native-draggable-flatlist`/Gesture-Handler); alle Zustandswechsel sind sofortige, unanimierte Re-Renders | App-weit | Mittel |
| **Kein Toast/Snackbar-Mechanismus** — jede erfolgreiche Aktion (Speichern, Löschen, Abmelden) navigiert einfach still zurück, ohne Bestätigung | App-weit | Hoch |
| **Fehlerzustände inkonsistent**: Home, Training-Liste, Profil, Records und der Übungspicker prüfen `error` aus ihren `useQuery`-Aufrufen **nie** — bei einem Fetch-Fehler wird einfach eine leere Liste angezeigt, ununterscheidbar vom echten "keine Daten"-Zustand | Home/Training/Profil/Records/Picker | Hoch |
| **Kein sichtbarer Zurück-Button irgendwo** — `headerShown: false` app-weit; einzige Ausnahme ist das "X" auf dem aktiven Workout-Screen. Jeder andere Screen verlässt sich ausschließlich auf die (unentdeckbare) OS-Wischgeste | App-weit | Hoch |

### 2.2 Screen-für-Screen-Tabelle (verdichtet aus dem vollständigen Audit)

| Screen | Ladezustand | Empty State | Error State | A11y | Gesten | Taps (Kernaktion) |
|---|---|---|---|---|---|---|
| Sign-in/Sign-up | Nur Button-Spinner | N/A | Inline + `Alert.alert` | Keine | Keine | 1 (nach Eingabe) |
| Home | ❌ Keiner (Blank) | ✅ `EmptyState` | ❌ Keiner | Keine | Nur Scroll | 1 |
| Training | ❌ Keiner (Blank) | ✅ `EmptyState` (ohne Icon) | Nur bei Mutation | Keine | Nur Scroll | 1 (Routine starten) |
| Profil | ❌ Keiner (Elemente poppen einfach rein) | ❌ Kein expliziter Empty State | ❌ Keiner | Keine | Nur Scroll | 1 |
| Routine erstellen/bearbeiten | ✅ (nur Edit) Spinner | Reiner `Typography`-Text statt `EmptyState` | ✅ `Alert.alert` | Keine (Drag-Handle für Screenreader unerreichbar) | Long-Press-Drag | 3 (Name→Übung hinzufügen→Speichern) |
| Übungspicker | ❌ Keiner (Blank) | ✅ `EmptyState` (aber Dev-Text als Fallback) | Nur bei Favoriten-Toggle | Keine | Horizontal-Scroll-Chips | N+1 |
| Übungsdetail | ✅ Vollbild-Spinner | ✅ (nur Historie-Tab) | Nur bei Favoriten-Toggle | Keine (Tabs ohne `accessibilityRole="tab"`) | Tap-only Tabs | 2 (Detail + Tab) |
| Aktives Workout | ⚠️ Echter Blank-Screen während Hydration | Reiner Text statt `EmptyState` | ✅ `Alert.alert` | Keine | Modal-Swipe-Dismiss | 1 (Start) |
| Workout-Detail | ✅ Spinner | Kein `ListEmptyComponent` | ✅ `Alert.alert` + Auto-Back | Keine | Nur Scroll | 2 (Löschen inkl. Bestätigung) |
| Records | ✅ Spinner | ✅ `EmptyState` | ❌ Keiner | Keine | Nur Scroll | 2 |
| Kalender | ❌ Keiner | ✅ `EmptyState` (aber ununterscheidbar von "lädt noch") | ❌ Keiner | Keine (Tagesraster ohne Status-Ansage) | Nicht swipebar | 1–2 |
| Plattenrechner | N/A (synchron) | Reiner Text | Stille Unterdrückung ungültiger Eingabe | Keine | Modal-Swipe | 1 |
| Erinnerungen | N/A | ⚠️ Geräte-Fähigkeits-Hinweis statt echtem Empty State | ✅ Inline-Text (einziger Screen ohne `Alert.alert`-Konvention) | Keine | Nur Scroll | 2+ |
| Eigene Übung erstellen | N/A | N/A | ✅ Inline + `Alert.alert` | Keine | Modal-Swipe | 4 |

### 2.3 Konkrete Verbesserungsvorschläge (priorisiert)

1. **[Kritisch]** `error` aus jedem `useQuery`-Aufruf konsequent behandeln (mind. eine gemeinsame Fehlerkarte/Retry-Button-Komponente) — betrifft Home, Training, Profil, Records, Kalender, Übungspicker.
2. **[Kritisch]** Accessibility-Labels für alle Icon-only-Buttons nachrüsten (Favoriten-Stern, Löschen-Icons, Kalender-Pfeile, Tab-Bar, Drag-Handle) — betrifft die komplette App, ist gleichzeitig ein App-Store-Review-Risiko (Apple prüft aktiv auf Screenreader-Tauglichkeit bei Neueinreichungen).
3. **[Hoch]** Mindestens eine sichtbare Zurück-Affordanz auf Nicht-Tab-Screens einführen (`headerShown: true` + Zurück-Chevron oder ein konsistentes eigenes Header-Muster) — aktuell rein gestenbasiert und für Erstnutzer nicht entdeckbar.
4. **[Hoch]** Ladezustände für Home/Training/Profil/Records/Kalender ergänzen (Skeleton oder zumindest `ActivityIndicator`) — aktuell wirkt die App bei langsamer Verbindung wie eingefroren.
5. **[Hoch]** Ein einheitlicher Toast/Snackbar-Mechanismus für Erfolgsbestätigungen (Gespeichert/Gelöscht/Hinzugefügt) statt des aktuellen "stillen Zurück-Navigierens".
6. **[Hoch]** Pull-to-Refresh auf allen Listen-Screens (Home, Training, Records, Kalender).
7. **[Mittel]** Undo-Funktion nach Löschen (Routine/Workout) — mindestens ein 5-Sekunden-Toast mit "Rückgängig".
8. **[Mittel]** Die dev-lastige Leer-Zustand-Nachricht im Übungspicker (`npm run db:seed`) durch echte Endnutzer-Copy ersetzen.
9. **[Niedrig]** Sanfte Übergangsanimationen (150–300 ms) für Tab-Wechsel, Bottom-Sheet-Erscheinen, "Zeige mehr"-Expand — aktuell alles hart geschnitten.
10. **[Niedrig]** Swipe-Geste für Kalender-Monatswechsel zusätzlich zu den Pfeil-Buttons.

---

## 3. UI-Analyse (Design System "Nocturne")

### 3.1 Token-Konsistenz — insgesamt sehr sauber

Spacing ist die **konsistenteste Achse im gesamten System**: eine vollständige Grep-Prüfung über `app/` und `src/` fand **null** Treffer für Arbitrary-Value-Klassen (`gap-[...]`) oder rohe numerische Spacing-Klassen (`p-2`, `mt-4`) — jede einzelne Spacing-Angabe im Code nutzt die deklarierte Skala (`xs/sm/md/lg/xl/2xl`). Icon-Größen und -Farben sind ebenso durchgängig token-basiert (0 rohe `size={NN}`- oder Hex-Literale außer den Token-Quelldateien selbst).

### 3.2 Konkrete gefundene Inkonsistenzen

| # | Befund | Fundstelle(n) | Priorität |
|---|---|---|---|
| 1 | **`Card`'s `elevated`-Variante (`shadow-md`) wird nirgends im gesamten Code und in der gesamten Git-Historie verwendet** — toter Code seit dem ersten Commit, der sie eingeführt hat | `src/shared/components/Card.tsx:13` | Niedrig |
| 2 | **Ein hartkodierter Hex-Wert** (`#FFFFFF`) statt eines Tokens im ansonsten vollständig token-basierten `Button.tsx` | `Button.tsx:53` | Niedrig |
| 3 | **Thumbnail-Größe uneinheitlich**: 48px (`h-12 w-12`) an 4 von 5 Stellen, aber 40px (`h-10 w-10`) in `ExerciseHistoryEntryCard` — kein gemeinsames `THUMBNAIL_SIZE`-Token existiert überhaupt | `ExerciseHistoryEntryCard.tsx:22,24` vs. 4 andere Dateien | Mittel |
| 4 | **"Löschen"-Icon-Farbe uneinheitlich** für dieselbe semantische Aktion (Satz entfernen): rot (`colors.danger`) in `RoutineExerciseRow.tsx:108`, aber neutral-grau (`secondaryColor`) in `ActiveWorkoutExerciseCard.tsx:85` | Beide Dateien | Mittel |
| 5 | **Zwei getrennte visuelle Sprachen für "Löschen"**: schwergewichtiger, bestätigter `Button variant="destructive"` nur für Workout-Löschen/Erinnerungen-Deaktivieren, aber ein unbestätigtes, unstyled Trash-Icon für Routine-Löschen, Übung-Entfernen und Satz-Entfernen — inkonsistente Gewichtung von Lösch-Risiken | `RoutineCard.tsx:27-29`, `ActiveWorkoutExerciseCard.tsx:47-49,84-86`, `RoutineExerciseRow.tsx:58-62,102-109` | Hoch |
| 6 | **Card-artige Flächen, die `<Card>` nicht wiederverwenden**, landen auf einem anderen Radius (8px statt der Card-Standardgröße 14px): der Pausen-Timer-Banner im aktiven Workout und die PR/1RM-Statboxen im Übungsdetail | `workout/active.tsx:169`, `exercise/[id].tsx:144,153` | Niedrig |
| 7 | **`EmptyState`'s Icon-Größe ist kein reiner Token** (`ICON_SIZE.lg + 8` statt einem der drei kanonischen Werte) | `EmptyState.tsx:19` | Niedrig |
| 8 | **Drei strukturell fast identische, aber unabhängig implementierte "Satz-Zeile"-Komponenten** mit leicht abweichenden Spalten-Breiten (`w-8` vs. `w-10` für die Index-Spalte) ohne funktionalen Grund | `ActiveWorkoutExerciseCard.tsx`, `WorkoutDetailExerciseCard.tsx`, `RoutineExerciseRow.tsx` | Niedrig |
| 9 | **`colors.ts` muss von Hand synchron zu `tailwind.config.js` gehalten werden** — keine Build-Zeit-Prüfung verhindert Drift zwischen den beiden Token-Quellen | `src/shared/theme/colors.ts` (Kommentar warnt bereits selbst davor) | Mittel |
| 10 | **Zwei Tailwind-Radius-Tokens (`rounded-sm`, `rounded-xl`) und der `success`-Farbtoken sind komplett ungenutzt** — definiert, aber nirgends im Code referenziert | `tailwind.config.js` | Niedrig |

### 3.3 Dark-Mode-Only — bestätigt, keine Lücke, aber eine Produktentscheidung

Es gibt **keinen** erreichbaren Weg zu einem hellen Theme (kein Toggle, keine Einstellungen-Seite überhaupt) — `light`/`dark`-Tokenpaare existieren nur strukturell, sind aber überall byte-identisch. Das ist eine bewusste, dokumentierte Design-Entscheidung (`ARCHITECTURE.md`), aber im Store-Kontext relevant: Nutzer, die ihr Gerät auf "Hell" gestellt haben, bekommen trotzdem eine dunkle App ohne Erklärung/Option — für ein Consumer-Produkt ungewöhnlich und in App-Store-Bewertungen ein häufig genannter Kritikpunkt bei anderen Apps ("gibt's das auch im hellen Modus?").

---

## 4. Architektur

### 4.1 Feature-Struktur vs. dokumentiertes Soll

Jede Feature-Mappe, die laut `ARCHITECTURE.md` einen `hooks/`-Unterordner haben sollte (`home`, `training`, `exercises`, `profile`, `auth`), hat in Wirklichkeit **null** `hooks/`-Ordner. Stattdessen liegt jede Hook-artige Logik direkt in `app/`-Routendateien:

- `useElapsedSeconds`/`useRemainingSeconds` in `app/workout/active.tsx:23-64` (gehört strukturell nach `src/features/training/hooks/`).
- `useDebouncedValue` in `app/exercise/picker.tsx:29-36` (generische, feature-übergreifend wiederverwendbare Logik, die aktuell an einen einzigen Screen gebunden ist).

Das verletzt den in `ARCHITECTURE.md:57` selbst festgehaltenen Grundsatz ("`app/` bleibt dünn... UI, Business-Logik und Data-Layer sind getrennt"). Gleichzeitig sind zwei **undokumentierte** `utils/`-Ordner entstanden (`home/utils/`, `training/utils/`, `profile/utils/`), die im Architekturdokument nicht vorgesehen waren, aber sinnvoll befüllt sind (Kalender-Grid-Logik, Plattenrechner-Algorithmus, Chart-Bucketing) — die Dokumentation ist hier hinter der tatsächlichen (guten) Struktur zurückgeblieben, nicht umgekehrt.

### 4.2 Query-Key-Duplikation (DRY-Verstoß)

Kein einziger Query-Key-Builder existiert im gesamten Code — jeder Aufrufort tippt das Array-Literal von Hand. Konkret dupliziert:
- `['workouts', 'history', userId]` an 3 Stellen unabhängig getippt (Home, Kalender, Invalidierung in Workout-Detail).
- `['profile', 'stats', userId]` an 2 Stellen.
- Die `favoritesQueryKey`-Konstruktion ist an 2 Stellen **unabhängig neu geschrieben**, obwohl `ARCHITECTURE.md:96` explizit "ein geteilter Query-Key für Konsistenz" als Designziel festhält — die Absicht ist dokumentiert, aber im Code nicht als tatsächlich geteilte Referenz umgesetzt, sondern nur als identischer Ausdruck kopiert.

**Fehlende Invalidierung nach Mutation**: `createRoutine`/`updateRoutine` invalidieren nach dem Speichern **keinen** Query-Key — die Trainings-Liste zeigt bis zu 30 Sekunden (der `staleTime`) veraltete Daten. `finishActiveWorkout` invalidiert ebenfalls nichts, obwohl der strukturell identische Lösch-Pfad (`deleteWorkout`) es korrekt tut — eine Inkonsistenz innerhalb derselben Feature-Familie.

### 4.3 SOLID/DRY/KISS — konkrete Kandidaten

1. Der Bestätigungs-Dialog fürs Löschen ist in `workout/[id].tsx` und `training/index.tsx` strukturell identisch dupliziert (gleiche Button-Struktur, gleiches Catch-Alert-Muster) — Kandidat für einen gemeinsamen `confirmDestructiveAction(...)`-Helper.
2. Das Bild-oder-Platzhalter-Ternary (`imageUrl ? <Image/> : <View placeholder/>`) ist **wortwörtlich 5-mal** dupliziert, ohne eine gemeinsame `ExerciseThumbnail`-Komponente.
3. `err instanceof Error ? err.message : 'Unbekannter Fehler'` erscheint **10-mal** identisch — ein Kandidat für eine geteilte `getErrorMessage(err)`-Utility.
4. Drei strukturell fast identische "Satz-Zeile"-Renderings (aktives Workout, Workout-Detail, Routinen-Editor) — bewusst unterschiedliches Verhalten (editierbar/read-only/Template), aber das visuelle Grundgerüst könnte eine gemeinsame Basis teilen.

### 4.4 Kein Tests-Ordner, keine Testinfrastruktur

`TECH_STACK.md` deklariert Vitest + React Native Testing Library als Teil des Stacks — **keines von beiden ist installiert** (nicht in `package.json`, weder in `dependencies` noch `devDependencies`), und `tests/` existiert laut `ARCHITECTURE.md` selbst "noch nicht". Das gesamte Projekt hat **null automatisierte Tests**, trotz eines in `PROJECT_OVERVIEW.md` explizit formulierten Anspruchs an Clean Architecture/Wartbarkeit. Dies ist der größte Abstand zwischen deklariertem Anspruch und Realität im gesamten Projekt.

### 4.5 Zod praktisch ungenutzt

Zod ist als Kern-Dependency für Formvalidierung deklariert (`TECH_STACK.md`), wird aber nur in **einer einzigen Datei** verwendet (`src/features/auth/types/auth.schema.ts`, nur für Sign-in/Sign-up). Jede andere Form im Projekt (Routine, Custom Exercise, Plattenrechner, Erinnerungen) validiert manuell per `useState` + Ad-hoc-`if`-Prüfungen — funktioniert, ist aber eine weitere Stack-Zusage, die in der Praxis nicht eingelöst wurde.

---

## 5. React Native Review

### 5.1 Bestätigtes Performance-Problem: Sekunden-Timer re-rendert den kompletten aktiven Workout-Screen

`useElapsedSeconds` (`app/workout/active.tsx:23-40`) hält seinen tickenden State **auf oberster Komponentenebene** von `ActiveWorkoutScreen`. Jede Sekunde löst das einen Re-Render der **gesamten** Screen-Komponente aus — inklusive der kompletten Übungs-`FlatList` mit allen `ActiveWorkoutExerciseCard`s, allen offenen `Input`-Feldern und dem Rest-Timer-Banner. Da zusätzlich kein einziger `FlatList`-`renderItem` im gesamten Projekt mit `useCallback` stabilisiert ist und keine Listenzeile mit `React.memo` versehen ist, kann React auch nicht durch Referenzgleichheit abkürzen — jede Sekunde wird der komplette Baum neu durchgerechnet, solange ein Workout aktiv läuft. Das ist der konkreteste, am leichtesten zu behebende Performance-Befund im gesamten Audit.

### 5.2 Memoisierung — praktisch nicht vorhanden

7 `useMemo`-Aufrufe im gesamten Code, **null** `useCallback`, **null** `React.memo`. Alle 10 `FlatList`/`DraggableFlatList`-Instanzen im Projekt übergeben eine `renderItem`-Funktion, deren Identität sich bei jedem Render ändert (entweder direkt inline in JSX oder — im Fall von `RoutineForm.tsx` — als benannte, aber nicht mit `useCallback` stabilisierte Funktion). Bei den aktuellen, überschaubaren Listengrößen (wenige Workouts/Routinen/Übungen pro Nutzer) ist das noch nicht spürbar, würde aber bei wachsender Nutzungsdauer (Hunderte Workouts in der Historie) zunehmend relevant.

### 5.3 FlatList-Konfiguration

Kein einziges `FlatList` im Projekt setzt `initialNumToRender`, `windowSize`, `getItemLayout` oder `removeClippedSubviews` — alle verlassen sich auf RN-Standardwerte. Bei den aktuellen Datenmengen unkritisch, aber ohne `getItemLayout` skaliert insbesondere die (aktuell ungebremste, siehe 5.4) Home-Historie nicht linear.

### 5.4 Kein Pagination/Limit auf Kern-Listen — echtes Skalierungsrisiko

`getWorkoutHistory()` holt **die komplette Workout-Historie eines Nutzers ohne jedes Limit** bei jedem Öffnen von Home oder Kalender. Bei einem Power-User mit mehreren hundert Workouts wächst diese eine Query unbegrenzt mit der Nutzungsdauer — es gibt keinen Cursor, kein Infinite Scroll, kein serverseitiges `LIMIT`. Dasselbe gilt für `getProfileWorkoutSeries` (immerhin durch den Zeitraumfilter beschränkt) und `getPersonalRecords`. Dies ist aktuell (junge Nutzerbasis, wenige Workouts) unsichtbar, wird aber mit echter Nutzung zum konkreten Performance- und Kostenproblem.

### 5.5 "Flat Queries" erzeugen echte Wasserfälle

Die bewusste Architekturentscheidung gegen verschachtelte PostgREST-Embeds (dokumentiert begründet) erzeugt sequentielle Round-Trip-Ketten: `getWorkoutDetail` und `getRoutineForEdit` brauchen je **4 sequentielle Round-Trips**, `getWorkoutHistory` ebenfalls 4, `getProfileWorkoutSeries` 3 (bei jedem Zeitraum-Chip-Wechsel neu). Besonders auffällig: **"Routine starten" ruft `getRoutineForEdit` imperativ und uncached erneut auf**, obwohl dieselbe Routine Momente vorher schon (in zusammengefasster Form) für die Listenanzeige geladen wurde — kein `queryClient.getQueryData`/Prefetch-Reuse zwischen beiden Aufrufen.

### 5.6 State-Management-Überlappung (Zustand vs. React-Query-Cache)

Zwei Stellen, an denen dieselbe logische Information gleichzeitig in einem Zustand-Store und im Query-Cache existiert, ohne Synchronisationsmechanismus: (1) der Routine-Draft-Store vs. der `['routines','edit',id]`-Query-Cache-Eintrag (Drift möglich, wenn ein Nutzer denselben Edit-Screen innerhalb der `staleTime` erneut betritt), (2) der aktive-Workout-Store, der Routinendaten über einen komplett uncachten Zweitaufruf lädt statt den bereits befüllten Query-Cache zu nutzen.

### 5.7 Was gut funktioniert (keine Änderung nötig)

Navigation ist **lückenlos korrekt verdrahtet** (jeder `router.push`/`router.replace`-Aufruf zeigt auf eine tatsächlich registrierte Route, keine toten Routen gefunden). Alle Timer/Listener (`setInterval`, `setTimeout`, `onAuthStateChange`) haben korrekte Cleanup-Funktionen — keine Speicherlecks gefunden. Keine `FlatList` ist verschachtelt in einer `ScrollView` (Nesting-Warnungsrisiko geprüft und ausgeschlossen).

---

## 6. Datenbank

### 6.1 Fehlende Indizes (konkret, direkt gegen die Live-Datenbank verifiziert)

`workout_exercises` hat **außer dem Primärschlüssel keinen einzigen Index** — weder auf `workout_id` (wird in jeder Workout-Detail-/Historie-/Profil-Serien-Abfrage per `.eq`/`.in` gefiltert) noch auf `exercise_id` (wird für übungsübergreifende Historien-Abfragen gebraucht). Das ist der konkreteste, am leichtesten zu behebende DB-Befund im gesamten Audit — bei wachsender Datenmenge erzwingt jede dieser Abfragen einen sequentiellen Scan der gesamten Tabelle.

| Tabelle | Fehlender Index | Betroffene Queries |
|---|---|---|
| `workout_exercises` | `(workout_id)` | `getWorkoutDetail`, `getWorkoutHistory`, `getProfileWorkoutSeries` |
| `workout_exercises` | `(exercise_id)` | `getExerciseHistory` (übungsübergreifend) |

Alle anderen Tabellen sind korrekt indiziert (`sets(workout_exercise_id)`, `routine_exercises(routine_id, order_index)`, `routine_exercise_sets(routine_exercise_id, set_number)`, `workouts(user_id, started_at desc)`, `exercises(category)` + GIN auf `secondary_muscles`, `favorite_exercises`/`personal_records` über ihre zusammengesetzten Primär-/Unique-Keys).

### 6.2 Fehlende Wertebereichs-Constraints

Keine `CHECK`-Constraint verhindert negative oder absurde Werte in `sets.weight`, `sets.reps`, `routine_exercise_sets.target_weight/target_reps`. Da `total_volume` und `personal_records` direkt aus diesen Werten berechnet werden (serverseitig in `finish_workout`), könnte ein fehlerhafter Client (Bug oder manipulierte Anfrage) dauerhaft unsinnige, aber RLS-konforme Daten in die eigenen Statistiken schreiben (z. B. negatives Volumen). Kein Sicherheitsrisiko (RLS beschränkt weiterhin auf die eigenen Daten), aber eine echte Datenintegritätslücke.

### 6.3 Dokumentations-Drift

`DATABASE.md` spiegelt noch den Stand **vor** Migration 0005 — es dokumentiert weiterhin `routine_exercises.target_sets/target_reps_min/target_reps_max/target_weight`, obwohl diese Spalten inzwischen entfernt und durch die neue `routine_exercise_sets`-Tabelle ersetzt wurden. Ebenso fehlt die Erwähnung von `routine_exercise_sets` komplett. Muss aktualisiert werden (siehe Abschnitt „Aktualisierte Dokumente" am Ende).

### 6.4 Was gut ist

RLS ist auf **jeder einzelnen Tabelle** aktiviert und konsistent nach demselben Muster umgesetzt (Owner-Check direkt oder über 2–3-stufige `EXISTS`-Joins bis zum Owner). `finish_workout` validiert die Workout-Eigentümerschaft explizit serverseitig, bevor es irgendetwas schreibt. Kritische Berechnungen (`total_volume`, `personal_records`) laufen ausschließlich serverseitig — nie client-berechnet und dann vertrauensvoll übernommen.

---

## 7. Sicherheit

### 7.1 Von Supabases eigenem Security-Advisor gemeldet (weiterhin offen)

| Befund | Schwere | Einordnung |
|---|---|---|
| "Leaked Password Protection Disabled" | Warnung | **Echter, kostenloser Quick-Win** — ein einziger Toggle in den Supabase-Auth-Einstellungen, seit Phase 1 unadressiert. Sollte vor jedem öffentlichen Launch aktiviert werden. |
| `finish_workout`/`handle_new_user` als `SECURITY DEFINER` von `anon`/`authenticated` ausführbar | Warnung | **Entschärft, kein reales Risiko**: `finish_workout` prüft `v_user_id <> auth.uid()` explizit und bricht sonst mit einer Exception ab — ein Fremdaufruf schlägt fehl, verändert aber nichts. `handle_new_user` läuft ausschließlich als Trigger auf echte Auth-Signup-Events, nimmt keine frei wählbaren Parameter entgegen. Für einen offiziellen Sicherheits-Review dennoch dokumentieren, warum diese Warnung bewusst akzeptiert wird. |

### 7.2 Eigene Befunde (über die Standard-Advisor-Liste hinaus)

- **Keine serverseitigen Wertebereichsprüfungen** (siehe 6.2) — kein Sicherheitsrisiko im engeren Sinne (RLS schützt weiterhin fremde Daten), aber eine Datenintegritätslücke, die bei einer künftigen Social-/Leaderboard-Funktion (Phase 5) relevanter würde, sobald andere Nutzer diese Werte sehen.
- **Kein "Passwort vergessen"-Flow** (siehe 1.1) ist auch aus Support-/Abuse-Sicht relevant — ohne ihn landen gesperrte Nutzer zwangsläufig bei einer Neuregistrierung, was mittelfristig zu Karteileichen-Accounts führt.
- **Keine Rate-Limits/Abuse-Schutz** auf Client-Seite ersichtlich (kein Captcha/Cool-down beim Sign-up) — bei Supabase Auth Standard, aber nicht explizit geprüft/dokumentiert für dieses Projekt.
- **App-weit keine Input-Sanitisierung über Supabase-Client-Escaping hinaus nötig** — da ausschließlich `supabase-js`-Query-Builder verwendet werden (kein manuelles SQL-String-Building irgendwo gefunden), besteht kein SQL-Injection-Risiko im eigenen Code.

### 7.3 Gesamtbild

Die Grundarchitektur (RLS überall, serverseitige Business-Logik für kritische Aggregate, kein Vertrauen in Client-Werte für PRs/Volumen) ist solide und überdurchschnittlich sorgfältig für ein Projekt dieser Größe. Die zwei konkreten offenen Punkte (Leaked-Password-Protection aktivieren, Wertebereichs-Constraints ergänzen) sind beide klein und schnell zu schließen.

---

## 8. MVP-Review (aktueller Stand vs. ursprüngliches `MVP.md`)

### 8.1 Zusätzlich zum MVP gebaut (Scope-Erweiterung, nicht im ursprünglichen `MVP.md`)

- Gesamtes Phase-3-Programm: PR-Diagramm, One-Rep-Max, Muskel-Split (jetzt korrekt pro Workout-Session statt global im Profil), Rekorde-Übersicht.
- Gesamtes Phase-4-Programm: Notizen (3 Ebenen), Custom Exercises, Rest-Timer, Plattenrechner, Favoriten, Kalender, lokale Workout-Erinnerungen.
- Komplettes Nocturne-Redesign (eigenes Token-System, Inter-Schrift, Phosphor-Icons) — nicht im ursprünglichen MVP-Scope, sondern eine nachträgliche, nutzerseitig gewünschte Design-Iteration.
- Pro-Satz-Zielmodell in Routinen (neue `routine_exercise_sets`-Tabelle) — geht über die ursprüngliche MVP-Anforderung ("Reihenfolge" + einfache Sollwerte) hinaus in Richtung eines vollständigen Hevy-artigen Editors.
- Drag-and-Drop-Reihenfolge in der Routinen-Erstellung (im `MVP_REVIEW.md` von 2026 explizit als "fehlendes Feature" gelistet — inzwischen nachgeliefert).
- Routine-/Workout-Löschen (im ursprünglichen `MVP_REVIEW.md` als Lücke identifiziert — inzwischen nachgeliefert, wenn auch ohne Undo).
- Profil-Zeitreihen-Diagramm mit Zeitraum-/Metrik-Filter (im ursprünglichen `MVP_REVIEW.md` als "Diagramme → Phase 3" verschoben, jetzt umgesetzt, aber bewusst ohne Follower/Folgend).

### 8.2 Was aus dem ursprünglichen `MVP_REVIEW.md` (2026, Konzeptphase) weiterhin offen ist

Direkter Abgleich der damals dokumentierten Schwachstellen gegen den heutigen Code-Stand:

| Damals identifizierte Lücke | Heute behoben? |
|---|---|
| Kein Editieren/Löschen bereits erfasster Sätze im aktiven Workout | ✅ Behoben (Satz-Update/-Löschen existiert) |
| Kein Crash-/Interrupt-Schutz | ✅ Behoben (AsyncStorage-Persistenz) |
| Keine Soll-Werte pro Übung in der Routine | ✅ Übererfüllt (jetzt Pro-Satz-Modell) |
| Kein Satz-Typ (Warm-up vs. Working) | ⚠️ **Weiterhin offen** — Spalte existiert, UI fehlt |
| Kein Rest-Timer | ✅ Behoben |
| Keine zeitbasierten Übungen (Plank etc.) | ⚠️ **Weiterhin offen** — `duration_seconds`-Spalte existiert auf `sets`, keine UI dafür |
| Kein Bearbeiten/Löschen vergangener Workouts | ⚠️ **Teilweise** — Löschen ja, Bearbeiten nach dem Speichern weiterhin nicht möglich |
| Keine nutzerdefinierten Übungen | ✅ Behoben |
| Keine Einheiten-Einstellung (kg/lb) | ⚠️ **Weiterhin offen** — `unit_preference`-Spalte seit Anfang ungenutzt |
| Keine leeren/Fehler-/Ladezustände spezifiziert | ⚠️ **Teilweise** — viele Empty States nachgerüstet, Error-/Ladezustände weiterhin lückenhaft (siehe Abschnitt 2) |
| Attributionspflicht (© Gym visual) fehlt in der UI | ✅ Behoben (Footer-Hinweis im Picker) |
| Rest-Timer zwischen Sätzen | ✅ Behoben |
| Vorheriger-Satz-Referenz | ❌ **Weiterhin offen** |
| Supersets/Zirkeltraining | ❌ **Weiterhin offen** |
| Plattenrechner | ✅ Behoben |
| Körpergewichts-Tracking | ❌ **Weiterhin offen** |
| Trainingsnotizen pro Satz/Workout | ✅ Behoben |
| Datenexport (CSV/PDF) | ❌ **Weiterhin offen** |
| Drag-and-Drop im aktiven Workout | ❌ **Weiterhin offen** (nur im Routinen-Editor umgesetzt, nicht im aktiven Workout selbst) |
| Onboarding-Flow | ❌ **Weiterhin offen** |
| Barrierefreiheit | ❌ **Weiterhin offen, größte unadressierte Lücke aus der ursprünglichen Analyse** |

### 8.3 Was vereinfacht werden könnte

- **`routine_exercise_sets.target_reps` als Einzelwert statt Range**: bewusste Vereinfachung gegenüber dem ursprünglichen Min/Max-Modell — aus Nutzersicht wahrscheinlich sogar besser (Hevy selbst zeigt pro Satz nur einen Zielwert), keine Rückabwicklung nötig.
- **Kein serverseitiges Rezept für "Vorheriger Satz"**: könnte rein clientseitig aus bereits vorhandenen `getExerciseHistory`-Daten abgeleitet werden, ohne neue Tabelle — das größte fehlende Feature ist tatsächlich das billigste, ohne DB-Änderung umsetzbar.

### 8.4 Was Scope-Creep war (im Rückblick, nicht zwingend falsch)

- Das komplette Nocturne-Redesign kam "außerhalb der Roadmap" und hat vermutlich mehr Sitzungszeit gekostet als jedes einzelne MVP-Feature — nachvollziehbar auf Nutzerwunsch, aber ein klassisches Beispiel für Scope-Creep im eigentlichen Sinn (ungeplante Design-Iteration mitten in der Feature-Entwicklung).
- Der volle Umbau von einem aggregierten Routine-Zielmodell auf ein Pro-Satz-Modell (neue Tabelle, Migration, Store-Rewrite, API-Rewrite, UI-Rewrite) für eine reine "sieht anders aus"-Anforderung war ein deutlich größerer Eingriff als ursprünglich nötig gewesen wäre (eine rein visuelle Restyle-Option wurde bewusst verworfen zugunsten des vollen Modells — nachvollziehbare Entscheidung, aber der teuerste der beiden zur Auswahl gestellten Wege).

---

## 9. Feature-Ideen (100+)

Jede Idee: **Nutzen** · **Priorität** (Kritisch/Hoch/Mittel/Niedrig) · **Aufwand** (S = Stunden, M = Tage, L = 1–2 Wochen, XL = mehrere Wochen/neue Infrastruktur).

### 9.1 Kleine Verbesserungen

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---|---|---|---|
| 1 | Bestätigungsdialog vor "Abmelden" | Verhindert versehentliches Ausloggen | Mittel | S |
| 2 | Toast-Bestätigung nach Speichern/Löschen | Klares Erfolgsfeedback statt stillem Zurücknavigieren | Hoch | M |
| 3 | Pull-to-Refresh auf Home/Training/Records/Kalender | Erwartetes Standardmuster, aktuell fehlend | Hoch | S |
| 4 | Undo-Toast nach Löschen (Routine/Workout) | Sicherheitsnetz gegen Fehlbedienung | Hoch | M |
| 5 | Echte Endnutzer-Copy im leeren Übungspicker statt Dev-Anweisung | Verhindert Verwirrung/Vertrauensverlust in Produktion | Kritisch | S |
| 6 | Skeleton-Loader statt Blank-Screen auf Home/Training/Profil | Wahrgenommene Geschwindigkeit | Hoch | M |
| 7 | Sichtbarer Zurück-Button auf allen Nicht-Tab-Screens | Entdeckbarkeit der Navigation | Hoch | M |
| 8 | Swipe-Geste für Kalender-Monatswechsel | Erwartetes Gesten-Muster | Niedrig | S |
| 9 | "Neuer PR"-Badge in der Rekorde-Liste für kürzlich gebrochene Rekorde | Motivation/Anerkennung | Mittel | S |
| 10 | Sortier-/Filteroptionen in der Rekorde-Liste (nach Datum, Muskelgruppe) | Findet relevante Rekorde schneller | Niedrig | S |

### 9.2 Komfortfunktionen

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---|---|---|---|
| 11 | Vorheriger-Satz-Referenz beim Logging ("letztes Mal: 60 kg × 8") | Meistgenanntes fehlendes Feature aus der Konzeptphase | Kritisch | M |
| 12 | Routine duplizieren ("Als Kopie speichern") | Schnelles Erstellen von Varianten (z. B. Deload-Woche) | Mittel | S |
| 13 | Workout aus Vorlage/vorherigem Workout wiederholen (ohne Routine) | Deckt den Zwischenfall zwischen "leeres Workout" und "Routine" ab | Mittel | M |
| 14 | Einheiten-Einstellung kg/lb tatsächlich anwenden | `unit_preference`-Spalte existiert seit Anfang ungenutzt | Hoch | M |
| 15 | Passwort-vergessen-Flow | Fehlt komplett, echte Sackgasse für Nutzer | Kritisch | M |
| 16 | Körpergewichts-Tracking (einfache Tages-Einträge + Chart) | Kernfeature fast jeder Konkurrenz-App | Hoch | M |
| 17 | Warm-up-Satz-Kennzeichnung in der aktiven-Workout-UI | DB unterstützt es bereits (`set_type`), UI fehlt | Mittel | S |
| 18 | Zeitbasierte Übungen (Plank etc.) mit Timer statt Gewicht/Wdh. | DB unterstützt es bereits (`duration_seconds`), UI fehlt | Mittel | M |
| 19 | Mehrere Erinnerungszeiten pro Wochentag | Aktuell nur ein globaler Zeitplan | Niedrig | M |

### 9.3 Power-User-Features

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---|---|---|---|
| 20 | Supersets/Zirkeltraining | Zentrale Trainingsmethodik, aktuell nicht abbildbar | Hoch | L |
| 21 | Drop-Sets/Failure-Sets mit eigener Erfassungslogik | `set_type` unterstützt es bereits im Schema | Mittel | M |
| 22 | RPE-basierte Auto-Gewichtsvorschläge für den nächsten Satz | Nutzt bereits vorhandenes `rpe`-Feld | Mittel | L |
| 23 | Trainingsplan-Vorlagen-Bibliothek (5/3/1, PPL, Ganzkörper A/B/C) | Senkt die Einstiegshürde für neue Nutzer erheblich | Hoch | L |
| 24 | Datenexport (CSV/PDF) der kompletten Historie | Vertrauens-/Portabilitäts-Feature, im MVP-Review seit 2026 gefordert | Mittel | M |
| 25 | Drag-and-Drop-Reihenfolge auch im aktiven Workout (nicht nur im Routinen-Editor) | Konsistenz zum bereits vorhandenen Muster | Niedrig | M |
| 26 | Bulk-Bearbeitung mehrerer Sätze gleichzeitig (z. B. "alle auf 20 kg setzen") | Zeitersparnis bei repetitiven Übungen | Niedrig | M |
| 27 | Eigene Trainingsprogramme mit Wochenzyklus (Routine A/B/C rotierend automatisch vorschlagen) | Reduziert manuelle Auswahl bei festen Splits | Mittel | L |
| 28 | Tastatur-/Sprachkürzel zur schnellen Satz-Eingabe ("+5" für Gewichtssteigerung) | Geschwindigkeit für Vielnutzer | Niedrig | M |

### 9.4 Premium-Features

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---|---|---|---|
| 29 | Erweiterte Analytics (Volumen-Trends pro Muskelgruppe über Monate) | Klassisches Abo-Differenzierungsfeature | Mittel | L |
| 30 | Unbegrenzte Custom-Routinen-Vorlagen / Cloud-Backup-Historie-Export | Monetarisierbare Komfortstufe | Niedrig | M |
| 31 | Coach-Modus (ein Konto verwaltet mehrere Athleten-Profile) | Öffnet B2B2C-Marktsegment (Personal Trainer) | Mittel | XL |
| 32 | Werbefreiheit / Prioritäts-Support als Abo-Bonus | Klassisches Freemium-Muster | Niedrig | S |
| 33 | Erweiterte Ernährungsintegration (Kalorien/Makros pro Trainingstag) | Cross-Sell in angrenzenden Gesundheitsbereich | Niedrig | XL |
| 34 | Individuelles Branding/Themes für Personal Trainer, die die App an Klienten weitergeben | Whitelabel-Umsatzmodell | Niedrig | XL |
| 35 | Prioritärer KI-Coaching-Zugriff (siehe 9.5) als Abo-Feature | Kombiniert zwei Trends (KI + Abo) | Mittel | L |

### 9.5 AI-Features

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---| ---|---|---|
| 36 | KI-Trainingsanalyse ("Schultervolumen stagniert seit 3 Wochen") | Nutzt bereits vorhandene Muskel-Split-Daten, kein neues Datenmodell | Hoch | L |
| 37 | Automatische Deload-Woche-Erkennung/-Vorschlag | Verhindert Übertraining, differenzierendes Feature | Mittel | L |
| 38 | KI-generierter Trainingsplan aus Zielen + verfügbaren Geräten | Nutzt bereits vorhandenes `category`/`equipment`-Schema | Hoch | XL |
| 39 | Natürlichsprachliche Satz-Eingabe ("100 Kilo, 8 Wiederholungen") während des Trainings | Löst das Problem verschwitzter/beschäftigter Hände | Mittel | L |
| 40 | KI-Formcheck per Kamera (grobe Wiederholungszählung/Tempo-Analyse) | Technisch aufwendig, aber ein starkes Differenzierungsmerkmal | Niedrig | XL |
| 41 | Automatische Übungsempfehlung bei Verletzung/Schmerzangabe (alternative Übung gleicher Zielmuskelgruppe) | Nutzt bereits vorhandene `target_muscle`/`secondary_muscles`-Daten | Mittel | M |
| 42 | Wöchentliche KI-Zusammenfassung per Push-Notification ("Deine Woche in Zahlen") | Re-Engagement-Hebel | Mittel | M |
| 43 | Automatische Zielgewicht-Progression basierend auf RPE-Trend | Nutzt bereits vorhandenes `rpe`-Feld | Mittel | L |

### 9.6 Social Features

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---|---|---|---|
| 44 | Follower/Folgend (aus dem Referenz-Screenshot bewusst zurückgestellt) | Netzwerkeffekt, aber braucht komplett neue Infrastruktur | Mittel | XL |
| 45 | Workout-Feed mit Kudos/Likes | Steigert Wiederkehr-Rate messbar bei Konkurrenzprodukten | Mittel | L |
| 46 | Kommentare auf geteilten Workouts | Community-Bindung | Niedrig | L |
| 47 | Workout teilen als Bild/Story-Format (Export für Instagram etc.) | Organisches Marketing durch Nutzer selbst | Mittel | M |
| 48 | Trainingspartner-Verknüpfung (gemeinsame Sichtbarkeit ohne volles Social-Netzwerk) | Leichtgewichtige Alternative zu vollem Social-Feature | Mittel | L |
| 49 | Freundes-Leaderboard nach Volumen/Frequenz (opt-in) | Motivation durch sozialen Vergleich | Niedrig | L |
| 50 | Gemeinsame Routinen (ein Nutzer teilt eine Routine direkt mit einem anderen) | Nützlich für Trainingspartner/Coaches | Mittel | M |

### 9.7 Gamification

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---|---|---|---|
| 51 | Trainings-Streaks (Kalender bereits vorhanden, nur Anzeige fehlt) | Nutzt bereits vorhandene Daten, sehr günstig umsetzbar | Hoch | S |
| 52 | Abzeichen/Achievements (erstes 100-kg-Kreuzheben etc.) | Klassischer Retention-Hebel | Mittel | M |
| 53 | Level-/XP-System basierend auf Gesamtvolumen | Langfristige Motivation | Niedrig | M |
| 54 | "Perfekte Woche"-Visualisierung im Kalender | Baut direkt auf bestehender Kalender-Komponente auf | Mittel | S |
| 55 | Herausforderungen ("30 Tage am Stück trainieren") | Zeitlich begrenzte Motivationskampagnen | Niedrig | M |
| 56 | Persönliche Bestleistungs-Feier-Animation beim Erreichen eines neuen PRs | Emotionaler Belohnungsmoment im Moment des Erfolgs | Mittel | M |
| 57 | Fortschrittsbalken zum nächsten selbstgesetzten Zielgewicht | Klar sichtbares Zwischenziel | Niedrig | S |

### 9.8 Analytics

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---|---|---|---|
| 58 | Trainingsfrequenz-Heatmap (wie GitHub-Contribution-Graph) | Beliebtes, leicht verständliches Visualisierungsformat | Mittel | M |
| 59 | Volumen-pro-Muskelgruppe über Zeit (nicht nur pro Workout, wie aktuell) | Erweiterung des bereits vorhandenen Muskel-Split-Features | Mittel | M |
| 60 | Kraftkurven-Vergleich zwischen mehreren Übungen gleichzeitig | Tieferer Trainingsfortschritts-Einblick für Vielnutzer | Niedrig | M |
| 61 | Wochentag-/Uhrzeit-Analyse ("Du trainierst am stärksten dienstags abends") | Interessanter, leicht zu berechnender Insight aus bereits vorhandenen Daten | Niedrig | S |
| 62 | Verletzungs-/Pausen-Tracking mit Auswirkungsanalyse auf die Progression | Nischenfeature, aber hoher Nutzen für Verletzungsrückkehrer | Niedrig | L |
| 63 | Vergleich "Ich vs. vor 6 Monaten" auf Knopfdruck | Motivierender Fortschritts-Snapshot | Mittel | S |
| 64 | Trainingsintensität-Score kombiniert aus Volumen/RPE/Frequenz | Einzelkennzahl als Schnellüberblick | Niedrig | M |

### 9.9 Widgets

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---|---|---|---|
| 65 | Home-Screen-Widget: nächstes geplantes Training / letzte Session | Sichtbarkeit ohne App-Öffnen | Mittel | L |
| 66 | Home-Screen-Widget: Wochen-Volumen-Fortschritt | Schneller Statusüberblick | Niedrig | L |
| 67 | Lockscreen-Widget: aktiver Rest-Timer-Countdown | Direkt nutzbar während des Trainings, ohne Entsperren | Mittel | L |
| 68 | Home-Screen-Widget: Trainings-Streak-Zähler | Baut auf Gamification-Feature 51 auf | Niedrig | M |
| 69 | Dynamic-Island-/Live-Activity-Unterstützung (iOS) für laufendes Workout | Modernes iOS-Nutzererlebnis, hoher Wow-Faktor | Mittel | L |

### 9.10 Wearables

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---|---|---|---|
| 70 | Herzfrequenz-Aufzeichnung während des Workouts (via verbundener Wearable) | Ergänzt Volumen um eine physiologische Kennzahl | Mittel | XL |
| 71 | Satz-Erfassung direkt von der Smartwatch aus | Reduziert Telefon-in-der-Hand-Bedarf im Gym | Hoch | XL |
| 72 | Automatische Ruhezeit-Erkennung über Bewegungssensorik | Ersetzt manuellen Rest-Timer-Start | Niedrig | XL |
| 73 | Kalorienverbrauch-Schätzung kombiniert aus Herzfrequenz + Volumen | Nutzt Wearable-Daten für zusätzlichen Mehrwert | Niedrig | XL |
| 74 | Vibrations-Feedback am Handgelenk bei Rest-Timer-Ende | Direktes haptisches Feedback ohne aufs Telefon zu schauen | Mittel | L |

### 9.11 Apple Health

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---|---|---|---|
| 75 | Workouts automatisch nach Apple Health exportieren | Erwarteter Standard, fehlt komplett | Hoch | L |
| 76 | Körpergewicht bidirektional mit Apple Health synchronisieren | Vermeidet doppelte manuelle Eingabe | Mittel | M |
| 77 | Herzfrequenzdaten aus Apple Health importieren, statt eigener Wearable-Integration | Günstigere Alternative zu direkter Wearable-Anbindung (9.10) | Mittel | L |
| 78 | Aktive-Energie/Trainingsminuten in Apple Health "Bewegen"-Ring einzahlen | Erhöht wahrgenommenen Nutzen im Apple-Ökosystem | Niedrig | M |
| 79 | Import bestehender Kraft-Workouts aus Apple Health (z. B. von der Apple Watch selbst geloggt) | Erleichtert Umstieg von Konkurrenzprodukten | Niedrig | L |

### 9.12 Google Fit

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---|---|---|---|
| 80 | Workouts nach Google Fit / Health Connect exportieren | Android-Äquivalent zu Feature 75 | Hoch | L |
| 81 | Körpergewicht bidirektional mit Health Connect synchronisieren | Android-Äquivalent zu Feature 76 | Mittel | M |
| 82 | Aktivitätsminuten-Beitrag an Google Fit | Android-Äquivalent zu Feature 78 | Niedrig | M |

### 9.13 Watch Apps

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---|---|---|---|
| 83 | Eigenständige watchOS-App zur Satz-Erfassung ohne Telefon | Größter Komfortgewinn für Gym-Nutzung, aber hoher Aufwand | Hoch | XL |
| 84 | Wear-OS-Äquivalent | Android-Parität zu Feature 83 | Mittel | XL |
| 85 | Watch-Komplikation: aktueller Rest-Timer | Kleinere, schneller lieferbare Vorstufe zu 83 | Mittel | L |
| 86 | Watch-Benachrichtigung bei Rest-Timer-Ende (auch ohne volle Watch-App) | Günstige Zwischenlösung ohne eigene Watch-App | Mittel | M |

### 9.14 Community

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---|---|---|---|
| 87 | Öffentliche Routinen-Bibliothek (Nutzer teilen Routinen mit der Community) | Content-Netzwerkeffekt, senkt Einstiegshürde für neue Nutzer | Mittel | XL |
| 88 | Übungs-Bewertungen/Kommentare von der Community | Reichert die bestehende Übungsdatenbank organisch an | Niedrig | L |
| 89 | Community-Challenges mit gemeinsamem Fortschrittsbalken | Baut auf Gamification (9.7) und Social (9.6) auf | Niedrig | L |
| 90 | Lokale Gym-Gruppen/Standort-basierte Trainingspartner-Suche | Differenzierendes, aber datenschutzsensibles Feature | Niedrig | XL |
| 91 | Verifizierte Trainer-Profile mit eigenen veröffentlichten Programmen | Baut Brücke zu Coach-Features (9.15) | Niedrig | XL |
| 92 | Q&A/Forum-Bereich rund um Übungsausführung | Community-Bindung ohne volles Social-Netzwerk | Niedrig | L |

### 9.15 Coach-Features

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---|---|---|---|
| 93 | Trainer kann Routinen direkt für einen Klienten anlegen/zuweisen | Kernfunktion für B2B2C-Personal-Training-Markt | Mittel | XL |
| 94 | Trainer-Dashboard mit Fortschrittsüberblick mehrerer Klienten gleichzeitig | Ergänzt Feature 93 sinnvoll | Mittel | XL |
| 95 | In-App-Nachrichten zwischen Trainer und Klient | Reduziert Abhängigkeit von externen Messengern | Niedrig | L |
| 96 | Trainer-Feedback direkt an einzelnen Sätzen/Workouts (Kommentarfunktion) | Konkretes, kontextbezogenes Coaching-Feedback | Niedrig | M |
| 97 | Abrechnungs-/Abo-Verwaltung für Trainer-Klienten-Beziehungen | Monetarisierungsinfrastruktur für Coaches | Niedrig | XL |
| 98 | Automatische Fortschrittsberichte, die ein Trainer an Klienten verschickt | Reduziert manuellen Reporting-Aufwand für Trainer | Niedrig | L |
| 99 | Vorlagen-Bibliothek, die ein Trainer für alle eigenen Klienten wiederverwenden kann | Effizienzgewinn für Trainer mit vielen Klienten | Niedrig | L |

### 9.16 Zusätzliche Ideen (übergreifend/sonstige)

| # | Idee | Nutzen | Priorität | Aufwand |
|---|---|---|---|---|
| 100 | Onboarding-Flow für Erstnutzer (Ziel abfragen, erste Routine vorschlagen) | Senkt Abbruchrate direkt nach der Registrierung erheblich | Hoch | M |
| 101 | Hell-Modus als echte Option (aktuell komplett fehlend) | Erwarteter Standard, häufiger Kritikpunkt in Store-Bewertungen anderer Apps | Mittel | L |
| 102 | Mehrsprachigkeit über Deutsch hinaus (App ist komplett hartkodiert deutsch) | Öffnet internationalen Markt, Übungsdaten sind bereits mehrsprachig in der DB vorhanden | Mittel | L |
| 103 | Fortschrittsfotos mit Zeitraffer-Vergleichsansicht | Beliebtes visuelles Motivationsfeature bei Konkurrenzprodukten | Niedrig | M |
| 104 | Trainingsplan-Kalenderintegration (native iOS/Android-Kalender-Einträge für geplante Workouts) | Nutzt bestehende Plattform-Infrastruktur statt Eigenbau | Niedrig | M |
| 105 | Barrierefreiheits-Nachrüstung als eigenständiges, in sich geschlossenes Projekt (siehe Abschnitt 2/10) | Größte einzelne unadressierte Lücke im gesamten Audit | Kritisch | L |

---

## 10. Release-Readiness

### 10.1 Ehrliche Einschätzung: Wenn die App heute veröffentlicht würde

**Es gäbe mehrere echte Blocker.** Die App ist technisch funktionsfähig und der Kernkreislauf (Routine erstellen → Workout durchführen → Historie/Statistiken sehen) ist solide gebaut. Aber sie ist **nicht store-reif** im aktuellen Zustand.

### 10.2 Muss vorher behoben werden (Kritisch, blockierend)

1. **App-Identität fehlt komplett**: kein `bundleIdentifier` (iOS) / `package` (Android) in `app.json` gesetzt — ohne das ist kein Store-Build überhaupt möglich.
2. **App-Icon/Splash sind unveränderte Expo-Standard-Platzhalter** (alle Asset-Dateien tragen denselben Zeitstempel wie das initiale Scaffolding, `#E6F4FE` ist Expos Standard-Hintergrundfarbe) — kein eigenes Branding wurde je erstellt. Ein Store-Review mit Standard-Icon wirkt unfertig und wird von Nutzern sofort bemerkt.
3. **"Passwort vergessen" fehlt** — echte Nutzer-Sackgasse, nicht optional für einen öffentlichen Launch.
4. **Kein einziger automatisierter Test** trotz deklariertem Testing-Stack — vor einem Launch mit echten Zahlungen/Nutzerdaten ein erhebliches Risiko für unbemerkte Regressionen.
5. **Zero Accessibility-Support** — konkretes Risiko für App-Store-Ablehnung (Apple prüft aktiv) und schließt eine ganze Nutzergruppe faktisch aus.
6. **Leaked-Password-Protection weiterhin deaktiviert** — kostenloser Security-Fix, seit Phase 1 offen.
7. **Fehlerzustände auf 5+ Kern-Screens komplett fehlend** (Home, Training, Profil, Records, Kalender, Picker) — bei jedem Netzwerkproblem sieht ein Nutzer nur eine stumme leere Fläche, ein klassischer Auslöser für 1-Stern-Bewertungen ("App zeigt nichts an").

### 10.3 Optional, aber stark empfohlen vor einem breiteren Rollout

- Vorheriger-Satz-Referenz beim Logging (das meistgenannte Konkurrenz-Standardfeature).
- Toast-Feedback statt stillem Zurücknavigieren nach jeder Aktion.
- Pull-to-Refresh auf allen Listen-Screens.
- Undo nach Löschen.
- Onboarding-Flow für Erstnutzer.
- Einheiten-Einstellung kg/lb tatsächlich respektieren (Spalte existiert bereits).

### 10.4 Welche UX-Probleme konkret zu schlechten Bewertungen führen würden

1. "App lädt einfach nicht / zeigt nichts an" — verursacht durch die fehlenden Ladezustände + fehlende Fehlerbehandlung (siehe 2.1, 10.2 Punkt 7).
2. "Ich habe aus Versehen meine Routine gelöscht und sie ist komplett weg" — kein Undo, sofortiges, endgültiges Löschen ohne Sicherheitsnetz über die reine Bestätigung hinaus.
3. "Kann mein Passwort nicht zurücksetzen" — direkter 1-Stern-Auslöser, sehr häufig in echten Store-Bewertungen anderer Apps zu finden, wenn dieser Flow fehlt.
4. "Fühlt sich tot/leblos an" — fehlende Animationen/Haptik/Toast-Feedback summieren sich zu einem insgesamt "unfertig" wirkenden Gesamteindruck, auch wenn jede einzelne Funktion technisch korrekt arbeitet.
5. "Kein heller Modus?" — bei einer Consumer-App ein häufig genannter Kritikpunkt, auch wenn er kein funktionaler Blocker ist.

### 10.5 Optional/kann warten

Follower/Folgend, Wearable-/Watch-Integration, KI-Features, Coach-Features, Community-Features — alle nicht launch-kritisch, alle sinnvoll als Post-Launch-Roadmap (siehe Abschnitt 9).

---

## Priorisierte Gesamt-Roadmap — Top 50

Konsolidiert aus allen zehn Abschnitten, in Bearbeitungsreihenfolge (nicht nach Kategorie). **Kritisch**-Einträge zuerst, dann **Hoch**, dann **Mittel**, jeweils nach Aufwand aufsteigend sortiert innerhalb der Stufe.

### Kritisch (vor jedem öffentlichen Launch)

1. `bundleIdentifier`/`package` in `app.json` setzen (Voraussetzung für jeden Store-Build).
2. Eigenes App-Icon/Splash-Screen erstellen (aktuell unveränderte Expo-Platzhalter).
3. Leaked-Password-Protection in den Supabase-Auth-Einstellungen aktivieren.
4. Dev-lastige Leer-Zustand-Copy im Übungspicker durch Endnutzer-Text ersetzen.
5. "Passwort vergessen"-Flow implementieren.
6. `error`-Behandlung für alle `useQuery`-Aufrufe nachrüsten (Home, Training, Profil, Records, Kalender, Picker) — mind. eine gemeinsame Fehlerkarte mit Retry.
7. Accessibility-Labels für alle Icon-only-Buttons app-weit nachrüsten.
8. Grundlegende Testinfrastruktur aufsetzen (mind. Smoke-Tests für `finish_workout`-Fluss und RLS-Policies).
9. Wertebereichs-Constraints (`weight >= 0`, `reps >= 0` etc.) per Migration ergänzen.
10. Vorheriger-Satz-Referenz beim Logging implementieren (günstig, kein neues Datenmodell nötig).

### Hoch

11. Fehlende Indizes auf `workout_exercises(workout_id)` und `(exercise_id)` ergänzen.
12. Toast/Snackbar-Mechanismus für Erfolgsbestätigungen einführen.
13. Ladezustände (Skeleton/Spinner) für Home/Training/Profil/Records/Kalender ergänzen.
14. Sichtbare Zurück-Affordanz auf allen Nicht-Tab-Screens.
15. Pull-to-Refresh auf Home/Training/Records/Kalender.
16. Undo-Funktion nach Löschen (Routine/Workout).
17. Einheiten-Einstellung kg/lb tatsächlich respektieren.
18. Bestätigungsdialog vor "Abmelden".
19. Zwei visuelle Sprachen für "Löschen" vereinheitlichen (Button-Styling + Bestätigung konsequent für alle Lösch-Aktionen, nicht nur Workout/Erinnerungen).
20. Query-Invalidierung nach `createRoutine`/`updateRoutine`/`finishActiveWorkout` ergänzen (aktuell inkonsistent zu `archiveRoutine`/`deleteWorkout`).
21. Sekunden-Timer im aktiven Workout so umbauen, dass er nicht mehr den kompletten Screen re-rendert (Timer-Text in eine isolierte Komponente auslagern).
22. Onboarding-Flow für Erstnutzer.
23. Körpergewichts-Tracking (einfache Tages-Einträge + Chart).
24. Supersets/Zirkeltraining.
25. Apple-Health-Export (iOS).
26. Google-Fit/Health-Connect-Export (Android).
27. Trainingsplan-Vorlagen-Bibliothek (5/3/1, PPL etc.).
28. `DATABASE.md` auf den aktuellen Schema-Stand (Migration 0005, `routine_exercise_sets`) aktualisieren.

### Mittel

29. Thumbnail-Größe app-weit vereinheitlichen (gemeinsames `THUMBNAIL_SIZE`-Token einführen).
30. Icon-Farb-Inkonsistenz beim Satz-Löschen zwischen `RoutineExerciseRow`/`ActiveWorkoutExerciseCard` beheben.
31. Gemeinsame `confirmDestructiveAction`-Helper-Funktion für die duplizierten Lösch-Bestätigungsdialoge.
32. Gemeinsame `ExerciseThumbnail`-Komponente statt 5-facher Bild-oder-Platzhalter-Duplikation.
33. Gemeinsame `getErrorMessage(err)`-Utility statt 10-facher Duplikation.
34. Query-Key-Builder-Funktionen einführen statt handgetippter Array-Literale.
35. `useElapsedSeconds`/`useRemainingSeconds`/`useDebouncedValue` in reguläre `features/*/hooks/`-Ordner verschieben.
36. Warm-up-Satz-Kennzeichnung in der aktiven-Workout-UI (Schema unterstützt es bereits).
37. Zeitbasierte Übungen (Plank etc.) mit eigenem Timer statt Gewicht/Wiederholungen.
38. Trainings-Streak-Anzeige im Kalender (Daten bereits vorhanden).
39. "Neuer PR"-Badge in der Rekorde-Liste.
40. RPE-basierte Gewichtsvorschläge für den nächsten Satz.
41. KI-Trainingsanalyse basierend auf bereits vorhandenen Muskel-Split-/PR-Daten.
42. Routine duplizieren ("Als Kopie speichern").
43. Datenexport (CSV/PDF).
44. Sanfte Übergangsanimationen (Tab-Wechsel, Expand/Collapse) app-weit ergänzen.
45. Wochentag-/Uhrzeit-Trainingsanalyse als Insight-Karte im Profil.
46. Mehrsprachigkeit (Übungsdaten sind bereits mehrsprachig in der DB vorhanden, UI ist hartkodiert deutsch).
47. Hell-Modus als echte Nutzeroption ergänzen.

### Niedrig

48. Swipe-Geste für Kalender-Monatswechsel.
49. Tote Design-Tokens bereinigen (`Card`'s `elevated`-Variante entweder tatsächlich verwenden oder entfernen; ungenutzte `rounded-sm`/`rounded-xl`/`success`-Tokens).
50. Watch-Komplikation für den Rest-Timer als kostengünstige Vorstufe zu einer vollen Watch-App.

---

## Aktualisierte Dokumente

Im Rahmen dieses Audits wurden folgende bestehende Dokumente mit kurzen Verweisen auf dieses Audit ergänzt (keine inhaltliche Dopplung, nur Querverweise): `ROADMAP.md`, `MVP_REVIEW.md`, `ARCHITECTURE.md`, `DATABASE.md`. Details und der volle Kontext bleiben ausschließlich in diesem Dokument.
