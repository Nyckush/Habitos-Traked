import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createTask } from '@/database';
import { useAuth } from '@/providers/auth-provider';
import { useDatabase } from '@/providers/database-provider';
import { syncScheduledNotificationsAsync } from '@/services/notifications';
import { syncTasks } from '@/services/tasks-sync';

export default function TasksCreateScreen() {
  const { token, user } = useAuth();
  const { refreshStatus } = useDatabase();
  const inputRef = useRef<TextInput>(null);
  const [titulo, setTitulo] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isHourFocused, setIsHourFocused] = useState(false);
  const [titleLabelAnimation] = useState(() => new Animated.Value(0));
  const [titleUnderlineAnimation] = useState(() => new Animated.Value(0));
  const [hourLabelAnimation] = useState(() => new Animated.Value(0));
  const [hourUnderlineAnimation] = useState(() => new Animated.Value(0));

  useFocusEffect(
    useCallback(() => {
      const timerId = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      return () => clearTimeout(timerId);
    }, []),
  );

  useEffect(() => {
    Animated.timing(titleLabelAnimation, {
      toValue: isTitleFocused || titulo.trim().length > 0 ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isTitleFocused, titleLabelAnimation, titulo]);

  useEffect(() => {
    Animated.timing(titleUnderlineAnimation, {
      toValue: isTitleFocused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isTitleFocused, titleUnderlineAnimation]);

  useEffect(() => {
    Animated.timing(hourLabelAnimation, {
      toValue: isHourFocused || horaInicio.trim().length > 0 ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [horaInicio, hourLabelAnimation, isHourFocused]);

  useEffect(() => {
    Animated.timing(hourUnderlineAnimation, {
      toValue: isHourFocused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [hourUnderlineAnimation, isHourFocused]);

  function formatHourInput(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4);

    if (digits.length <= 2) {
      return digits;
    }

    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }

  async function handleCreateTask() {
    if (!titulo.trim()) {
      setError('Escribi un titulo para la tarea.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await createTask({
        userRemoteId: user?.id ?? null,
        titulo,
        horaInicio,
      });

      if (token && user) {
        await syncTasks(token, user.id);
      }

      await syncScheduledNotificationsAsync();
      setTitulo('');
      setHoraInicio('');
      await refreshStatus();
      router.replace('/home');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo guardar la tarea.');
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
              onPress={() => router.replace('/home')}
              hitSlop={12}
              style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
              <ThemedText style={styles.backButtonText}>{'<'}</ThemedText>
            </Pressable>

            <View style={styles.headerTitleBlock}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerTitleIcon}>
                  <MaterialDesignIcons name="check-circle-outline" size={16} color="#FFFFFF" />
                </View>

                <ThemedText style={styles.headerTitle}>Nueva Tarea</ThemedText>
              </View>

              <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
                Crea una tarea puntual para hoy
              </ThemedText>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.floatingLabel,
                  {
                    color: isTitleFocused || titulo.trim().length > 0 ? '#E4E4E7' : '#A1A1AA',
                    transform: [
                      {
                        translateY: titleLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 2],
                        }),
                      },
                      {
                        scale: titleLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.78],
                        }),
                      },
                    ],
                  },
                ]}>
                Tarea
              </Animated.Text>

              <TextInput
                ref={inputRef}
                style={styles.input}
                value={titulo}
                onChangeText={setTitulo}
                onFocus={() => setIsTitleFocused(true)}
                onBlur={() => setIsTitleFocused(false)}
              />

              <View style={styles.inputLineBase} />
              <Animated.View
                style={[
                  styles.inputLineActive,
                  {
                    opacity: titleUnderlineAnimation,
                    transform: [
                      {
                        scaleX: titleUnderlineAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.35, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.floatingLabel,
                  {
                    color: isHourFocused || horaInicio.trim().length > 0 ? '#E4E4E7' : '#A1A1AA',
                    transform: [
                      {
                        translateY: hourLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 2],
                        }),
                      },
                      {
                        scale: hourLabelAnimation.interpolate({
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
                keyboardType="number-pad"
                maxLength={5}
                style={styles.input}
                value={horaInicio}
                onChangeText={(value) => setHoraInicio(formatHourInput(value))}
                onFocus={() => setIsHourFocused(true)}
                onBlur={() => setIsHourFocused(false)}
              />

              <View style={styles.inputLineBase} />
              <Animated.View
                style={[
                  styles.inputLineActive,
                  {
                    opacity: hourUnderlineAnimation,
                    transform: [
                      {
                        scaleX: hourUnderlineAnimation.interpolate({
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
              onPress={handleCreateTask}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}>
              <ThemedText style={styles.buttonText}>
                {submitting ? 'Guardando...' : 'Guardar tarea'}
              </ThemedText>
            </Pressable>
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
