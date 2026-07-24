import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createRoutineHabitLink, getHabitById, getRoutineById } from '@/database';
import { useDatabase } from '@/providers/database-provider';

function resolveParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function formatHourInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isValidHour(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hours, minutes] = value.split(':').map(Number);

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export default function RoutineHabitHourScreen() {
  const params = useLocalSearchParams<{ routineId?: string | string[]; habitId?: string | string[] }>();
  const { isReady, refreshStatus } = useDatabase();
  const inputRef = useRef<TextInput>(null);
  const [habitName, setHabitName] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [labelAnimation] = useState(() => new Animated.Value(0));
  const [underlineAnimation] = useState(() => new Animated.Value(0));

  const localRoutineId = resolveParam(params.routineId);
  const localHabitId = resolveParam(params.habitId);

  const loadData = useCallback(async () => {
    if (!isReady || !localRoutineId || !localHabitId) {
      return;
    }

    const [routine, habit] = await Promise.all([
      getRoutineById(localRoutineId),
      getHabitById(localHabitId),
    ]);

    if (!routine || !habit) {
      setScreenError('No se encontro la rutina o el habito.');
      setIsLoaded(true);
      return;
    }

    setHabitName(habit.nombre);
    setScreenError(null);
    setIsLoaded(true);
  }, [isReady, localHabitId, localRoutineId]);

  useFocusEffect(
    useCallback(() => {
      if (!isReady || !localRoutineId || !localHabitId) {
        return;
      }

      setIsLoaded(false);
      setHoraInicio('');
      setError(null);

      const timerId = setTimeout(() => {
        void loadData();
      }, 0);

      return () => {
        clearTimeout(timerId);
        setHoraInicio('');
        setError(null);
      };
    }, [isReady, localHabitId, localRoutineId, loadData]),
  );

  useEffect(() => {
    if (!isLoaded || screenError) {
      return;
    }

    const timerId = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    return () => clearTimeout(timerId);
  }, [isLoaded, screenError]);

  useEffect(() => {
    Animated.timing(labelAnimation, {
      toValue: isFocused || horaInicio.trim().length > 0 ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [horaInicio, isFocused, labelAnimation]);

  useEffect(() => {
    Animated.timing(underlineAnimation, {
      toValue: isFocused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isFocused, underlineAnimation]);

  async function handleSaveLink() {
    if (!horaInicio.trim()) {
      setError('Escribi una hora para el habito.');
      return;
    }

    if (!isValidHour(horaInicio.trim())) {
      setError('La hora debe tener formato valido HH:MM.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await createRoutineHabitLink({
        rutinaLocalId: localRoutineId,
        habitoLocalId: localHabitId,
        horaInicio,
      });

      setHoraInicio('');
      await refreshStatus();
      router.replace({
        pathname: '/routines/[routineId]/organize',
        params: { routineId: localRoutineId },
      });
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : 'No se pudo guardar el habito.');
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
              onPress={() =>
                router.replace({
                  pathname: '/routines/[routineId]/habits',
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
                  <MaterialDesignIcons name="clock-outline" size={16} color="#FFFFFF" />
                </View>

                <ThemedText style={styles.headerTitle}>Define la Hora</ThemedText>
              </View>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <ThemedText themeColor="textSecondary" style={styles.habitSubtitle}>
            {`Habito : ${habitName || 'Sin nombre'}`}
          </ThemedText>

          {!isLoaded ? (
            <ThemedText themeColor="textSecondary">Cargando datos...</ThemedText>
          ) : screenError ? (
            <ThemedText style={styles.errorText}>{screenError}</ThemedText>
          ) : (
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Animated.Text
                  pointerEvents="none"
                  style={[
                    styles.floatingLabel,
                    {
                      color: isFocused || horaInicio.trim().length > 0 ? '#E4E4E7' : '#A1A1AA',
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
                  Hora (HH:MM)
                </Animated.Text>

                <TextInput
                  ref={inputRef}
                  keyboardType="number-pad"
                  maxLength={5}
                  placeholderTextColor="#A1A1AA"
                  style={styles.input}
                  value={horaInicio}
                  onChangeText={(value) => {
                    setHoraInicio(formatHourInput(value));
                    if (error) {
                      setError(null);
                    }
                  }}
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

              {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

              <Pressable
                disabled={submitting}
                onPress={handleSaveLink}
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}>
                <ThemedText style={styles.buttonText}>
                  {submitting ? 'Guardando...' : 'Guardar habito'}
                </ThemedText>
              </Pressable>
            </View>
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
  habitSubtitle: {
    textAlign: 'left',
    marginTop: 24,
  },
  formCard: {
    gap: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#18181B',
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
  buttonText: {
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
