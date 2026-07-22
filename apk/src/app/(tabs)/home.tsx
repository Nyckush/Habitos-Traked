import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';
import { useDatabase } from '@/providers/database-provider';

export default function HomeScreen() {
  const { isLoading, token, user, signOut } = useAuth();
  const { isReady, error, refreshStatus, status } = useDatabase();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void refreshStatus();
  }, [isReady, refreshStatus, user?.id]);

  if (!isLoading && !token) {
    return <Redirect href="/auth/login" />;
  }

  async function handleLogout() {
    await signOut();
    router.replace('/auth/login');
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="subtitle">Inicio</ThemedText>
        <ThemedText>Sesion iniciada correctamente.</ThemedText>
        <ThemedText themeColor="textSecondary">
          {user?.nombre ? `Usuario: ${user.nombre}` : 'Sin datos de usuario.'}
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          {user?.email ? `Email: ${user.email}` : ''}
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          {isReady ? 'Base local: lista' : 'Base local: iniciando...'}
        </ThemedText>
        {status ? (
          <ThemedText themeColor="textSecondary">
            {`DB ${status.name} v${status.version} | usuarios ${status.usersCount} | habitos ${status.habitsCount} | cola ${status.queueCount}`}
          </ThemedText>
        ) : null}
        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <ThemedText style={styles.buttonText}>Cerrar sesion</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    gap: 16,
  },
  button: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
  },
});
