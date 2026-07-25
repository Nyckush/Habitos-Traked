import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';

export default function ProfileEditScreen() {
  const { user, updateProfile } = useAuth();
  const usernameInputRef = useRef<TextInput>(null);
  const [username, setUsername] = useState(user?.username ?? '');
  const [perfil, setPerfil] = useState(user?.perfil ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [perfilFocused, setPerfilFocused] = useState(false);
  const [usernameLabelAnimation] = useState(() => new Animated.Value((user?.username ?? '').trim().length > 0 ? 1 : 0));
  const [perfilLabelAnimation] = useState(() => new Animated.Value((user?.perfil ?? '').trim().length > 0 ? 1 : 0));
  const [usernameUnderlineAnimation] = useState(() => new Animated.Value(0));
  const [perfilUnderlineAnimation] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const timerId = setTimeout(() => {
      usernameInputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timerId);
  }, []);

  useEffect(() => {
    Animated.timing(usernameLabelAnimation, {
      toValue: usernameFocused || username.trim().length > 0 ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [username, usernameFocused, usernameLabelAnimation]);

  useEffect(() => {
    Animated.timing(perfilLabelAnimation, {
      toValue: perfilFocused || perfil.trim().length > 0 ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [perfil, perfilFocused, perfilLabelAnimation]);

  useEffect(() => {
    Animated.timing(usernameUnderlineAnimation, {
      toValue: usernameFocused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [usernameFocused, usernameUnderlineAnimation]);

  useEffect(() => {
    Animated.timing(perfilUnderlineAnimation, {
      toValue: perfilFocused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [perfilFocused, perfilUnderlineAnimation]);

  async function handleSaveProfile() {
    if (!username.trim()) {
      setError('Escribi un username.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await updateProfile({
        username,
        perfil: perfil.trim() || null,
      });

      router.replace('/profile');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar el perfil.');
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
              onPress={() => router.replace('/profile')}
              hitSlop={12}
              style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
              <ThemedText style={styles.backButtonText}>{'<'}</ThemedText>
            </Pressable>

            <View style={styles.headerTitleBlock}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerTitleIcon}>
                  <MaterialDesignIcons name="account-edit-outline" size={16} color="#FFFFFF" />
                </View>

                <ThemedText style={styles.headerTitle}>Editar Perfil</ThemedText>
              </View>

              <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
                Modifica username y foto de perfil
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
                    color: usernameFocused || username.trim().length > 0 ? '#E4E4E7' : '#A1A1AA',
                    transform: [
                      {
                        translateY: usernameLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 2],
                        }),
                      },
                      {
                        scale: usernameLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.78],
                        }),
                      },
                    ],
                  },
                ]}>
                Username
              </Animated.Text>

              <TextInput
                ref={usernameInputRef}
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                onFocus={() => setUsernameFocused(true)}
                onBlur={() => setUsernameFocused(false)}
              />

              <View style={styles.inputLineBase} />
              <Animated.View
                style={[
                  styles.inputLineActive,
                  {
                    opacity: usernameUnderlineAnimation,
                    transform: [
                      {
                        scaleX: usernameUnderlineAnimation.interpolate({
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
                    color: perfilFocused || perfil.trim().length > 0 ? '#E4E4E7' : '#A1A1AA',
                    transform: [
                      {
                        translateY: perfilLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 2],
                        }),
                      },
                      {
                        scale: perfilLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.78],
                        }),
                      },
                    ],
                  },
                ]}>
                Foto de perfil URL
              </Animated.Text>

              <TextInput
                style={styles.input}
                value={perfil}
                onChangeText={setPerfil}
                onFocus={() => setPerfilFocused(true)}
                onBlur={() => setPerfilFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.inputLineBase} />
              <Animated.View
                style={[
                  styles.inputLineActive,
                  {
                    opacity: perfilUnderlineAnimation,
                    transform: [
                      {
                        scaleX: perfilUnderlineAnimation.interpolate({
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
              onPress={handleSaveProfile}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}>
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
    marginTop: 24,
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
