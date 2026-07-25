import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset } from '@/constants/theme';
import { listHabits, type Habit } from '@/database';
import { useAuth } from '@/providers/auth-provider';
import { useDatabase } from '@/providers/database-provider';
import { pullHabits } from '@/services/habits-sync';

export default function HabitsListScreen() {
  const { isReady } = useDatabase();
  const { token, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);

  const loadData = useCallback(async () => {
    if (token && user) {
      await pullHabits(token, user.id);
    }

    const habitsData = await listHabits();
    setHabits(habitsData);
  }, [token, user]);

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
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <View style={styles.titleIcon}>
                <MaterialDesignIcons name="fire" size={18} color="#FFFFFF" />
              </View>

              <ThemedText style={styles.title}>Mis habitos</ThemedText>
            </View>

            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Listado de Habitos
            </ThemedText>

            {habits.length === 0 ? (
              <ThemedText themeColor="textSecondary">Todavia no hay habitos cargados.</ThemedText>
            ) : (
              habits.map((habit) => (
                <Pressable
                  key={habit.local_id}
                  onPress={() =>
                    router.push({
                      pathname: '/habits/[habitId]',
                      params: { habitId: habit.local_id },
                    })
                  }
                  style={({ pressed }) => [styles.habitCard, pressed && styles.buttonPressed]}>
                  <ThemedText>{habit.nombre}</ThemedText>
                </Pressable>
              ))
            )}
          </View>
        </View>
      </ScrollView>

        <Pressable
          onPress={() => router.push('/habits/create')}
          style={({ pressed }) => [styles.floatingButton, pressed && styles.buttonPressed]}>
          <MaterialDesignIcons name="plus" size={22} color="#FFFFFF" />
          <ThemedText style={styles.floatingButtonText}>Crear Habito</ThemedText>
        </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
  habitCard: {
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 8,
    padding: 12,
    gap: 6,
    backgroundColor: '#18181B',
  },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: BottomTabInset + 92,
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
