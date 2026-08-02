import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'; //  LLamando a los temas dia y Noche 
import * as SplashScreen from 'expo-splash-screen'; // Logo que Muestra al Iniciar la app
import { useEffect } from 'react';
import { useColorScheme } from 'react-native'; // se usa el tema que Utliza el telefono Modo Oscuro o Dia
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { DatabaseProvider, useDatabase } from '@/providers/database-provider';
import { syncScheduledNotificationsAsync } from '@/services/notifications';

SplashScreen.preventAutoHideAsync();

function NotificationsBootstrap() {
  const { isReady } = useDatabase();
  const { isLoading, token, user } = useAuth();

  useEffect(() => {
    if (!isReady || isLoading) {
      return;
    }

    void syncScheduledNotificationsAsync().catch((error) => {
      console.warn('No se pudieron sincronizar las notificaciones locales.', error);
    });
  }, [isReady, isLoading, token, user?.id]);

  return null;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();  // Modo Claro o Oscuro?
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <DatabaseProvider>
            <AuthProvider>
              <NotificationsBootstrap />
              <AnimatedSplashOverlay />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </AuthProvider>
          </DatabaseProvider>
        </ThemeProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
