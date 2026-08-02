import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Animated, Easing, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import {
  completeTask,
  listHabitRecords,
  listHabits,
  listRoutines,
  listRoutineDays,
  listRoutineHabitLinks,
  listPendingTasks,
  saveHabitRecord,
  type Habit,
  type HabitRecord,
  type Routine,
  type RoutineDay,
  type RoutineHabitLink,
  type Task,
} from '@/database';
import { useAuth } from '@/providers/auth-provider';
import { useDatabase } from '@/providers/database-provider';
import { pullHabitRecords, syncHabitRecords } from '@/services/habit-records-sync';
import { syncScheduledNotificationsAsync } from '@/services/notifications';
import { pullTasks, syncTasks } from '@/services/tasks-sync';

type HomeHabitRow = {
  id: string;
  tipo: 'habito' | 'tarea';
  habitoLocalId: string;
  tareaLocalId: string | null;
  hora: string;
  nombre: string;
  estado: 'Completado' | 'Pendiente' | 'Sin marcar' | 'Completar';
};

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function todayDayName(): string {
  return DAY_NAMES[new Date().getDay()];
}

function resolveHabitStatus(habitLocalId: string, records: HabitRecord[], today: string): HomeHabitRow['estado'] {
  const todayRecord = records.find(
    (record) => record.habito_local_id === habitLocalId && record.fecha === today,
  );

  if (!todayRecord) {
    return 'Sin marcar';
  }

  return todayRecord.completado ? 'Completado' : 'Pendiente';
}

function buildTaskRows(tasks: Task[]): HomeHabitRow[] {
  return tasks.map((task) => ({
    id: task.local_id,
    tipo: 'tarea',
    habitoLocalId: '',
    tareaLocalId: task.local_id,
    hora: task.hora_inicio ?? '--:--',
    nombre: task.titulo,
    estado: 'Completar',
  }));
}

function buildRows(
  habits: Habit[],
  routines: Routine[],
  routineDays: RoutineDay[],
  routineHabitLinks: RoutineHabitLink[],
  records: HabitRecord[],
  tasks: Task[],
): HomeHabitRow[] {
  const today = todayDateString();
  const activeExistingRoutineIds = new Set(routines.map((routine) => routine.local_id));
  const activeRoutineIds = new Set(
    routineDays
      .filter(
        (day) =>
          day.dia_semana === todayDayName() &&
          activeExistingRoutineIds.has(day.rutina_local_id),
      )
      .map((day) => day.rutina_local_id),
  );

  const habitRows = routineHabitLinks
    .filter((link) => activeRoutineIds.has(link.rutina_local_id))
    .map((link) => {
      const habit = habits.find((item) => item.local_id === link.habito_local_id);

      return {
        id: link.local_id,
        tipo: 'habito',
        habitoLocalId: link.habito_local_id,
        tareaLocalId: null,
        hora: link.hora_inicio ?? '--:--',
        nombre: habit?.nombre ?? 'Habito',
        estado: resolveHabitStatus(link.habito_local_id, records, today),
      };
    });

  return [...habitRows, ...buildTaskRows(tasks)].sort((left, right) => {
    if (left.hora === right.hora) {
      return left.nombre.localeCompare(right.nombre);
    }

    if (left.hora === '--:--') {
      return 1;
    }

    if (right.hora === '--:--') {
      return -1;
    }

    return left.hora.localeCompare(right.hora);
  });
}

