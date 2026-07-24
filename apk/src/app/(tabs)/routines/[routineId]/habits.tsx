import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getRoutineById,
  listHabits,
  listRoutineHabitLinks,
  type Habit,
  type RoutineHabitLink,
} from '@/database';
import { useDatabase } from '@/providers/database-provider';

function resolveRoutineId(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export default function RoutineSelectableHabitsScreen() {
  const { routineId } = useLocalSearchParams<{ routineId?: string | string[] }>();
  const { isReady } = useDatabase();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [links, setLinks] = useState<RoutineHabitLink[]>([]);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const localRoutineId = resolveRoutineId(routineId);

  const loadData = useCallback(async () => {
    if (!isReady || !localRoutineId) {
      return;
    }

    const routine = await getRoutineById(localRoutineId);

    if (!routine) {
      setScreenError('No se encontro la rutina.');
      setIsLoaded(true);
      return;
    }

    const [habitsData, linksData] = await Promise.all([listHabits(), listRoutineHabitLinks()]);

    setHabits(habitsData);
    setLinks(linksData);
    setScreenError(null);
    setIsLoaded(true);
  }, [isReady, localRoutineId]);

  useFocusEffect(
    useCallback(() => {
      if (!isReady || !localRoutineId) {
        return;
      }

      setIsLoaded(false);

      const timerId = setTimeout(() => {
        void loadData();
      }, 0);

      return () => clearTimeout(timerId);
    }, [isReady, localRoutineId, loadData]),
  );

  const availableHabits = habits.filter(
    (habit) =>
      !links.some(
        (link) =>
          link.rutina_local_id === localRoutineId &&
          link.habito_local_id === habit.local_id,
      ),
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() =>
                router.replace({
                  pathname: '/routines/[routineId]/organize',
                  params: { routineId: localRoutineId },
                })
              }
              hitSlop={12}
              style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
              <ThemedText style={styles.backButtonText}>{'<'}</ThemedText>
            </Pressable>

            <View style={styles.headerTitleBlock}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerTitleIcon}>
                  <MaterialDesignIcons name="playlist-plus" size={16} color="#FFFFFF" />
                </View>

                <ThemedText style={styles.headerTitle}>Habitos Registrados</ThemedText>
              </View>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <ThemedText themeColor="textSecondary" style={styles.sectionSubtitle}>
            Elige un Habito
          </ThemedText>

          {!isLoaded ? (
            <ThemedText themeColor="textSecondary">Cargando habitos...</ThemedText>
          ) : screenError ? (
            <ThemedText style={styles.errorText}>{screenError}</ThemedText>
          ) : availableHabits.length === 0 ? (
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              No hay habitos disponibles para seleccionar.
            </ThemedText>
          ) : (
            availableHabits.map((habit) => (
              <Pressable
                key={habit.local_id}
                onPress={() =>
                  router.push({
                    pathname: '/routines/[routineId]/habits/[habitId]',
                    params: {
                      routineId: localRoutineId,
                      habitId: habit.local_id,
                    },
                  })
                }
                style={({ pressed }) => [styles.habitCard, pressed && styles.buttonPressed]}>
                <ThemedText>{habit.nombre}</ThemedText>
              </Pressable>
            ))
          )}
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
    gap: 12,
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
  headerSpacer: {
    width: 32,
  },
  sectionSubtitle: {
    textAlign: 'left',
    marginTop: 24,
  },
  habitCard: {
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#18181B',
  },
  emptyText: {
    textAlign: 'center',
    color: '#A1A1AA',
    marginTop: 24,
  },
  buttonPressed: {
    opacity: 0.85,
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
