import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  listHabitRecords,
  listHabits,
  listRoutineDays,
  listRoutineHabitLinks,
  saveHabitRecord,
  type Habit,
  type HabitRecord,
  type RoutineDay,
  type RoutineHabitLink,
} from '@/database';
import { useDatabase } from '@/providers/database-provider';

type HomeHabitRow = {
  id: string;
  habitoLocalId: string;
  hora: string;
  nombre: string;
  estado: 'Completado' | 'Pendiente' | 'Sin marcar';
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

function buildRows(
  habits: Habit[],
  routineDays: RoutineDay[],
  routineHabitLinks: RoutineHabitLink[],
  records: HabitRecord[],
): HomeHabitRow[] {
  const today = todayDateString();
  const activeRoutineIds = new Set(
    routineDays.filter((day) => day.dia_semana === todayDayName()).map((day) => day.rutina_local_id),
  );

  return routineHabitLinks
    .filter((link) => activeRoutineIds.has(link.rutina_local_id))
    .map((link) => {
      const habit = habits.find((item) => item.local_id === link.habito_local_id);

      return {
        id: link.local_id,
        habitoLocalId: link.habito_local_id,
        hora: link.hora_inicio ?? '--:--',
        nombre: habit?.nombre ?? 'Habito',
        estado: resolveHabitStatus(link.habito_local_id, records, today),
      };
    })
    .sort((left, right) => left.hora.localeCompare(right.hora));
}

export default function HomeScreen() {
  const { isReady } = useDatabase();
  const [rows, setRows] = useState<HomeHabitRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);

      const [habits, routineDays, routineHabitLinks, records] = await Promise.all([
        listHabits(),
        listRoutineDays(),
        listRoutineHabitLinks(),
        listHabitRecords(),
      ]);

      setRows(buildRows(habits, routineDays, routineHabitLinks, records));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'No se pudo cargar el registro de habitos.',
      );
    }
  }, []);

  const handleToggleCompleted = useCallback(
    async (row: HomeHabitRow) => {
      try {
        setError(null);
        setSavingRowId(row.id);

        await saveHabitRecord({
          habitoLocalId: row.habitoLocalId,
          fecha: todayDateString(),
          completado: row.estado !== 'Completado',
        });

        await loadData();
      } catch (saveError) {
        setError(
          saveError instanceof Error ? saveError.message : 'No se pudo actualizar el estado del habito.',
        );
      } finally {
        setSavingRowId(null);
      }
    },
    [loadData],
  );

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

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <MaterialDesignIcons name="home-outline" size={18} color="#FFFFFF" />
            </View>

            <ThemedText style={styles.title}>Inicio</ThemedText>
          </View>

          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Rutinas de hoy
          </ThemedText>

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
    marginTop: 24,
  },
  errorText: {
    color: '#DC2626',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 18,
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
  statusUnmarked: {
    color: '#A1A1AA',
  },
  emptyText: {
    textAlign: 'center',
    color: '#A1A1AA',
    marginTop: 24,
  },
});
