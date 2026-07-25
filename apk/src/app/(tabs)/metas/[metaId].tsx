import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMetaById, updateMeta } from '@/database';
import { useAuth } from '@/providers/auth-provider';
import { useDatabase } from '@/providers/database-provider';
import { syncMetas } from '@/services/goals-sync';

export default function MetaEditScreen() {
  const { metaId } = useLocalSearchParams<{ metaId?: string }>();
  const { token, user } = useAuth();
  const { refreshStatus } = useDatabase();
  const inputRef = useRef<TextInput>(null);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [labelAnimation] = useState(() => new Animated.Value(0));
  const [underlineAnimation] = useState(() => new Animated.Value(0));

  const metaLocalId = typeof metaId === 'string' ? metaId : '';

  const loadMeta = useCallback(async () => {
    if (!metaLocalId) {
      setError('No se encontro la meta.');
      setLoading(false);
      return;
    }

    const meta = await getMetaById(metaLocalId);

    if (!meta) {
      setError('No se encontro la meta.');
      setLoading(false);
      return;
    }

    setNombre(meta.nombre);
    setLoading(false);
  }, [metaLocalId]);

  useFocusEffect(
    useCallback(() => {
      void loadMeta();

      const timerId = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      return () => clearTimeout(timerId);
    }, [loadMeta]),
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

  async function handleSaveMeta() {
    if (!metaLocalId) {
      setError('No se encontro la meta.');
      return;
    }

    if (!nombre.trim()) {
      setError('Escribi un nombre para la meta.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await updateMeta({
        localId: metaLocalId,
        nombre,
      });

      if (token && user) {
        await syncMetas(token, user.id);
      }

      await refreshStatus();
      router.replace('/metas');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar la meta.');
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
              onPress={() => router.replace('/metas')}
              hitSlop={12}
              style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
              <ThemedText style={styles.backButtonText}>{'<'}</ThemedText>
            </Pressable>

            <View style={styles.headerTitleBlock}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerTitleIcon}>
                  <MaterialDesignIcons name="trophy-outline" size={16} color="#FFFFFF" />
                </View>

                <ThemedText style={styles.headerTitle}>Editar Meta</ThemedText>
              </View>

              <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
                Actualiza el nombre de tu meta
              </ThemedText>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.formCard}>
            {loading ? (
              <ThemedText themeColor="textSecondary">Cargando meta...</ThemedText>
            ) : (
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
                  Meta
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
            )}

            {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

            <Pressable
              disabled={submitting || loading}
              onPress={handleSaveMeta}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, (submitting || loading) && styles.buttonDisabled]}>
              <ThemedText style={styles.buttonText}>{submitting ? 'Guardando...' : 'Guardar cambios'}</ThemedText>
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
