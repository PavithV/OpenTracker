import { supabase } from '@/shared/lib/supabase';

// Supabase's implicit-flow recovery link puts the tokens in the URL *fragment*
// (`opentracker://reset-password#access_token=...&type=recovery`), not the query
// string. `expo-linking`'s own `Linking.parse()` only reads `?`-style query params,
// so the fragment has to be parsed by hand — `react-native-url-polyfill/auto`
// (imported by `shared/lib/supabase.ts`) makes `URLSearchParams` available for it.
function parseFragmentParams(url: string): Record<string, string> {
  const [, afterHash] = url.split('#');
  const [, afterQuestionMark] = url.split('?');
  return Object.fromEntries(new URLSearchParams(afterHash ?? afterQuestionMark ?? ''));
}

/**
 * Handles both password-recovery and magic-link deep links. Returns `true` if the
 * link was a password-recovery link, so the caller can route to the "set new
 * password" screen instead of the ordinary authenticated app — `setSession` below
 * always fires a plain `SIGNED_IN` auth event (unlike the SDK's own URL-detection
 * path), so recovery can only be recognized from the `type` param itself.
 */
export async function handleAuthDeepLink(url: string): Promise<{ isPasswordRecovery: boolean }> {
  const params = parseFragmentParams(url);
  if (!params.access_token || !params.refresh_token) {
    return { isPasswordRecovery: false };
  }

  const { error } = await supabase.auth.setSession({
    access_token: params.access_token,
    refresh_token: params.refresh_token,
  });
  if (error) throw error;

  return { isPasswordRecovery: params.type === 'recovery' };
}
