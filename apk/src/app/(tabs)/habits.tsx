import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createHabit, listHabits, type Habit } from '@/database';
import { useAuth } from '@/providers/auth-provider';
import { useDatabase } from '@/providers/database-provider';

export default function HabitsScreen() {
  const { isLoading, token, user } = useAuth();
  const { isReady, refreshStatus } = useDatabase();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [frecuencia, setFrecuencia] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void loadHabits();
  }, [isReady]);

  async function loadHabits() {
    const data = await listHabits();
    setHabits(data);
  }

  async function handleCreateHabit() {
    if (!titulo.trim()) {
      setError('Escribi un titulo para el habito.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await createHabit({
        userRemoteId: user?.id ?? null,
        titulo,
        descripcion,
        frecuencia,
      });

      setTitulo('');
      setDescripcion('');
      setFrecuencia('');
      await loadHabits();
      await refreshStatus();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo guardar el habito.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isLoading && !token) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ThemedText type="subtitle">Habitos</ThemedText>
          <ThemedText>Registra tus habitos en la base local.</ThemedText>

          <TextInput
            placeholder="Titulo del habito"
            style={styles.input}
            value={titulo}
            onChangeText={setTitulo}
          />
          <TextInput
            placeholder="Descripcion"
            style={styles.input}
            value={descripcion}
            onChangeText={setDescripcion}
          />
          <TextInput
            placeholder="Frecuencia"
            style={styles.input}
            value={frecuencia}
            onChangeText={setFrecuencia}
          />

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <Pressable
            disabled={submitting}
            onPress={handleCreateHabit}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}>
            <ThemedText style={styles.buttonText}>
              {submitting ? 'Guardando...' : 'Guardar habito'}
            </ThemedText>
          </Pressable>

          <View style={styles.listSection}>
            <ThemedText type="default">Habitos guardados</ThemedText>
            {habits.length === 0 ? (
              <ThemedText themeColor="textSecondary">Todavia no hay habitos cargados.</ThemedText>
            ) : (
              habits.map((habit) => (
                <View key={habit.local_id} style={styles.habitCard}>
                  <ThemedText>{habit.titulo}</ThemedText>
                  {habit.descripcion ? (
                    <ThemedText themeColor="textSecondary">{habit.descripcion}</ThemedText>
                  ) : null}
                  {habit.frecuencia ? (
                    <ThemedText themeColor="textSecondary">{`Frecuencia: ${habit.frecuencia}`}</ThemedText>
                  ) : null}
                  <ThemedText themeColor="textSecondary">{`Estado: ${habit.estado}`}</ThemedText>
                </View>
              ))
            )}
          </View>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  content: {
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
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
  },
  listSection: {
    gap: 12,
    paddingTop: 8,
  },
  habitCard: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    padding: 12,
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
});