export default function HomeScreen() {
  const { isReady } = useDatabase();
  const { token, user } = useAuth();
  const [rows, setRows] = useState<HomeHabitRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [taskButtonScale] = useState(() => new Animated.Value(1));

  const loadData = useCallback(async () => {
    try {
      setError(null);

      if (token) {
        await pullHabitRecords(token);
        if (user) {
          await pullTasks(token, user.id);
        }
      }

      const [habits, routines, routineDays, routineHabitLinks, records, tasks] = await Promise.all([
        listHabits(),
        listRoutines(),
        listRoutineDays(),
        listRoutineHabitLinks(),
        listHabitRecords(),
        listPendingTasks(),
      ]);

      setRows(buildRows(habits, routines, routineDays, routineHabitLinks, records, tasks));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'No se pudo cargar el registro de habitos.',
      );
    }
  }, [token, user]);

  const handleToggleCompleted = useCallback(
    async (row: HomeHabitRow) => {
      try {
        setError(null);
        setSavingRowId(row.id);

        if (row.tipo === 'tarea' && row.tareaLocalId) {
          await completeTask(row.tareaLocalId);

          if (token && user) {
            await syncTasks(token, user.id);
          }

          await syncScheduledNotificationsAsync();
        } else {
          await saveHabitRecord({
            habitoLocalId: row.habitoLocalId,
            fecha: todayDateString(),
            completado: row.estado !== 'Completado',
          });

          if (token) {
            await syncHabitRecords(token);
          }
        }

        await loadData();
      } catch (saveError) {
        setError(
          saveError instanceof Error ? saveError.message : 'No se pudo actualizar el estado del habito.',
        );
      } finally {
        setSavingRowId(null);
      }
    },
    [loadData, token, user],
  );

  const { refreshing, handleRefresh } = usePullToRefresh(loadData);

  useFocusEffect(
    useCallback(() => {
      if (!isReady) {
        return;
      }

      const timerId = setTimeout(() => {
        void loadData();
      }, 0);

      return () => clearTimeout(timerId);
    }, [isReady, loadData]),
  );

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(taskButtonScale, {
          toValue: 1.012,
          duration: 420,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(taskButtonScale, {
          toValue: 1,
          duration: 420,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(1100),
        Animated.timing(taskButtonScale, {
          toValue: 1.008,
          duration: 360,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(taskButtonScale, {
          toValue: 1,
          duration: 360,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ]),
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [taskButtonScale]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}>
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <MaterialDesignIcons name="home-outline" size={18} color="#FFFFFF" />
            </View>

            <ThemedText style={styles.title}>Inicio</ThemedText>
          </View>

          <View style={styles.subtitleRow}>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Rutinas de hoy
            </ThemedText>

            <View style={styles.createTaskButtonWrap}>
              <Animated.View
                style={{
                  transform: [{ scale: taskButtonScale }],
                }}>
                <Pressable
                  onPress={() => router.push('/tasks/create')}
                  style={({ pressed }) => [styles.createTaskButton, pressed && styles.statusButtonDisabled]}>
                  <MaterialDesignIcons name="plus-circle-outline" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.createTaskButtonText}>Crear tarea</ThemedText>
                </Pressable>
              </Animated.View>
            </View>
          </View>

          <View style={styles.tableHeader}>
            <ThemedText themeColor="textSecondary" style={[styles.headerCell, styles.timeCell]}>
              Hora
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.headerCell, styles.nameCell]}>
              Nombre
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.headerCell, styles.statusCell]}>
              Estado
            </ThemedText>
          </View>

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          {rows.length === 0 ? (
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              No hay habitos programados para hoy.
            </ThemedText>
          ) : (
            rows.map((row, index) => (
              <View
                key={row.id}
                style={[styles.rowCard, index === rows.length - 1 ? styles.rowCardLast : null]}>
                <ThemedText style={[styles.rowCell, styles.timeCell]}>{row.hora}</ThemedText>
                <ThemedText style={[styles.rowCell, styles.nameCell]}>{row.nombre}</ThemedText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void handleToggleCompleted(row)}
                  style={[
                    styles.statusButton,
                    row.estado === 'Completado'
                      ? styles.statusButtonDone
                      : row.estado === 'Completar'
                        ? styles.statusButtonTask
                      : row.estado === 'Pendiente'
                        ? styles.statusButtonPending
                        : styles.statusButtonUnmarked,
                    savingRowId === row.id ? styles.statusButtonDisabled : null,
                  ]}>
                  <ThemedText
                    style={[
                      styles.statusButtonText,
                      row.estado === 'Completado'
                        ? styles.statusDone
                        : row.estado === 'Completar'
                          ? styles.statusTask
                        : row.estado === 'Pendiente'
                          ? styles.statusPending
                          : styles.statusUnmarked,
                    ]}>
                    {savingRowId === row.id ? 'Guardando...' : row.estado}
                  </ThemedText>
                </Pressable>
              </View>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  titleIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  subtitle: {
    textAlign: 'left',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 36,
  },
  errorText: {
    color: '#DC2626',
  },
  createTaskButtonWrap: {
    borderRadius: 999,
  },
  createTaskButton: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#27272A',
    backgroundColor: '#1E1E24',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  createTaskButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 28,
  },
  headerCell: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'left',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#23232A',
  },
  rowCardLast: {
    borderBottomWidth: 0,
  },
  rowCell: {
    fontSize: 14,
  },
  timeCell: {
    width: 72,
  },
  nameCell: {
    flex: 1,
    paddingHorizontal: 8,
  },
  statusCell: {
    width: 110,
    textAlign: 'right',
    fontWeight: '600',
  },
  statusButton: {
    width: 110,
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginLeft: 'auto',
  },
  statusButtonDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderColor: 'rgba(34, 197, 94, 0.28)',
  },
  statusButtonPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  statusButtonTask: {
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
    borderColor: 'rgba(59, 130, 246, 0.28)',
  },
  statusButtonUnmarked: {
    backgroundColor: 'rgba(63, 63, 70, 0.4)',
    borderColor: '#3F3F46',
  },
  statusButtonDisabled: {
    opacity: 0.7,
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusDone: {
    color: '#22C55E',
  },
  statusPending: {
    color: '#F59E0B',
  },
  statusTask: {
    color: '#60A5FA',
  },
  statusUnmarked: {
    color: '#A1A1AA',
  },
  emptyText: {
    textAlign: 'center',
    color: '#A1A1AA',
    marginTop: 24,
  },
});
