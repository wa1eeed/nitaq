import { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/lib/auth';

// Force RTL for Arabic
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading, boot } = useAuthStore();

  useEffect(() => { boot(); }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';

    if (!user) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    // Route by role
    const role = user.role;
    if (role === 'DRIVER' || role === 'CARRIER_USER') {
      if (segments[0] !== '(driver)') router.replace('/(driver)/');
    } else if (role === 'CARRIER_ADMIN') {
      if (segments[0] !== '(carrier)') router.replace('/(carrier)/');
    } else {
      // Unknown role — back to login
      if (!inAuth) router.replace('/(auth)/login');
    }
  }, [user, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <AuthGate />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
