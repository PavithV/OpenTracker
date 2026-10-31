// Browser smoke test of the core loop against the web export + fake Supabase (real migrations,
// real RLS, real finish_workout). See e2e/README.md. Run: npm run e2e
//
// Every step asserts what the user would see and, where it matters, what actually landed in the
// database. Screenshots of every step go to e2e/output/ for a visual check.
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

import type { Page } from 'playwright';

import { E2E_EMAIL, E2E_PASSWORD } from './fake-supabase';
import { startEnvironment } from './harness';

const OUTPUT = path.resolve(__dirname, 'output');

class StepFailure extends Error {}

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new StepFailure(message);
}

async function visibleText(page: Page): Promise<string> {
  return page.evaluate(() => document.body.innerText);
}

async function expectVisible(page: Page, text: string) {
  await page.getByText(text, { exact: true }).last().waitFor({ state: 'visible', timeout: 10_000 });
}

async function main() {
  rmSync(OUTPUT, { recursive: true, force: true });
  mkdirSync(OUTPUT, { recursive: true });

  const env = await startEnvironment();
  const { page, supabase } = env;
  const results: { step: string; ok: boolean; error?: string }[] = [];
  let shot = 0;

  async function step(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      results.push({ step: name, ok: true });
    } catch (error) {
      results.push({ step: name, ok: false, error: (error as Error).message.split('\n')[0] });
    } finally {
      await page.waitForTimeout(600);
      shot += 1;
      await page.screenshot({ path: path.join(OUTPUT, `${String(shot).padStart(2, '0')}-${name.replace(/\W+/g, '-')}.png`) });
    }
  }
  const tap = (text: string) => page.getByText(text, { exact: true }).last().click();
  const tab = (name: 'Home' | 'Training' | 'Profil') => page.getByText(name, { exact: true }).last().click();

  await step('sign in', async () => {
    await page.goto(`${env.webUrl}/sign-in`);
    await page.locator('input').nth(0).fill(E2E_EMAIL, { timeout: 15_000 });
    await page.locator('input').nth(1).fill(E2E_PASSWORD);
    await tap('Anmelden');
    await expectVisible(page, 'Noch keine Workouts');
  });

  await step('create routine with decimal weights', async () => {
    await tab('Training');
    await tap('Routine erstellen');
    await page.getByPlaceholder('z. B. Push Day').fill('Push Day');
    await tap('Übungen hinzufügen');
    await tap('Bench Press');
    await tap('Overhead Press');
    await tap('2 Übungen hinzufügen');
    const fields = page.getByPlaceholder('-');
    await fields.nth(0).pressSequentially('62.5', { delay: 30 });
    await fields.nth(1).pressSequentially('8', { delay: 30 });
    await fields.nth(2).pressSequentially('40,5', { delay: 30 }); // German decimal comma
    await fields.nth(3).pressSequentially('10', { delay: 30 });
    check((await fields.nth(0).inputValue()) === '62.5', `weight field shows ${await fields.nth(0).inputValue()}`);
    // 90 s rest after Bench Press sets
    await page.getByText('Pause (Sek.)', { exact: true }).first().locator('xpath=following::input[1]').pressSequentially('90');
    await tap('Speichern');
    await expectVisible(page, 'Bench Press, Overhead Press');
    const stored = await supabase.db.query<{ target_weight: number; target_reps: number }>(
      'select target_weight, target_reps from public.routine_exercise_sets order by target_weight desc',
    );
    check(
      JSON.stringify(stored.rows) === JSON.stringify([{ target_weight: 62.5, target_reps: 8 }, { target_weight: 40.5, target_reps: 10 }]),
      `stored targets: ${JSON.stringify(stored.rows)}`,
    );
  });

  await step('edit routine and reopen shows the saved version', async () => {
    await tap('Push Day');
    await expectVisible(page, 'Routine bearbeiten');
    await page.getByPlaceholder('z. B. Push Day').fill('Push Day A');
    await tap('Speichern');
    await expectVisible(page, 'Push Day A');
    await tap('Push Day A');
    await expectVisible(page, 'Routine bearbeiten');
    const name = await page.getByPlaceholder('z. B. Push Day').inputValue();
    const stored = await supabase.db.query<{ name: string }>('select name from public.routines');
    check(name === 'Push Day A', `editor reopened with stale name "${name}" (db: ${JSON.stringify(stored.rows)})`);
    await page.goBack();
    await expectVisible(page, 'Leeres Workout starten');
  });

  await step('start routine, log sets, finish', async () => {
    await tap('Start');
    await expectVisible(page, 'Beenden');
    const weights = page.getByPlaceholder('kg');
    check((await weights.nth(0).inputValue()) === '62.5', `prefilled weight ${await weights.nth(0).inputValue()}`);
    await page.getByPlaceholder('Wdh').nth(0).pressSequentially('8', { delay: 30 });
    await page.getByPlaceholder('Wdh').nth(1).pressSequentially('10', { delay: 30 });
    await page.getByLabel('Satz als erledigt markieren').nth(0).click();
    await expectVisible(page, 'Pause'); // rest timer from the routine's 90 s
    const restText = await visibleText(page);
    check(/Pause\n01:(2\d|30)/.test(restText), 'rest countdown not ticking from 01:30');
    await tap('Überspringen');
    await page.getByLabel('Satz als erledigt markieren').nth(1).click();
    await expectVisible(page, '905 kg'); // 62.5*8 + 40.5*10
    await tap('Beenden');
    await page.waitForURL(/\/home$/);
    // Must show up right away (used to need a reload: no query was invalidated after finishing).
    await expectVisible(page, 'Push Day A');
    const workout = await supabase.db.query<{ total_volume: number; name: string }>('select total_volume, name from public.workouts');
    check(workout.rows[0]?.total_volume === 905, `stored volume ${JSON.stringify(workout.rows)}`);
  });

  await step('workout detail', async () => {
    await page.getByText('Push Day A', { exact: true }).last().click();
    await expectVisible(page, '62.5 kg × 8');
    await expectVisible(page, '40.5 kg × 10');
    await page.goBack();
  });

  await step('calendar shows the workout day', async () => {
    await tab('Home');
    await page.getByLabel('Kalender öffnen').last().click();
    await expectVisible(page, 'Kalender');
    check((await page.getByLabel(/Workout vorhanden$/).count()) === 1, 'expected exactly one day marked with a workout');
    await page.goBack();
  });

  await step('profile stats and records', async () => {
    await tab('Profil');
    await expectVisible(page, '905 kg');
    const text = await visibleText(page);
    check(!text.includes('e2e@example.com\ne2e@example.com'), 'email shown twice in profile header');
    await tap('Rekorde ansehen');
    await expectVisible(page, 'Bench Press');
    await expectVisible(page, 'Bestes Gewicht: 62.5 kg · Geschätztes 1RM: 79.17 kg');
    await page.goBack();
  });

  await step('exercise detail shows history', async () => {
    await tab('Training');
    await tap('Leeres Workout starten');
    await tap('Übung hinzufügen');
    await page.getByLabel('Details zu Bench Press anzeigen').click();
    await expectVisible(page, 'Bench Press');
    await page.goBack();
  });

  await step('create custom exercise and use it', async () => {
    await tap('+ Eigene Übung erstellen');
    await page.getByPlaceholder('z. B. Kabelzug einarmig').fill('Cable Fly One Arm');
    await tap('Chest');
    await tap('Cable');
    await page.getByPlaceholder('z. B. biceps').fill('pectorals');
    await tap('Übung erstellen');
    await expectVisible(page, 'Cable Fly One Arm');
    await tap('Cable Fly One Arm');
    await tap('1 Übung hinzufügen');
    await expectVisible(page, 'Cable Fly One Arm');
    await tap('Satz hinzufügen');
    await page.getByPlaceholder('kg').nth(0).pressSequentially('12,5', { delay: 30 });
    await page.getByPlaceholder('Wdh').nth(0).pressSequentially('12', { delay: 30 });
    await page.getByLabel('Satz als erledigt markieren').nth(0).click();
    await tap('Beenden');
    await page.waitForURL(/\/home$/);
    await expectVisible(page, '150 kg');
  });

  await step('plate calculator accepts a decimal comma', async () => {
    await page.goto(`${env.webUrl}/plate-calculator`);
    await page.getByPlaceholder('z. B. 100').fill('102,5');
    await expectVisible(page, 'Plattenrechner');
    const text = await visibleText(page);
    check(text.includes('102.5 kg'), `plate calculator did not compute 102,5: ${text.slice(0, 300)}`);
  });

  await step('switch to lb', async () => {
    await page.goto(`${env.webUrl}/profile`);
    await tap('lb');
    await tab('Home');
    await expectVisible(page, '1995.2 lb'); // 905 kg
  });

  await step('second run shows last time and survives a reload', async () => {
    await tab('Training');
    await tap('Start');
    await expectVisible(page, 'Beenden');
    // unit is lb by now: 62.5 kg = 137.8 lb
    await expectVisible(page, 'Letztes Mal: 137.8 lb × 8');
    await page.getByPlaceholder('Wdh').nth(0).pressSequentially('9', { delay: 30 });
    await page.getByLabel('Satz als erledigt markieren').nth(0).click();
    await page.reload(); // stands in for the app being killed mid-workout
    await expectVisible(page, 'Beenden');
    check((await page.getByPlaceholder('Wdh').nth(0).inputValue()) === '9', 'reps lost after reload');
    // react-native-web doesn't render accessibilityState as aria-checked; the completed styling is
    // the observable signal here.
    check(
      ((await page.getByLabel('Satz als erledigt markieren').nth(0).getAttribute('class')) ?? '').includes('bg-primary-light/15'),
      'completed state lost after reload',
    );
    await tap('Beenden');
    await page.waitForURL(/\/home$/);
    const count = await supabase.db.query<{ n: number }>('select count(*)::int as n from public.workouts where ended_at is not null');
    check(count.rows[0].n === 3, `expected 3 finished workouts, got ${count.rows[0].n}`);
  });

  results.push({ step: 'no console/page errors', ok: env.problems.length === 0, error: env.problems.join(' | ') });

  await env.close();

  for (const result of results) {
    console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.step}${result.ok ? '' : `\n      ${result.error}`}`);
  }
  console.log(`\nScreenshots: ${OUTPUT}`);
  const failed = results.filter((result) => !result.ok).length;
  if (failed) {
    console.log(`\n${failed} of ${results.length} steps failed. Fake Supabase request log (non-200):`);
    console.log(supabase.requestLog.filter((line) => !line.includes('-> 200') && !line.includes('-> 204')).join('\n'));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
