import * as ImagePicker from 'expo-image-picker';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';

function getInitial(username: string | null | undefined): string {
  const normalized = username?.trim() ?? '';

  return normalized.length > 0 ? normalized[0]!.toUpperCase() : 'U';
}

async function optimizeProfileImage(
  asset: Pick<ImagePicker.ImagePickerAsset, 'uri' | 'width' | 'height'>,
): Promise<string> {
  const cropSize = Math.min(asset.width, asset.height);
  const originX = Math.max(0, Math.floor((asset.width - cropSize) / 2));
  const originY = Math.max(0, Math.floor((asset.height - cropSize) / 2));

  const result = await manipulateAsync(
    asset.uri,
    [
      {
        crop: {
          originX,
          originY,
          width: cropSize,
          height: cropSize,
        },
      },
      {
        resize: {
          width: 512,
          height: 512,
        },
      },
    ],
    {
      compress: 0.7,
      format: SaveFormat.JPEG,
    },
  );

  return result.uri;
}

export default function ProfileEditScreen() {
  const { user, updateProfile } = useAuth();
  const usernameInputRef = useRef<TextInput>(null);
  const [username, setUsername] = useState(user?.username ?? '');
  const [perfil, setPerfil] = useState(user?.perfil ?? null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);

  useEffect(() => {
    const timerId = setTimeout(() => {
      usernameInputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timerId);
  }, []);

  async function handlePickImage() {
    try {
      setPickingImage(true);
      setError(null);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setError('Necesitamos permiso para abrir tu galeria.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      const optimizedUri = await optimizeProfileImage(result.assets[0]);
      setPerfil(optimizedUri);
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : 'No se pudo abrir la galeria.');
    } finally {
      setPickingImage(false);
    }
  }

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
        perfil,
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
              onPress={() => router.back()}
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
                Cambia tu username y elige una foto desde la galeria
              </ThemedText>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.formCard}>
            <View style={styles.avatarSection}>
              {perfil ? (
                <Image source={{ uri: perfil }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <ThemedText style={styles.avatarFallbackText}>{getInitial(username)}</ThemedText>
                </View>
              )}

              <View style={styles.avatarActions}>
                <Pressable
                  disabled={submitting || pickingImage}
                  onPress={() => void handlePickImage()}
                  style={({ pressed }) => [
                    styles.button,
                    styles.secondaryCardButton,
                    pressed && styles.buttonPressed,
                    (submitting || pickingImage) && styles.buttonDisabled,
                  ]}>
                  <MaterialDesignIcons name="image-outline" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.buttonText}>
                    {pickingImage ? 'Abriendo galeria...' : 'Elegir foto'}
                  </ThemedText>
                </Pressable>

                {perfil ? (
                  <Pressable
                    disabled={submitting || pickingImage}
                    onPress={() => setPerfil(null)}
                    style={({ pressed }) => [
                      styles.removeButton,
                      pressed && styles.buttonPressed,
                      (submitting || pickingImage) && styles.buttonDisabled,
                    ]}>
                    <MaterialDesignIcons name="trash-can-outline" size={18} color="#FCA5A5" />
                    <ThemedText style={styles.removeButtonText}>Quitar foto</ThemedText>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText themeColor="textSecondary" style={styles.inputLabel}>
                Username
              </ThemedText>

              <TextInput
                ref={usernameInputRef}
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Tu username"
                placeholderTextColor="#71717A"
              />
            </View>

            {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

            <Pressable
              disabled={submitting || pickingImage}
              onPress={handleSaveProfile}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                (submitting || pickingImage) && styles.buttonDisabled,
              ]}>
              <ThemedText style={styles.buttonText}>
                {submitting ? 'Guardando...' : 'Guardar cambios'}
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
    marginTop: 24,
    gap: 18,
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#18181B',
  },
  avatarSection: {
    alignItems: 'center',
    gap: 14,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: '#0A0A0C',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  avatarFallback: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: '#0A0A0C',
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarActions: {
    width: '100%',
    gap: 10,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 10,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    backgroundColor: '#111115',
    fontSize: 16,
  },
  button: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  secondaryCardButton: {
    borderWidth: 1,
    borderColor: '#27272A',
  },
  removeButton: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    backgroundColor: '#2A1114',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  removeButtonText: {
    color: '#FCA5A5',
    fontWeight: '700',
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
