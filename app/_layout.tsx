import '@/shared/theme/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/shared/lib/query-client';
import { supabase } from '@/shared/lib/supabase';
import { useSessionStore } from '@/store/session.store';

export default function RootLayout() {
  const session = useSessionStore((state) => state.session);
  const isInitializing = useSessionStore((state) => state.isInitializing);
  const setSession = useSessionStore((state) => state.setSession);
  const finishInitializing = useSessionStore((state) => state.finishInitializing);

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

  if (isInitializing) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!session}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>

            <Stack.Protected guard={!!session}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="workout/active" options={{ presentation: 'modal' }} />
              <Stack.Screen name="workout/[id]" />
              <Stack.Screen name="routine/create" options={{ presentation: 'modal' }} />
              <Stack.Screen name="routine/[id]/edit" />
              <Stack.Screen name="exercise/picker" options={{ presentation: 'modal' }} />
              <Stack.Screen name="exercise/[id]" />
              <Stack.Screen name="records" />
            </Stack.Protected>
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
