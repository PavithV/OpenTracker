import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { signUpWithEmail } from '@/features/auth/api/auth.api';
import { signUpSchema } from '@/features/auth/types/auth.schema';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';
import { Typography } from '@/shared/components/Typography';

export default function SignUpScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const result = signUpSchema.safeParse({ displayName, email, password });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Ungültige Eingabe');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const { needsEmailConfirmation } = await signUpWithEmail(
        result.data.email,
        result.data.password,
        result.data.displayName,
      );
      if (needsEmailConfirmation) {
        Alert.alert(
          'Fast geschafft',
          'Wir haben dir eine Bestätigungs-E-Mail geschickt. Bitte bestätige deine Adresse und melde dich danach an.',
        );
        router.replace('/(auth)/sign-in');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (err) {
      Alert.alert('Registrierung fehlgeschlagen', err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View className="flex-1 justify-center gap-lg">
        <View className="gap-xs">
          <Typography variant="title">Konto erstellen</Typography>
          <Typography variant="subtitle">Starte dein Training in wenigen Sekunden.</Typography>
        </View>

        <View className="gap-md">
          <Input label="Name" value={displayName} onChangeText={setDisplayName} autoComplete="name" />
          <Input
            label="E-Mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Input
            label="Passwort"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
          />
          {error ? (
            <Typography variant="subtitle" color="danger">
              {error}
            </Typography>
          ) : null}
          <Button label="Registrieren" onPress={handleSubmit} loading={isSubmitting} />
        </View>

        <Link href="/(auth)/sign-in" className="text-center text-sm text-primary-light dark:text-primary-dark">
          Bereits ein Konto? Jetzt anmelden
        </Link>
      </View>
    </Screen>
  );
}
