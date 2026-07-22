import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'; //  LLamando a los temas dia y Noche 
import * as SplashScreen from 'expo-splash-screen'; // Logo que Muestra al Iniciar la app
import { useColorScheme } from 'react-native'; // se usa el tema que Utliza el telefono Modo Oscuro o Dia

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/providers/auth-provider';
import { DatabaseProvider } from '@/providers/database-provider';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();  // Modo Claro o Oscuro?
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DatabaseProvider>
        <AuthProvider>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="auth/register" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AuthProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}
