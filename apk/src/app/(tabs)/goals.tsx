import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  createMeta,
  createObjetivo,
  listHabits,
  listMetasWithEstado,
  listObjetivosWithProgress,
  type Habit,
  type MetaWithEstado,
  type ObjetivoWithProgress,
} from '@/database';
import { useAuth } from '@/providers/auth-provider';
import { useDatabase } from '@/providers/database-provider';

export default function GoalsScreen() {
  const { user } = useAuth();
  const { isReady, refreshStatus } = useDatabase();
  const [metaNombre, setMetaNombre] = useState('');
  const [metaFechaInicio, setMetaFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [objetivoNombre, setObjetivoNombre] = useState('');
  const [metaEsperada, setMetaEsperada] = useState('1');
  const [fechaLimite, setFechaLimite] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMetaLocalId, setSelectedMetaLocalId] = useState<string | null>(null);
  const [selectedHabitLocalId, setSelectedHabitLocalId] = useState<string | null>(null);
  const [metas, setMetas] = useState<MetaWithEstado[]>([]);
  const [objetivos, setObjetivos] = useState<ObjetivoWithProgress[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingObjetivo, setSavingObjetivo] = useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void loadData();
  }, [isReady]);

  async function loadData() {
    const [metasData, objetivosData, habitsData] = await Promise.all([
      listMetasWithEstado(),
      listObjetivosWithProgress(),
      listHabits(),
    ]);

    setMetas(metasData);
    setObjetivos(objetivosData);
    setHabits(habitsData);
    setSelectedMetaLocalId((current) => current ?? metasData[0]?.local_id ?? null);
    setSelectedHabitLocalId((current) => current ?? habitsData[0]?.local_id ?? null);
  }

  async function handleCreateMeta() {
    try {
      setSavingMeta(true);
      setError(null);

      await createMeta({
        userRemoteId: user?.id ?? null,
        nombre: metaNombre,
        fechaInicio: metaFechaInicio,
      });

      setMetaNombre('');
      setMetaFechaInicio(new Date().toISOString().slice(0, 10));
      await loadData();
      await refreshStatus();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo guardar la meta.');
    } finally {
      setSavingMeta(false);
    }
  }

  async function handleCreateObjetivo() {
    if (!selectedHabitLocalId) {
      setError('Primero crea o selecciona un habito para el objetivo.');
      return;
    }

    try {
      setSavingObjetivo(true);
      setError(null);

      await createObjetivo({
        userRemoteId: user?.id ?? null,
        metaLocalId: selectedMetaLocalId,
        habitoLocalId: selectedHabitLocalId,
        nombre: objetivoNombre,
        metaEsperada: Number.parseInt(metaEsperada, 10),
        fechaLimite,
      });

      setObjetivoNombre('');
      setMetaEsperada('1');
      setFechaLimite(new Date().toISOString().slice(0, 10));
      await loadData();
      await refreshStatus();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo guardar el objetivo.');
    } finally {
      setSavingObjetivo(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ThemedText type="subtitle">Metas y Objetivos</ThemedText>
          <ThemedText>Gestiona metas y objetivos con la misma estructura base del backend.</ThemedText>

          <View style={styles.card}>
            <ThemedText type="default">Nueva meta</ThemedText>
            <TextInput placeholder="Nombre de la meta" style={styles.input} value={metaNombre} onChangeText={setMetaNombre} />
            <TextInput placeholder="Fecha inicio YYYY-MM-DD" style={styles.input} value={metaFechaInicio} onChangeText={setMetaFechaInicio} />
            <Pressable
              disabled={savingMeta}
              onPress={handleCreateMeta}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, savingMeta && styles.buttonDisabled]}>
              <ThemedText style={styles.buttonText}>{savingMeta ? 'Guardando...' : 'Guardar meta'}</ThemedText>
            </Pressable>
          </View>

          <View style={styles.card}>
            <ThemedText type="default">Nuevo objetivo</ThemedText>
            <TextInput placeholder="Nombre del objetivo" style={styles.input} value={objetivoNombre} onChangeText={setObjetivoNombre} />
            <TextInput placeholder="Meta esperada" style={styles.input} value={metaEsperada} onChangeText={setMetaEsperada} keyboardType="number-pad" />
            <TextInput placeholder="Fecha limite YYYY-MM-DD" style={styles.input} value={fechaLimite} onChangeText={setFechaLimite} />
            <ThemedText themeColor="textSecondary">Meta asociada</ThemedText>
            {metas.length === 0 ? (
              <ThemedText themeColor="textSecondary">Todavia no hay metas cargadas.</ThemedText>
            ) : (
              metas.map((meta) => (
                <Pressable
                  key={meta.local_id}
                  onPress={() => setSelectedMetaLocalId(meta.local_id)}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    selectedMetaLocalId === meta.local_id && styles.selectedButton,
                    pressed && styles.buttonPressed,
                  ]}>
                  <ThemedText>{meta.nombre}</ThemedText>
                </Pressable>
              ))
            )}
            <ThemedText themeColor="textSecondary">Habito asociado</ThemedText>
            {habits.length === 0 ? (
              <ThemedText themeColor="textSecondary">Todavia no hay habitos cargados.</ThemedText>
            ) : (
              habits.map((habit) => (
                <Pressable
                  key={habit.local_id}
                  onPress={() => setSelectedHabitLocalId(habit.local_id)}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    selectedHabitLocalId === habit.local_id && styles.selectedButton,
                    pressed && styles.buttonPressed,
                  ]}>
                  <ThemedText>{habit.nombre}</ThemedText>
                </Pressable>
              ))
            )}
            <Pressable
              disabled={savingObjetivo}
              onPress={handleCreateObjetivo}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, savingObjetivo && styles.buttonDisabled]}>
              <ThemedText style={styles.buttonText}>{savingObjetivo ? 'Guardando...' : 'Guardar objetivo'}</ThemedText>
            </Pressable>
          </View>

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <View style={styles.card}>
            <ThemedText type="default">Metas guardadas</ThemedText>
            {metas.length === 0 ? (
              <ThemedText themeColor="textSecondary">Todavia no hay metas cargadas.</ThemedText>
            ) : (
              metas.map((meta) => (
                <View key={meta.local_id} style={styles.itemCard}>
                  <ThemedText>{meta.nombre}</ThemedText>
                  <ThemedText themeColor="textSecondary">{`Inicio: ${meta.fecha_inicio ?? 'Sin fecha'}`}</ThemedText>
                  <ThemedText themeColor="textSecondary">{`Estado: ${meta.estado}`}</ThemedText>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <ThemedText type="default">Objetivos guardados</ThemedText>
            {objetivos.length === 0 ? (
              <ThemedText themeColor="textSecondary">Todavia no hay objetivos cargados.</ThemedText>
            ) : (
              objetivos.map((objetivo) => {
                const meta = metas.find((item) => item.local_id === objetivo.meta_local_id);
                const habit = habits.find((item) => item.local_id === objetivo.habito_local_id);

                return (
                  <View key={objetivo.local_id} style={styles.itemCard}>
                    <ThemedText>{objetivo.nombre}</ThemedText>
                    <ThemedText themeColor="textSecondary">{`Meta: ${meta?.nombre ?? 'Sin meta'}`}</ThemedText>
                    <ThemedText themeColor="textSecondary">{`Habito: ${habit?.nombre ?? 'Sin habito'}`}</ThemedText>
                    <ThemedText themeColor="textSecondary">{`Esperada: ${objetivo.meta_esperada}`}</ThemedText>
                    <ThemedText themeColor="textSecondary">{`Actual: ${objetivo.meta_actual}`}</ThemedText>
                    <ThemedText themeColor="textSecondary">{`Tasa de exito: ${objetivo.tasa_exito}%`}</ThemedText>
                    <ThemedText themeColor="textSecondary">{`Estado: ${objetivo.estado}`}</ThemedText>
                    <ThemedText themeColor="textSecondary">{`Fecha limite: ${objetivo.fecha_limite}`}</ThemedText>
                  </View>
                );
              })
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
  card: {
    gap: 12,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  itemCard: {
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
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
  secondaryButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedButton: {
    borderColor: '#111827',
    backgroundColor: '#E5E7EB',
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
});
