import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset } from '@/constants/theme';
import {
  getRoutineById,
  listHabits,
  listRoutineHabitLinks,
  type Habit,
  type RoutineHabitLink,
} from '@/database';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useAuth } from '@/providers/auth-provider';
import { useDatabase } from '@/providers/database-provider';
import { pullRoutineHabitLinks } from '@/services/routine-habit-links-sync';

function resolveRoutineId(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export default function RoutineOrganizeScreen() {
  const { routineId } = useLocalSearchParams<{ routineId?: string | string[] }>();
  const { isReady } = useDatabase();
  const { token } = useAuth();
  const [routineName, setRoutineName] = useState('');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [routineHabitLinks, setRoutineHabitLinks] = useState<RoutineHabitLink[]>([]);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pulseScale] = useState(() => new Animated.Value(1));
  const [pulseGlow] = useState(() => new Animated.Value(0.35));

  const localRoutineId = resolveRoutineId(routineId);

  const loadData = useCallback(async () => {
    if (!isReady || !localRoutineId) {
      return;
    }

    try {
      const routine = await getRoutineById(localRoutineId);

      if (!routine) {
        setScreenError('No se encontro la rutina.');
        setIsLoaded(true);
        return;
      }

      if (token) {
        try {
          await pullRoutineHabitLinks(token);
        } catch (error) {
          console.warn('No se pudieron actualizar los habitos de la rutina desde el backend.', error);
        }
      }

      const [habitsData, linksData] = await Promise.all([listHabits(), listRoutineHabitLinks()]);

      setRoutineName(routine.nombre);
      setHabits(habitsData);
      setRoutineHabitLinks(linksData);
      setScreenError(null);
    } catch (error) {
      setScreenError(
        error instanceof Error ? error.message : 'No se pudo cargar la organizacion de la rutina.',
      );
    } finally {
      setIsLoaded(true);
    }
  }, [isReady, localRoutineId, token]);

  const { refreshing, handleRefresh } = usePullToRefresh(loadData);

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

  const routineHasHabits = routineHabitLinks.some((item) => item.rutina_local_id === localRoutineId);

  useEffect(() => {
    if (!isLoaded || routineHasHabits) {
      pulseScale.stopAnimation();
      pulseGlow.stopAnimation();
      pulseScale.setValue(1);
      pulseGlow.setValue(0.35);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.06,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseGlow, {
            toValue: 0.7,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(pulseGlow, {
            toValue: 0.35,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      ]),
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [isLoaded, pulseGlow, pulseScale, routineHasHabits]);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => router.replace('/routines')}
                hitSlop={12}
                style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
                <ThemedText style={styles.backButtonText}>{'<'}</ThemedText>
              </Pressable>

              <View style={styles.headerTitleBlock}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.headerTitleIcon}>
                    <MaterialDesignIcons name="repeat" size={16} color="#FFFFFF" />
                  </View>

                  <ThemedText style={styles.headerTitle}>Organiza tu Rutina</ThemedText>
                </View>
              </View>

              <View style={styles.headerSpacer} />
            </View>

            <ThemedText themeColor="textSecondary" style={styles.routineSubtitle}>
              {`Rutina : ${routineName || 'Sin nombre'}`}
            </ThemedText>

            {!isLoaded ? (
              <ThemedText themeColor="textSecondary">Cargando rutina...</ThemedText>
            ) : screenError ? (
              <ThemedText style={styles.errorText}>{screenError}</ThemedText>
            ) : null}
          </View>
        {isLoaded && !screenError && routineHasHabits ? (
          <View style={styles.linkedHabitsList}>
            {routineHabitLinks
              .filter((item) => item.rutina_local_id === localRoutineId)
              .map((link) => {
                const habit = habits.find((item) => item.local_id === link.habito_local_id);

                  if (!habit) {
                    return null;
                  }

                return (
                  <Pressable
                    key={link.local_id}
                    onPress={() =>
                      router.push({
                        pathname: '/routines/[routineId]/habits/[habitId]',
                        params: {
                          routineId: localRoutineId,
                          habitId: habit.local_id,
                        },
                      })
                    }
                    style={({ pressed }) => [
                      styles.linkedHabitCard,
                      pressed && styles.buttonPressed,
                    ]}>
                    <ThemedText>{habit.nombre}</ThemedText>
                    <ThemedText themeColor="textSecondary">
                      {link.hora_inicio ? `Hora : ${link.hora_inicio}` : 'Hora sin definir'}
                    </ThemedText>
                  </Pressable>
                );
              })}
          </View>
        ) : null}
        </View>
      </ScrollView>

      {isLoaded && !screenError && !routineHasHabits ? (
        <View pointerEvents="none" style={styles.emptyStateOverlay}>
          <ThemedText style={styles.emptyStateText}>Ingresa tu Primer habito ...</ThemedText>
        </View>
      ) : null}

      {isLoaded && !screenError ? (
          <Animated.View
            style={[
              styles.floatingButtonWrap,
              {
                transform: [{ scale: pulseScale }],
                shadowOpacity: routineHasHabits ? 0.18 : pulseGlow,
            },
          ]}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/routines/[routineId]/habits',
                params: { routineId: localRoutineId },
              })
            }
            style={({ pressed }) => [
              styles.floatingButton,
              pressed && styles.buttonPressed,
            ]}>
            <MaterialDesignIcons name="plus" size={22} color="#FFFFFF" />
            <ThemedText style={styles.floatingButtonText}>Agregar habito</ThemedText>
          </Pressable>
        </Animated.View>
      ) : null}
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
  headerSubtitle: {
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  routineSubtitle: {
    textAlign: 'left',
    marginTop: 24,
  },
  emptyStateOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#A1A1AA',
  },
  linkedHabitsList: {
    gap: 12,
  },
  linkedHabitCard: {
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#18181B',
    gap: 6,
  },
  floatingButtonWrap: {
    position: 'absolute',
    right: 24,
    bottom: 122,
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
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 12,
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
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
