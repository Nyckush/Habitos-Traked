import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Link, Redirect, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';

export default function LoginScreen() {
  const { isLoading, token, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && token) {
    return <Redirect href="/home" />;
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Completá email y contraseña.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await signIn({
        email: email.trim(),
        password,
      });
      router.replace('/home');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <ThemedText type="subtitle">Iniciar sesión</ThemedText>
        <ThemedText themeColor="textSecondary">Usá tu cuenta para entrar a la app.</ThemedText>

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          autoCapitalize="none"
          autoComplete="password"
          placeholder="Contraseña"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

        <Pressable
          disabled={submitting}
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            submitting && styles.buttonDisabled,
          ]}>
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.buttonText}>Entrar</ThemedText>
          )}
        </Pressable>

        <Link href="/auth/register" replace style={styles.link}>
          <ThemedText type="linkPrimary">Crear cuenta</ThemedText>
        </Link>
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
  card: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
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
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 700,
  },
  errorText: {
    color: '#DC2626',
  },
  link: {
    alignSelf: 'flex-start',
  },
});
