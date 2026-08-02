import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createObjetivo, deleteObjetivo, getMetaById, updateObjetivo } from '@/database';
import { useAuth } from '@/providers/auth-provider';
import { useDatabase } from '@/providers/database-provider';
import { syncObjetivos } from '@/services/goals-sync';

function resolveParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

export default function ObjectiveCreateDetailsScreen() {
  const { metaId, objectiveId, objectiveName, selectedHabitIds, metaEsperada: metaEsperadaParam, fechaLimite: fechaLimiteParam } = useLocalSearchParams<{
    metaId?: string | string[];
    objectiveId?: string | string[];
    objectiveName?: string | string[];
    selectedHabitIds?: string | string[];
    metaEsperada?: string | string[];
    fechaLimite?: string | string[];
  }>();
  const { token, user } = useAuth();
  const { refreshStatus } = useDatabase();
  const quantityInputRef = useRef<TextInput>(null);
  const [metaNombre, setMetaNombre] = useState('');
  const [metaEsperada, setMetaEsperada] = useState(resolveParam(metaEsperadaParam) || '1');
  const [fechaLimite, setFechaLimite] = useState(resolveParam(fechaLimiteParam) || todayString());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quantityFocused, setQuantityFocused] = useState(false);
  const [dateFocused, setDateFocused] = useState(false);
  const [quantityLabelAnimation] = useState(() => new Animated.Value(1));
  const [dateLabelAnimation] = useState(() => new Animated.Value(1));
  const [quantityUnderlineAnimation] = useState(() => new Animated.Value(0));
  const [dateUnderlineAnimation] = useState(() => new Animated.Value(0));

  const metaLocalId = resolveParam(metaId);
  const objectiveLocalId = resolveParam(objectiveId);
  const name = resolveParam(objectiveName);
  const habitIds = resolveParam(selectedHabitIds)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  useEffect(() => {
    const timerId = setTimeout(() => {
      quantityInputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timerId);
  }, []);

  useEffect(() => {
    void (async () => {
      if (!metaLocalId) {
        return;
      }

      const meta = await getMetaById(metaLocalId);
      setMetaNombre(meta?.nombre ?? '');
    })();
  }, [metaLocalId]);

  useEffect(() => {
    Animated.timing(quantityLabelAnimation, {
      toValue: quantityFocused || metaEsperada.trim().length > 0 ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [metaEsperada, quantityFocused, quantityLabelAnimation]);

  useEffect(() => {
    Animated.timing(dateLabelAnimation, {
      toValue: dateFocused || fechaLimite.trim().length > 0 ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [dateFocused, dateLabelAnimation, fechaLimite]);

  useEffect(() => {
    Animated.timing(quantityUnderlineAnimation, {
      toValue: quantityFocused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [quantityFocused, quantityUnderlineAnimation]);

  useEffect(() => {
    Animated.timing(dateUnderlineAnimation, {
      toValue: dateFocused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [dateFocused, dateUnderlineAnimation]);

  async function handleCreateObjective() {
    const parsedMetaEsperada = Number.parseInt(metaEsperada, 10);

    if (!name.trim()) {
      setError('No se encontro el nombre del objetivo.');
      return;
    }

    if (habitIds.length === 0) {
      setError('No se encontraron habitos seleccionados.');
      return;
    }

    if (!Number.isInteger(parsedMetaEsperada) || parsedMetaEsperada < 1) {
      setError('La cantidad debe ser un numero entero mayor o igual a 1.');
      return;
    }

    if (!isValidDate(fechaLimite)) {
      setError('La fecha limite debe tener formato YYYY-MM-DD.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (objectiveLocalId) {
        await updateObjetivo({
          localId: objectiveLocalId,
          habitoLocalIds: habitIds,
          nombre: name,
          metaEsperada: parsedMetaEsperada,
          fechaLimite,
        });
      } else {
        await createObjetivo({
          userRemoteId: user?.id ?? null,
          metaLocalId,
          habitoLocalIds: habitIds,
          nombre: name,
          metaEsperada: parsedMetaEsperada,
          fechaLimite,
        });
      }

      if (token && user) {
        await syncObjetivos(token, user.id);
      }

      await refreshStatus();
      router.replace({
        pathname: '/metas/[metaId]/plan',
        params: { metaId: metaLocalId },
      });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo guardar el objetivo.');
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDeleteObjective() {
    Alert.alert('Eliminar objetivo', '¿Seguro que queres eliminar este objetivo?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void handleDeleteObjective();
        },
      },
    ]);
  }

  async function handleDeleteObjective() {
    if (!objectiveLocalId) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await deleteObjetivo(objectiveLocalId);

      if (token && user) {
        await syncObjetivos(token, user.id);
      }

      await refreshStatus();
      router.replace({
        pathname: '/metas/[metaId]/plan',
        params: { metaId: metaLocalId },
      });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el objetivo.');
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
                  <MaterialDesignIcons name="calendar-check-outline" size={16} color="#FFFFFF" />
                </View>

                <ThemedText style={styles.headerTitle}>{objectiveLocalId ? 'Editar Objetivo' : 'Define tu Objetivo'}</ThemedText>
              </View>

              <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
                {metaNombre ? `Meta: ${metaNombre}` : 'Paso 3 de 3'}
              </ThemedText>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <ThemedText themeColor="textSecondary" style={styles.stepText}>
            Paso 3 de 3 · Repeticiones y fecha limite
          </ThemedText>

          <View style={styles.formCard}>
            <View style={styles.summaryCard}>
              <ThemedText>{name}</ThemedText>
              <ThemedText themeColor="textSecondary">{`${habitIds.length} habitos asociados`}</ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.floatingLabel,
                  {
                    color: quantityFocused || metaEsperada.trim().length > 0 ? '#E4E4E7' : '#A1A1AA',
                    transform: [
                      {
                        translateY: quantityLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 2],
                        }),
                      },
                      {
                        scale: quantityLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.78],
                        }),
                      },
                    ],
                  },
                ]}>
                Cantidad de veces
              </Animated.Text>

              <TextInput
                ref={quantityInputRef}
                style={styles.input}
                value={metaEsperada}
                onChangeText={setMetaEsperada}
                onFocus={() => setQuantityFocused(true)}
                onBlur={() => setQuantityFocused(false)}
                keyboardType="number-pad"
              />

              <View style={styles.inputLineBase} />
              <Animated.View
                style={[
                  styles.inputLineActive,
                  {
                    opacity: quantityUnderlineAnimation,
                    transform: [
                      {
                        scaleX: quantityUnderlineAnimation.interpolate({
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
                    color: dateFocused || fechaLimite.trim().length > 0 ? '#E4E4E7' : '#A1A1AA',
                    transform: [
                      {
                        translateY: dateLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 2],
                        }),
                      },
                      {
                        scale: dateLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.78],
                        }),
                      },
                    ],
                  },
                ]}>
                Fecha limite
              </Animated.Text>

              <TextInput
                style={styles.input}
                value={fechaLimite}
                onChangeText={setFechaLimite}
                onFocus={() => setDateFocused(true)}
                onBlur={() => setDateFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.inputLineBase} />
              <Animated.View
                style={[
                  styles.inputLineActive,
                  {
                    opacity: dateUnderlineAnimation,
                    transform: [
                      {
                        scaleX: dateUnderlineAnimation.interpolate({
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
              onPress={handleCreateObjective}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}>
              <ThemedText style={styles.buttonText}>
                {submitting ? 'Guardando...' : objectiveLocalId ? 'Guardar cambios' : 'Guardar objetivo'}
              </ThemedText>
            </Pressable>

            {objectiveLocalId ? (
              <Pressable
                disabled={submitting}
                onPress={confirmDeleteObjective}
                style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}>
                <ThemedText style={styles.deleteButtonText}>Eliminar objetivo</ThemedText>
              </Pressable>
            ) : null}
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
  stepText: {
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
  summaryCard: {
    gap: 4,
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#1E1E24',
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
  deleteButton: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    backgroundColor: '#2A1114',
    alignItems: 'center',
    justifyContent: 'center',
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
