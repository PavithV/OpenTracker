<div align="center">
  <img src="./assets/icon.png" width="96" height="96" alt="OpenTracker icon" />

  <h1>OpenTracker</h1>

  <p>A fast, no-nonsense workout tracker built with Expo, React Native, and Supabase.</p>

  <p>
    <img alt="Expo" src="https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white" />
    <img alt="React Native" src="https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" />
    <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white" />
    <img alt="NativeWind" src="https://img.shields.io/badge/NativeWind-06B6D4?style=flat&logo=tailwindcss&logoColor=white" />
  </p>
</div>

---

OpenTracker is a solo-built, Hevy-inspired strength-training app: log workouts set by set, build reusable routines, track personal records over time, and see your training history at a glance — all backed by a real Postgres database with row-level security, not a local-only toy.

## Features

**Core tracking**
- Log workouts set by set (weight, reps, completion) with an active-workout timer and running volume/set count
- A "last time" reference on every set — no more digging through history to remember what you lifted
- Rest timer between sets, with a plate calculator for figuring out what to load per side
- Local, crash-safe persistence — an app kill mid-workout never loses your progress

**Routines**
- Build reusable routines with a per-set target model (weight + reps per planned set)
- Reorder exercises with simple up/down controls
- Start a routine with one tap, pre-filled with your target sets

**Progress & records**
- Personal-record tracking (max weight + estimated 1RM via the Epley formula) per exercise
- Custom progress charts (weight, session volume, set volume) — hand-built on `react-native-svg`, no charting library
- Muscle-group volume breakdown on your profile
- A dedicated records overview across every exercise you've trained

**Exercise database**
- 1,300+ exercises with images, target muscles, and instructions
- Search, filter by category/equipment, favorite the ones you use most
- Can't find an exercise? Add your own

**Everything else**
- Monthly calendar view of your training history
- Local, recurring workout reminders (no server, no push infrastructure)
- Light/dark/system theme
- Full account deletion, in-app — no support ticket required

## Tech Stack

| Category | Stack |
|---|---|
| **Language** | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) |
| **App framework** | ![Expo](https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white) ![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat-square&logo=react&logoColor=61DAFB) ![Expo Router](https://img.shields.io/badge/Expo_Router-000020?style=flat-square&logo=expo&logoColor=white) |
| **Backend** | ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white) — Postgres, Auth, Row Level Security, Storage |
| **State management** | ![Zustand](https://img.shields.io/badge/Zustand-433E38?style=flat-square) |
| **Data fetching** | ![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white) |
| **Styling** | ![NativeWind](https://img.shields.io/badge/NativeWind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) |
| **Icons** | ![Phosphor Icons](https://img.shields.io/badge/Phosphor_Icons-1A1A1A?style=flat-square) |
| **Charts** | Custom SVG components on ![react--native--svg](https://img.shields.io/badge/react--native--svg-red?style=flat-square) — no charting library |
| **Fonts** | ![Inter](https://img.shields.io/badge/Inter-000000?style=flat-square&logo=googlefonts&logoColor=white) via `@expo-google-fonts/inter` |
| **Forms/validation** | ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white) |
| **Dates** | ![Day.js](https://img.shields.io/badge/Day.js-FF5F4C?style=flat-square) |
| **Local notifications** | `expo-notifications` |
| **Linting/formatting** | ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white) ![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=flat-square&logo=prettier&logoColor=black) |

Architecture follows a feature-based structure (`src/features/<feature>/{api,components,store,types}`), keeping `app/` (Expo Router) thin — routing and screen composition only, with business logic and data access living in each feature module. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full breakdown.

## Getting Started

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Apply the migrations**: run every file in [`supabase/migrations/`](./supabase/migrations) (`0001` through `0007`, in order) in the Supabase SQL editor. This creates all tables, RLS policies, and the `finish_workout`/`delete_account` functions.
3. **Set up your environment**: copy `.env.example` to `.env` and fill in your project credentials (Settings → API).
4. **Install dependencies**: `npm install`
5. **Seed the exercise database**: the dataset isn't part of this repo (see `.gitignore`) — place the `exercises-dataset-main/` folder (with `data/exercises.json` and its media files) in the project root, then run `npm run db:seed`. This uploads the media to the Supabase Storage bucket `exercise-media` and populates the `exercises` table.
6. **Start the app**: `npm run start`, then `i`/`a` for the iOS/Android simulator, or scan the QR code with Expo Go.

### Scripts

| Command | Purpose |
|---|---|
| `npm run start` | Start the Expo dev server |
| `npm run ios` / `npm run android` / `npm run web` | Start directly on a simulator/emulator/browser |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier across the project |
| `npm run db:seed` | Import the exercise dataset into Supabase |

## Project Documentation

This repo's docs are written in German, matching the app's own UI (German-only for now — the first release targets DE/AT/CH):

- [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) — product vision and guiding principles
- [`MVP.md`](./MVP.md) — original MVP scope
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — folder structure, API conventions, design system
- [`DATABASE.md`](./DATABASE.md) — schema reference
- [`ROADMAP.md`](./ROADMAP.md) — phased feature roadmap
- [`TODO.md`](./TODO.md) / [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) — detailed, session-by-session build log
- [`PRODUCT_AUDIT.md`](./PRODUCT_AUDIT.md) — a full product/UX/architecture/security self-audit with a prioritized backlog
