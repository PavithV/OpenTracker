import '@/shared/theme/global.css';

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { handleAuthDeepLink } from '@/features/auth/utils/deep-link';
import { Toast } from '@/shared/components/Toast';
import { queryClient } from '@/shared/lib/query-client';
import { supabase } from '@/shared/lib/supabase';
import { useSessionStore } from '@/store/session.store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const session = useSessionStore((state) => state.session);
  const isInitializing = useSessionStore((state) => state.isInitializing);
  const isPasswordRecovery = useSessionStore((state) => state.isPasswordRecovery);
  const setSession = useSessionStore((state) => state.setSession);
  const finishInitializing = useSessionStore((state) => state.finishInitializing);
  const setPasswordRecovery = useSessionStore((state) => state.setPasswordRecovery);

  const deepLinkUrl = Linking.useLinkingURL();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      finishInitializing();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, [setSession, finishInitializing]);

  useEffect(() => {
    if (!deepLinkUrl) return;
    handleAuthDeepLink(deepLinkUrl)
      .then(({ isPasswordRecovery: isRecovery }) => {
        if (isRecovery) setPasswordRecovery(true);
      })
      .catch(() => {
        // Ignoring: deep links unrelated to auth (or already-consumed/expired
        // recovery tokens) simply shouldn't establish a session — the user stays
        // on whichever screen the plain session-gate below already routes to.
      });
  }, [deepLinkUrl, setPasswordRecovery]);

  const isReady = !isInitializing && fontsLoaded;

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!session && !isPasswordRecovery}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>

            <Stack.Protected guard={isPasswordRecovery}>
              <Stack.Screen name="reset-password" />
            </Stack.Protected>

            <Stack.Protected guard={!!session && !isPasswordRecovery}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="workout/active" options={{ presentation: 'modal' }} />
              <Stack.Screen name="workout/[id]" />
              <Stack.Screen name="routine/create" options={{ presentation: 'modal' }} />
              <Stack.Screen name="routine/[id]/edit" />
              <Stack.Screen name="exercise/picker" options={{ presentation: 'modal' }} />
              <Stack.Screen name="exercise/create" options={{ presentation: 'modal' }} />
              <Stack.Screen name="exercise/[id]" />
              <Stack.Screen name="records" />
              <Stack.Screen name="calendar" />
              <Stack.Screen name="plate-calculator" options={{ presentation: 'modal' }} />
              <Stack.Screen name="reminders" />
            </Stack.Protected>
          </Stack>

          <Toast />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
