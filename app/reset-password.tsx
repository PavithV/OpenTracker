import { useState } from 'react';
import { Alert, View } from 'react-native';

import { updatePassword } from '@/features/auth/api/auth.api';
import { updatePasswordSchema } from '@/features/auth/types/auth.schema';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';
import { useSessionStore } from '@/store/session.store';

export default function ResetPasswordScreen() {
  const setPasswordRecovery = useSessionStore((state) => state.setPasswordRecovery);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const result = updatePasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Ungültige Eingabe');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await updatePassword(result.data.password);
      // Recovery session is now a normal one — leaving this screen routes
      // straight into the authenticated app via the ordinary session guard.
      setPasswordRecovery(false);
    } catch (err) {
      Alert.alert('Fehler', err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View className="flex-1 justify-center gap-lg">
        <View className="gap-xs">
          <Typography variant="title">Neues Passwort</Typography>
          <Typography variant="subtitle">Wähle ein neues Passwort für dein Konto.</Typography>
        </View>

        <View className="gap-md">
          <Input
            label="Neues Passwort"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
          />
          <Input
            label="Passwort bestätigen"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="password-new"
          />
          {error ? (
            <Typography variant="subtitle" color="danger">
              {error}
            </Typography>
          ) : null}
          <Button label="Passwort speichern" onPress={handleSubmit} loading={isSubmitting} />
        </View>
      </View>
    </Screen>
  );
}
