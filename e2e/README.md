# Browser smoke test

Clicks through the core loop of the app in a phone-sized Chromium window, against a local fake
Supabase. Catches the class of bugs that type checks and unit tests can't: what a user actually
sees after tapping through several screens.

```bash
npm run e2e
```

That builds the web export (`e2e/build-web.ts`), then runs `e2e/smoke.ts`. Screenshots of every
step land in `e2e/output/` (git-ignored). To only re-run the test against an existing build:
`npm run e2e:run`. Phone width defaults to 390 px; `E2E_WIDTH=360 npm run e2e:run` checks a
narrow Android phone.

Needs Playwright with Chromium. It is not a project dependency (it is preinstalled in the cloud
environment this was written in). Locally, once (`--no-save` keeps `package.json` untouched; a
later `npm install` removes it again):

```bash
npm i --no-save playwright@1.63.0
```

```bash
npx playwright install chromium
```

## How it works

- `fake-supabase.ts` — an HTTP server that speaks the subset of PostgREST and GoTrue this app uses.
  Behind it is PGlite (Postgres compiled to WASM) with **all real migrations applied**, so RLS,
  triggers, constraints and the `finish_workout`/`delete_account` RPCs are the real thing. Every
  request runs as the signed-in user (`authenticated` role + JWT `sub`), like PostgREST does.
  One fixed user (`e2e@example.com`), a dozen fixture exercises, no network access, no live project,
  no signups (see the `no-test-signups` rule in `TODO.md`). Like the real API it caps responses at
  1000 rows and rejects URLs over 8 KB (414), so code that assumes "one query returns everything"
  fails here too. `src/shared/lib/history-at-scale.integration.test.ts` uses the same fake directly
  from Vitest (no browser) to run the app's query functions against a long training history.
- `harness.ts` — serves `dist/`, starts the fake, opens Chromium at 390×844 and records console
  errors, page errors and failed requests (any of them fails the run).
- `smoke.ts` — the steps. Each asserts what is on screen and, where it matters, what landed in the
  database.

## Limits

- It is the **web** build (react-native-web). Native-only behaviour (gestures, haptics,
  `expo-notifications`, secure store, hardware back) is not covered; it still needs a device.
- `Alert.alert` is a no-op on react-native-web, so flows behind a confirmation dialog (delete
  routine/workout, sign out, delete account) can't be clicked through here. `delete_account` is
  covered at the SQL level in `supabase/tests/migrations.test.ts`.
- The app has no `/` route; the test starts at `/sign-in`.
