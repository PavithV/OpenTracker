// Shared plumbing for the browser smoke test: serves the web export from dist/ (SPA fallback to
// index.html), starts the fake Supabase, and opens a phone-sized Chromium page that records
// console errors, page errors and failed API calls.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

import { startFakeSupabase } from './fake-supabase';

const DIST = path.resolve(__dirname, '../dist');
const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
};

export function serveDist(port = 8081) {
  if (!existsSync(path.join(DIST, 'index.html'))) {
    throw new Error('dist/ missing -- run the web export first (see e2e/README.md)');
  }
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    let file = path.join(DIST, urlPath);
    if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory())
      file = path.join(DIST, 'index.html');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise<{ url: string; close: () => Promise<void> }>((resolve) =>
    server.listen(port, () =>
      resolve({
        url: `http://localhost:${port}`,
        close: () => new Promise((done) => server.close(() => done())),
      }),
    ),
  );
}

export async function startEnvironment() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require('playwright') as typeof import('playwright');
  const supabase = await startFakeSupabase();
  const web = await serveDist();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: Number(process.env.E2E_WIDTH ?? 390), height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console.error: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) =>
    problems.push(
      `requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText}`,
    ),
  );
  page.on('dialog', (dialog) => dialog.accept());

  return {
    page,
    supabase,
    webUrl: web.url,
    problems,
    close: async () => {
      await browser.close();
      await web.close();
      await supabase.close();
    },
  };
}
