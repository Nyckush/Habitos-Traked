import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  deleteRoutine,
  deleteRoutineDaysByRoutineId,
  getRoutineById,
  listRoutineDays,
  ROUTINE_DAY_OPTIONS,
  type RoutineDayValue,
  updateRoutine,
  createRoutineDay,
} from '@/database';
import { useAuth } from '@/providers/auth-provider';
import { useDatabase } from '@/providers/database-provider';
import { syncScheduledNotificationsAsync } from '@/services/notifications';
import { syncRoutines } from '@/services/routines-sync';

function resolveRoutineId(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export default function RoutineEditScreen() {
  const { routineId } = useLocalSearchParams<{ routineId?: string | string[] }>();
  const { token, user } = useAuth();
  const { isReady, refreshStatus } = useDatabase();
  const inputRef = useRef<TextInput>(null);
  const [nombre, setNombre] = useState('');
  const [selectedDays, setSelectedDays] = useState<RoutineDayValue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [labelAnimation] = useState(() => new Animated.Value(0));
  const [underlineAnimation] = useState(() => new Animated.Value(0));

  const localRoutineId = resolveRoutineId(routineId);

  const loadRoutine = useCallback(async () => {
    if (!isReady || !localRoutineId) {
      return;
    }

    const routine = await getRoutineById(localRoutineId);

    if (!routine) {
      setScreenError('No se encontro la rutina.');
      setIsLoaded(true);
      return;
    }

    setNombre(routine.nombre);
    const routineDays = await listRoutineDays();
    setSelectedDays(
      routineDays
        .filter((item) => item.rutina_local_id === localRoutineId)
        .map((item) => item.dia_semana),
    );
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
        void loadRoutine();
      }, 50);

      return () => clearTimeout(timerId);
    }, [isReady, localRoutineId, loadRoutine]),
  );

  useEffect(() => {
    Animated.timing(labelAnimation, {
      toValue: isFocused || nombre.trim().length > 0 ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isFocused, labelAnimation, nombre]);

  useEffect(() => {
    Animated.timing(underlineAnimation, {
      toValue: isFocused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isFocused, underlineAnimation]);

  useEffect(() => {
    if (!isLoaded || screenError) {
      return;
    }

    const timerId = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    return () => clearTimeout(timerId);
  }, [isLoaded, screenError]);

  function toggleDay(day: RoutineDayValue) {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  }

  async function handleSaveRoutine() {
    if (!nombre.trim()) {
      setError('Escribi un nombre para la rutina.');
      return;
    }

    if (selectedDays.length === 0) {
      setError('Selecciona al menos un dia para la rutina.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await updateRoutine({
        localId: localRoutineId,
        nombre,
      });

      await deleteRoutineDaysByRoutineId(localRoutineId);
      await Promise.all(
        selectedDays.map((day) =>
          createRoutineDay({
            rutinaLocalId: localRoutineId,
            diaSemana: day,
          }),
        ),
      );

      if (token && user) {
        await syncRoutines(token, user.id);
      }

      await syncScheduledNotificationsAsync();
      await refreshStatus();
      router.replace('/routines');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar la rutina.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDeleteRoutine() {
    Alert.alert('Eliminar rutina', '¿Seguro que queres eliminar esta rutina?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void handleDeleteRoutine();
        },
      },
    ]);
  }

  async function handleDeleteRoutine() {
    try {
      setSubmitting(true);
      setError(null);

      await deleteRoutine(localRoutineId);

      if (token && user) {
        await syncRoutines(token, user.id);
      }

      await syncScheduledNotificationsAsync();
      await refreshStatus();
      router.replace('/routines');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar la rutina.');
    } finally {
      setSubmitting(false);
    }
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
                  <MaterialDesignIcons name="repeat" size={16} color="#FFFFFF" />
                </View>

                <ThemedText style={styles.headerTitle}>Edita tu Rutina</ThemedText>
              </View>

              <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
                Ajusta el nombre o elimina esta rutina
              </ThemedText>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.formCard}>
            {!isLoaded ? (
              <ThemedText themeColor="textSecondary">Cargando rutina...</ThemedText>
            ) : screenError ? (
              <>
                <ThemedText style={styles.errorText}>{screenError}</ThemedText>
                <Pressable
                  onPress={() => router.back()}
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
                  <ThemedText style={styles.buttonText}>Volver al listado</ThemedText>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Animated.Text
                    pointerEvents="none"
                    style={[
                      styles.floatingLabel,
                      {
                        color: isFocused || nombre.trim().length > 0 ? '#E4E4E7' : '#A1A1AA',
                        transform: [
                          {
                            translateY: labelAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 2],
                            }),
                          },
                          {
                            scale: labelAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 0.78],
                            }),
                          },
                        ],
                      },
                    ]}>
                    Rutina
                  </Animated.Text>

                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={nombre}
                    onChangeText={setNombre}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />

                  <View style={styles.inputLineBase} />
                  <Animated.View
                    style={[
                      styles.inputLineActive,
                      {
                        opacity: underlineAnimation,
                        transform: [
                          {
                            scaleX: underlineAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.35, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </View>

                <View style={styles.daysSection}>
                  <ThemedText themeColor="textSecondary">Dias de la rutina</ThemedText>

                  <View style={styles.daysGrid}>
                    {ROUTINE_DAY_OPTIONS.map((day) => {
                      const selected = selectedDays.includes(day);

                      return (
                        <Pressable
                          key={day}
                          onPress={() => toggleDay(day)}
                          style={({ pressed }) => [
                            styles.dayChip,
                            selected && styles.dayChipSelected,
                            pressed && styles.buttonPressed,
                          ]}>
                          <ThemedText style={selected ? styles.dayChipTextSelected : styles.dayChipText}>
                            {day}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

                <Pressable
                  disabled={submitting}
                  onPress={handleSaveRoutine}
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                    submitting && styles.buttonDisabled,
                  ]}>
                  <ThemedText style={styles.buttonText}>
                    {submitting ? 'Guardando...' : 'Guardar cambios'}
                  </ThemedText>
                </Pressable>

                <Pressable
                  disabled={submitting}
                  onPress={confirmDeleteRoutine}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && styles.buttonPressed,
                    submitting && styles.buttonDisabled,
                  ]}>
                  <ThemedText style={styles.deleteButtonText}>Eliminar rutina</ThemedText>
                </Pressable>
              </>
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
  formCard: {
    gap: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#18181B',
  },
  daysSection: {
    gap: 10,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1E1E24',
  },
  dayChipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  dayChipText: {
    color: '#E4E4E7',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dayChipTextSelected: {
    color: '#0A0A0C',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  inputGroup: {
    position: 'relative',
    paddingTop: 6,
    paddingBottom: 2,
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  input: {
    paddingHorizontal: 0,
    paddingTop: 24,
    paddingBottom: 8,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  inputLineBase: {
    height: 1,
    backgroundColor: '#3F3F46',
  },
  inputLineActive: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    left: 0,
    height: 2,
    backgroundColor: '#FFFFFF',
  },
  button: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    backgroundColor: '#2A1114',
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
  deleteButtonText: {
    color: '#FCA5A5',
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
