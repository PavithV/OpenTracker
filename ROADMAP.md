# Roadmap

## Phase 1

- Projekt erstellen
- Navigation
- Dark Mode
- Design System
- Supabase verbinden
- Authentication
- **Exercise-Seed-Skript** (neu): `exercises.json` → Supabase importieren, inkl. Attribution/Lizenzfeldern

---

## Phase 2 (MVP)

- Übungen
- Workout Tracking (inkl. lokaler Zwischenspeicherung des aktiven Workouts, Satz-Typen, Routinen-Sollwerte)
- Historie
- Profil

---

## Phase 3

- Diagramme
- One Rep Max
- Muskel Split
- Rekorde (`personal_records`-Tabelle wird hier aktiv genutzt/angezeigt)

---

## Phase 4

- Kalender
- Workout Erinnerungen
- Favoriten
- Notizen
- **Custom Exercises** (neu)
- **Rest-Timer** (neu)
- **Plattenrechner** (neu)

---

## Phase 5 — Offline-Support & Multi-Device-Sync

*Umbenannt von "Cloud Sync":* Die Cloud-Anbindung (Supabase) existiert bereits seit Phase 1. Diese Phase behandelt stattdessen echtes Offline-First-Verhalten mit Konfliktauflösung bei Mehrgeräte-Nutzung.

- Offline-First-Support & Sync-Konfliktauflösung
- Social
- Workout Sharing
- Freunde
- Leaderboards

---

## Vollständiges Produkt-/UX-/Architektur-Audit (2026-07-24)

Nach Abschluss von Phase 4 und dem Nocturne-Redesign wurde eine vollständige Analyse der App aus Produkt-, UX-, UI-, Architektur-, Performance-, Datenbank- und Sicherheitssicht durchgeführt, inkl. über 100 neuer Feature-Ideen und einer priorisierten Top-50-Roadmap. Vollständiger Inhalt in `PRODUCT_AUDIT.md` — dieses Dokument (`ROADMAP.md`) bleibt die grobe Phasen-Einteilung, `PRODUCT_AUDIT.md`s "Priorisierte Gesamt-Roadmap" ist die konkrete, sofort umsetzbare Punkteliste für die nächsten Schritte nach Phase 4.
