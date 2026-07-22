import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister() {
    if (!nombre.trim() || !email.trim() || !password.trim() || !passwordConfirmation.trim()) {
      setError('Completá todos los campos.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await signUp({
        nombre: nombre.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      router.replace('/home');
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'No se pudo crear la cuenta.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <ThemedText type="subtitle">Crear cuenta</ThemedText>
        <ThemedText themeColor="textSecondary">Registrate para usar la app.</ThemedText>

        <TextInput
          autoCapitalize="words"
          placeholder="Nombre"
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
        />

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
          autoComplete="new-password"
          placeholder="Contraseña"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          autoCapitalize="none"
          autoComplete="new-password"
          placeholder="Confirmar contraseña"
          secureTextEntry
          style={styles.input}
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
        />

        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

        <Pressable
          disabled={submitting}
          onPress={handleRegister}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            submitting && styles.buttonDisabled,
          ]}>
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.buttonText}>Registrarme</ThemedText>
          )}
        </Pressable>

        <Link href="/auth/login" replace style={styles.link}>
          <ThemedText type="linkPrimary">Ya tengo cuenta</ThemedText>
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
