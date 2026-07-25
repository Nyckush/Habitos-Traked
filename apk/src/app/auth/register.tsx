import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Link, Redirect, router } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';

export default function RegisterScreen() {
  const { isLoading, token, signUp } = useAuth();
  const usernameInputRef = useRef<TextInput>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordConfirmationFocused, setPasswordConfirmationFocused] = useState(false);
  const [usernameLabelAnimation] = useState(() => new Animated.Value(0));
  const [emailLabelAnimation] = useState(() => new Animated.Value(0));
  const [passwordLabelAnimation] = useState(() => new Animated.Value(0));
  const [passwordConfirmationLabelAnimation] = useState(() => new Animated.Value(0));
  const [usernameUnderlineAnimation] = useState(() => new Animated.Value(0));
  const [emailUnderlineAnimation] = useState(() => new Animated.Value(0));
  const [passwordUnderlineAnimation] = useState(() => new Animated.Value(0));
  const [passwordConfirmationUnderlineAnimation] = useState(() => new Animated.Value(0));

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
    Animated.timing(emailLabelAnimation, {
      toValue: emailFocused || email.trim().length > 0 ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [email, emailFocused, emailLabelAnimation]);

  useEffect(() => {
    Animated.timing(passwordLabelAnimation, {
      toValue: passwordFocused || password.trim().length > 0 ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [password, passwordFocused, passwordLabelAnimation]);

  useEffect(() => {
    Animated.timing(passwordConfirmationLabelAnimation, {
      toValue: passwordConfirmationFocused || passwordConfirmation.trim().length > 0 ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [passwordConfirmation, passwordConfirmationFocused, passwordConfirmationLabelAnimation]);

  useEffect(() => {
    Animated.timing(usernameUnderlineAnimation, {
      toValue: usernameFocused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [usernameFocused, usernameUnderlineAnimation]);

  useEffect(() => {
    Animated.timing(emailUnderlineAnimation, {
      toValue: emailFocused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [emailFocused, emailUnderlineAnimation]);

  useEffect(() => {
    Animated.timing(passwordUnderlineAnimation, {
      toValue: passwordFocused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [passwordFocused, passwordUnderlineAnimation]);

  useEffect(() => {
    Animated.timing(passwordConfirmationUnderlineAnimation, {
      toValue: passwordConfirmationFocused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [passwordConfirmationFocused, passwordConfirmationUnderlineAnimation]);

  async function handleRegister() {
    if (!username.trim() || !email.trim() || !password.trim() || !passwordConfirmation.trim()) {
      setError('Completá todos los campos.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await signUp({
        username: username.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      router.replace('/home');
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'No se pudo crear la cuenta.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isLoading && token) {
    return <Redirect href="/home" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
                  <MaterialDesignIcons name="account-plus-outline" size={16} color="#FFFFFF" />
                </View>

                <ThemedText style={styles.headerTitle}>Crea tu cuenta</ThemedText>
              </View>

              <ThemedText themeColor="textSecondary" style={styles.headerSubtitle}>
                Empieza a sincronizar tus avances entre la APK y el backend
              </ThemedText>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.card}>
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
                autoCapitalize="words"
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
                    color: emailFocused || email.trim().length > 0 ? '#E4E4E7' : '#A1A1AA',
                    transform: [
                      {
                        translateY: emailLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 2],
                        }),
                      },
                      {
                        scale: emailLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.78],
                        }),
                      },
                    ],
                  },
                ]}>
                Email
              </Animated.Text>

              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />

              <View style={styles.inputLineBase} />
              <Animated.View
                style={[
                  styles.inputLineActive,
                  {
                    opacity: emailUnderlineAnimation,
                    transform: [
                      {
                        scaleX: emailUnderlineAnimation.interpolate({
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
                    color: passwordFocused || password.trim().length > 0 ? '#E4E4E7' : '#A1A1AA',
                    transform: [
                      {
                        translateY: passwordLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 2],
                        }),
                      },
                      {
                        scale: passwordLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.78],
                        }),
                      },
                    ],
                  },
                ]}>
                Contrasena
              </Animated.Text>

              <TextInput
                autoCapitalize="none"
                autoComplete="new-password"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />

              <View style={styles.inputLineBase} />
              <Animated.View
                style={[
                  styles.inputLineActive,
                  {
                    opacity: passwordUnderlineAnimation,
                    transform: [
                      {
                        scaleX: passwordUnderlineAnimation.interpolate({
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
                    color:
                      passwordConfirmationFocused || passwordConfirmation.trim().length > 0
                        ? '#E4E4E7'
                        : '#A1A1AA',
                    transform: [
                      {
                        translateY: passwordConfirmationLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 2],
                        }),
                      },
                      {
                        scale: passwordConfirmationLabelAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.78],
                        }),
                      },
                    ],
                  },
                ]}>
                Confirmar contrasena
              </Animated.Text>

              <TextInput
                autoCapitalize="none"
                autoComplete="new-password"
                secureTextEntry
                style={styles.input}
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                onFocus={() => setPasswordConfirmationFocused(true)}
                onBlur={() => setPasswordConfirmationFocused(false)}
              />

              <View style={styles.inputLineBase} />
              <Animated.View
                style={[
                  styles.inputLineActive,
                  {
                    opacity: passwordConfirmationUnderlineAnimation,
                    transform: [
                      {
                        scaleX: passwordConfirmationUnderlineAnimation.interpolate({
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
              onPress={handleRegister}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                submitting && styles.buttonDisabled,
              ]}>
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ThemedText style={styles.buttonText}>Registrarme</ThemedText>
              )}
            </Pressable>

            <Link href="/auth/login" replace style={styles.link}>
              <ThemedText style={styles.linkText}>Ya tengo cuenta</ThemedText>
            </Link>
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
  card: {
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
    borderRadius: 12,
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
    fontWeight: 700,
  },
  errorText: {
    color: '#DC2626',
  },
  link: {
    alignSelf: 'center',
  },
  linkText: {
    color: '#E4E4E7',
    fontWeight: '700',
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
