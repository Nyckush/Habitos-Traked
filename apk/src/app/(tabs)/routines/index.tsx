import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset } from '@/constants/theme';
import { listRoutineDays, listRoutines, type Routine, type RoutineDay } from '@/database';
import { useDatabase } from '@/providers/database-provider';

export default function RoutinesListScreen() {
  const { isReady } = useDatabase();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineDays, setRoutineDays] = useState<RoutineDay[]>([]);

  const loadData = async () => {
    const [routinesData, routineDaysData] = await Promise.all([listRoutines(), listRoutineDays()]);
    setRoutines(routinesData);
    setRoutineDays(routineDaysData);
  };

  useFocusEffect(
    useCallback(() => {
      if (!isReady) {
        return;
      }

      const timerId = setTimeout(() => {
        void loadData();
      }, 0);

      return () => clearTimeout(timerId);
    }, [isReady]),
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <MaterialDesignIcons name="repeat" size={18} color="#FFFFFF" />
            </View>

            <ThemedText style={styles.title}>Mis rutinas</ThemedText>
          </View>

          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Listado de Rutinas
          </ThemedText>

          {routines.length === 0 ? (
            <ThemedText themeColor="textSecondary">Todavia no hay rutinas cargadas.</ThemedText>
          ) : (
            routines.map((routine) => (
              <View key={routine.local_id} style={styles.routineCard}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/routines/[routineId]',
                      params: { routineId: routine.local_id },
                    })
                  }
                  style={({ pressed }) => [pressed && styles.buttonPressed]}>
                  <ThemedText>{routine.nombre}</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.daysSummary}>
                    {routineDays
                      .filter((item) => item.rutina_local_id === routine.local_id)
                      .map((item) => item.dia_semana)
                      .join(' · ')}
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/routines/[routineId]/organize',
                      params: { routineId: routine.local_id },
                    })
                  }
                  style={({ pressed }) => [styles.organizeButton, pressed && styles.buttonPressed]}>
                  <ThemedText style={styles.organizeButtonText}>Organizar</ThemedText>
                </Pressable>
              </View>
            ))
          )}
        </View>

        <Pressable
          onPress={() => router.push('/routines/create')}
          style={({ pressed }) => [styles.floatingButton, pressed && styles.buttonPressed]}>
          <MaterialDesignIcons name="plus" size={22} color="#FFFFFF" />
          <ThemedText style={styles.floatingButtonText}>Crear Rutina</ThemedText>
        </Pressable>
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
    paddingBottom: BottomTabInset + 32,
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
  routineCard: {
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 8,
    padding: 12,
    gap: 10,
    backgroundColor: '#18181B',
  },
  daysSummary: {
    textTransform: 'capitalize',
  },
  organizeButton: {
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  organizeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: BottomTabInset + 52,
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#27272A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 12,
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
