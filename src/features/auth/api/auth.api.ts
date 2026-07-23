import { supabase } from '@/shared/lib/supabase';

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/**
 * Returns whether a session was created immediately. If the Supabase project has
 * "Confirm email" enabled (the default), signUp succeeds but `data.session` is null
 * until the user clicks the confirmation link — the caller must not assume a
 * successful signUp means the user is logged in.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<{ needsEmailConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
  return { needsEmailConfirmation: data.session === null };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
