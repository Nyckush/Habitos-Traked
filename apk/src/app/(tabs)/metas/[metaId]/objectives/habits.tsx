import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMetaById, listHabits, type Habit } from '@/database';

function resolveParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function parseHabitIds(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ObjectiveCreateHabitsScreen() {
  const { metaId, objectiveId, objectiveName, selectedHabitIds, metaEsperada, fechaLimite } = useLocalSearchParams<{
    metaId?: string | string[];
    objectiveId?: string | string[];
    objectiveName?: string | string[];
    selectedHabitIds?: string | string[];
    metaEsperada?: string | string[];
    fechaLimite?: string | string[];
  }>();
  const [metaNombre, setMetaNombre] = useState('');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(parseHabitIds(resolveParam(selectedHabitIds)));
  const [error, setError] = useState<string | null>(null);

  const metaLocalId = resolveParam(metaId);
  const objectiveLocalId = resolveParam(objectiveId);
  const name = resolveParam(objectiveName);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const [meta, habitsData] = await Promise.all([getMetaById(metaLocalId), listHabits()]);
        setMetaNombre(meta?.nombre ?? '');
        setHabits(habitsData);
      })();
    }, [metaLocalId]),
  );

  const selectedCountText = useMemo(() => {
    if (selectedIds.length === 0) {
      return 'Selecciona uno o varios habitos';
    }

    if (selectedIds.length === 1) {
      return '1 habito seleccionado';
    }

    return `${selectedIds.length} habitos seleccionados`;
  }, [selectedIds.length]);

  function toggleHabit(localId: string) {
    setSelectedIds((current) =>
      current.includes(localId)
        ? current.filter((item) => item !== localId)
        : [...current, localId],
    );
  }

  function handleContinue() {
    if (!name.trim()) {
      setError('Primero define el nombre del objetivo.');
      return;
    }

    if (selectedIds.length === 0) {
      setError('Selecciona al menos un habito.');
      return;
    }

    setError(null);
    router.push({
      pathname: '/metas/[metaId]/objectives/details',
      params: {
        metaId: metaLocalId,
        objectiveId: objectiveLocalId,
        objectiveName: name,
        selectedHabitIds: selectedIds.join(','),
        metaEsperada: resolveParam(metaEsperada),
        fechaLimite: resolveParam(fechaLimite),
      },
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
              <ThemedText style={styles.backButtonText}>{'<'}</ThemedText>
            </Pressable>

            <View style={styles.headerTitleBlock}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerTitleIcon}>
                  <MaterialDesignIcons name="shape-outline" size={16} color="#FFFFFF" />
                </View>

                <ThemedText style={styles.headerTitle}>{objectiveLocalId ? 'Editar Habitos' : 'Selecciona Habitos'}</ThemedText>
              </View>

              <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
                {metaNombre ? `Meta: ${metaNombre}` : 'Paso 2 de 3'}
              </ThemedText>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <ThemedText themeColor="textSecondary" style={styles.stepText}>
            Paso 2 de 3 · {selectedCountText}
          </ThemedText>

          {habits.length === 0 ? (
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              Todavia no hay habitos registrados.
            </ThemedText>
          ) : (
            habits.map((habit) => {
              const isSelected = selectedIds.includes(habit.local_id);

              return (
                <Pressable
                  key={habit.local_id}
                  onPress={() => toggleHabit(habit.local_id)}
                  style={({ pressed }) => [
                    styles.habitCard,
                    isSelected && styles.habitCardSelected,
                    pressed && styles.buttonPressed,
                  ]}>
                  <View style={styles.habitRow}>
                    <ThemedText>{habit.nombre}</ThemedText>
                    <MaterialDesignIcons
                      name={isSelected ? 'check-circle' : 'checkbox-blank-circle-outline'}
                      size={20}
                      color={isSelected ? '#FFFFFF' : '#A1A1AA'}
                    />
                  </View>
                </Pressable>
              );
            })
          )}

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <Pressable onPress={handleContinue} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <ThemedText style={styles.buttonText}>Continuar</ThemedText>
          </Pressable>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerTitleIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  stepText: {
    marginTop: 24,
  },
  habitCard: {
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#18181B',
  },
  habitCardSelected: {
    backgroundColor: '#1E1E24',
    borderColor: '#3F3F46',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
  },
  button: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
  backButton: {
    width: 32,
    minHeight: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
