import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { requestPasswordReset } from '@/features/auth/api/auth.api';
import { requestPasswordResetSchema } from '@/features/auth/types/auth.schema';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const result = requestPasswordResetSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Ungültige Eingabe');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await requestPasswordReset(result.data.email, Linking.createURL('reset-password'));
      // Same message regardless of whether the address has an account —
      // otherwise this screen could be used to check which emails are registered.
      Alert.alert(
        'E-Mail unterwegs',
        'Falls ein Konto mit dieser Adresse existiert, haben wir dir einen Link zum Zurücksetzen deines Passworts geschickt.',
      );
      router.replace('/(auth)/sign-in');
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
          <Typography variant="title">Passwort vergessen</Typography>
          <Typography variant="subtitle">
            Gib deine E-Mail-Adresse ein — wir schicken dir einen Link zum Zurücksetzen.
          </Typography>
        </View>

        <View className="gap-md">
          <Input
            label="E-Mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          {error ? (
            <Typography variant="subtitle" color="danger">
              {error}
            </Typography>
          ) : null}
          <Button label="Link senden" onPress={handleSubmit} loading={isSubmitting} />
        </View>
      </View>
    </Screen>
  );
}
