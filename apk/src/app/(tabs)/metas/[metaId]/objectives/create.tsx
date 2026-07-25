import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMetaById } from '@/database';

function resolveParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export default function ObjectiveCreateNameScreen() {
  const { metaId, objectiveId, objectiveName, selectedHabitIds, metaEsperada, fechaLimite } = useLocalSearchParams<{
    metaId?: string | string[];
    objectiveId?: string | string[];
    objectiveName?: string | string[];
    selectedHabitIds?: string | string[];
    metaEsperada?: string | string[];
    fechaLimite?: string | string[];
  }>();
  const inputRef = useRef<TextInput>(null);
  const [metaNombre, setMetaNombre] = useState('');
  const [nombre, setNombre] = useState(resolveParam(objectiveName));
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [labelAnimation] = useState(() => new Animated.Value(resolveParam(objectiveName).trim().length > 0 ? 1 : 0));
  const [underlineAnimation] = useState(() => new Animated.Value(0));

  const metaLocalId = resolveParam(metaId);
  const objectiveLocalId = resolveParam(objectiveId);

  useFocusEffect(
    useCallback(() => {
      const timerId = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      return () => clearTimeout(timerId);
    }, []),
  );

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

  function handleContinue() {
    if (!nombre.trim()) {
      setError('Escribi un nombre para el objetivo.');
      return;
    }

    setError(null);
    router.push({
      pathname: '/metas/[metaId]/objectives/habits',
      params: {
        metaId: metaLocalId,
        objectiveId: objectiveLocalId,
        objectiveName: nombre.trim(),
        selectedHabitIds: resolveParam(selectedHabitIds),
        metaEsperada: resolveParam(metaEsperada),
        fechaLimite: resolveParam(fechaLimite),
      },
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() =>
                router.replace({
                  pathname: '/metas/[metaId]/plan',
                  params: { metaId: metaLocalId },
                })
              }
              hitSlop={12}
              style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
              <ThemedText style={styles.backButtonText}>{'<'}</ThemedText>
            </Pressable>

            <View style={styles.headerTitleBlock}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerTitleIcon}>
                  <MaterialDesignIcons name="target" size={16} color="#FFFFFF" />
                </View>

                <ThemedText style={styles.headerTitle}>{objectiveLocalId ? 'Editar Objetivo' : 'Crear Objetivo'}</ThemedText>
              </View>

              <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
                {metaNombre ? `Meta: ${metaNombre}` : 'Paso 1 de 3'}
              </ThemedText>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <ThemedText themeColor="textSecondary" style={styles.stepText}>
            Paso 1 de 3 · Nombre del objetivo
          </ThemedText>

          <View style={styles.formCard}>
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
                Objetivo
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

            <Pressable onPress={handleContinue} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
              <ThemedText style={styles.buttonText}>Continuar</ThemedText>
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
