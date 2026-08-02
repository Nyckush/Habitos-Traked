import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { deleteHabit, getHabitById, updateHabit } from '@/database';
import { useAuth } from '@/providers/auth-provider';
import { useDatabase } from '@/providers/database-provider';
import { syncHabits } from '@/services/habits-sync';

function resolveHabitId(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export default function HabitEditScreen() {
  const { habitId } = useLocalSearchParams<{ habitId?: string | string[] }>();
  const { token, user } = useAuth();
  const { isReady, refreshStatus } = useDatabase();
  const inputRef = useRef<TextInput>(null);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [labelAnimation] = useState(() => new Animated.Value(0));
  const [underlineAnimation] = useState(() => new Animated.Value(0));

  const localHabitId = resolveHabitId(habitId);

  const loadHabit = useCallback(async () => {
    if (!isReady || !localHabitId) {
      return;
    }

    const habit = await getHabitById(localHabitId);

    if (!habit) {
      setScreenError('No se encontro el habito.');
      setIsLoaded(true);
      return;
    }

    setNombre(habit.nombre);
    setScreenError(null);
    setIsLoaded(true);
  }, [isReady, localHabitId]);

  useFocusEffect(
    useCallback(() => {
      if (!isReady || !localHabitId) {
        return;
      }

      setIsLoaded(false);

      const timerId = setTimeout(() => {
        void loadHabit();
      }, 50);

      return () => clearTimeout(timerId);
    }, [isReady, localHabitId, loadHabit]),
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

  async function handleSaveHabit() {
    if (!nombre.trim()) {
      setError('Escribi un nombre para el habito.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await updateHabit({
        localId: localHabitId,
        nombre,
      });

      if (token && user) {
        await syncHabits(token, user.id);
      }

      await refreshStatus();
      router.replace('/habits');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el habito.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDeleteHabit() {
    Alert.alert('Eliminar habito', '¿Seguro que queres eliminar este habito?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void handleDeleteHabit();
        },
      },
    ]);
  }

  async function handleDeleteHabit() {
    try {
      setSubmitting(true);
      setError(null);

      await deleteHabit(localHabitId);

      if (token && user) {
        await syncHabits(token, user.id);
      }

      await refreshStatus();
      router.replace('/habits');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el habito.');
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
                  <MaterialDesignIcons name="fire" size={16} color="#FFFFFF" />
                </View>

                <ThemedText style={styles.headerTitle}>Edita tu Habito</ThemedText>
              </View>

              <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
                Ajusta el nombre o elimina este habito
              </ThemedText>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.formCard}>
            {!isLoaded ? (
              <ThemedText themeColor="textSecondary">Cargando habito...</ThemedText>
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
                    Habito
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

                {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

                <Pressable
                  disabled={submitting}
                  onPress={handleSaveHabit}
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
                  onPress={confirmDeleteHabit}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && styles.buttonPressed,
                    submitting && styles.buttonDisabled,
                  ]}>
                  <ThemedText style={styles.deleteButtonText}>Eliminar habito</ThemedText>
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
