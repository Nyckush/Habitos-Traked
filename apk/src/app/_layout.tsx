import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router'; //  LLamando a los temas dia y Noche 
import * as SplashScreen from 'expo-splash-screen'; // Logo que Muestra al Iniciar la app
import { useColorScheme } from 'react-native'; // se usa el tema que Utliza el telefono Modo Oscuro o Dia

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();  // Modo Claro o Oscuro?
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
