import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { signInWithEmail } from '@/features/auth/api/auth.api';
import { signInSchema } from '@/features/auth/types/auth.schema';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Ungültige Eingabe');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithEmail(result.data.email, result.data.password);
      router.replace('/(tabs)/home');
    } catch (err) {
      Alert.alert('Anmeldung fehlgeschlagen', err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View className="flex-1 justify-center gap-lg">
        <View className="gap-xs">
          <Text className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Willkommen zurück
          </Text>
          <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Melde dich an, um dein Training fortzusetzen.
          </Text>
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
          <Input
            label="Passwort"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
          {error ? <Text className="text-sm text-danger">{error}</Text> : null}
          <Button label="Anmelden" onPress={handleSubmit} loading={isSubmitting} />
        </View>

        <Link href="/(auth)/sign-up" className="text-center text-sm text-primary">
          Noch kein Konto? Jetzt registrieren
        </Link>
      </View>
    </Screen>
  );
}
