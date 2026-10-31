// Builds the web export pointed at the fake Supabase (cross-platform replacement for an inline
// `EXPO_PUBLIC_SUPABASE_URL=... npx expo export` -- that syntax doesn't work in Windows shells).
// --clear is required: Metro caches inlined EXPO_PUBLIC_* values, so a bundle built earlier
// against the real project would otherwise keep talking to it.
import { spawnSync } from 'node:child_process';

const result = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--clear'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    EXPO_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'fake-anon-key',
    CI: '1',
  },
});
process.exit(result.status ?? 1);
