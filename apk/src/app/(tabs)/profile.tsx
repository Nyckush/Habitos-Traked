import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';

function getInitial(username: string | null | undefined): string {
  const normalized = username?.trim() ?? '';

  return normalized.length > 0 ? normalized[0]!.toUpperCase() : 'U';
}

export default function ProfileScreen() {
  const { token, user, signOut } = useAuth();
  const profileUri = user?.perfil ?? null;
  const username = user?.username ?? 'Usuario local';
  const email = user?.email ?? 'Sin email';
  const isAuthenticated = Boolean(token && user);

  async function handleSignOut() {
    await signOut();
    router.replace('/profile');
  }



  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <MaterialDesignIcons name="account-circle-outline" size={18} color="#FFFFFF" />
            </View>

            <ThemedText style={styles.title}>Perfil</ThemedText>
          </View>

          <View style={styles.profileCard}>
            {isAuthenticated ? (
              <>
                {profileUri ? (
                  <Image source={{ uri: profileUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <ThemedText style={styles.avatarFallbackText}>{getInitial(username)}</ThemedText>
                  </View>
                )}

                <View style={styles.profileInfo}>
                  <ThemedText style={styles.username}>{username}</ThemedText>
                  <ThemedText themeColor="textSecondary">{email}</ThemedText>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable onPress={() => router.push('/profile/edit')} style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}>
                    <MaterialDesignIcons name="pencil-outline" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.editButtonText}>Editar</ThemedText>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={styles.authCard}>
                <View style={styles.authIcon}>
                  <MaterialDesignIcons name="account-circle-outline" size={38} color="#FFFFFF" />
                </View>

                <ThemedText style={styles.authTitle}>Accede a tu perfil</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.authSubtitle}>
                  Inicia sesion o crea una cuenta para sincronizar tus datos entre la web y la APK.
                </ThemedText>

                <View style={styles.authActions}>
                  <Pressable onPress={() => router.push('/auth/login')} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
                    <ThemedText style={styles.primaryButtonText}>Iniciar sesion</ThemedText>
                  </Pressable>

                  <Pressable onPress={() => router.push('/auth/register')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
                    <ThemedText style={styles.secondaryButtonText}>Crear cuenta</ThemedText>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {isAuthenticated ? (
            <View style={styles.footerActions}>
           
              <Pressable onPress={() => void handleSignOut()} style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
                <ThemedText style={styles.secondaryButtonText}>Cerrar sesion</ThemedText>
              </Pressable>
                 <Pressable onPress={() => router.push('/profile/notifications')} style={({ pressed }) => [styles.editButton, styles.notificationsButton, pressed && styles.buttonPressed]}>
                <MaterialDesignIcons name="bell-outline" size={16} color="#FFFFFF" />
                <ThemedText style={styles.editButtonText}>Notificaciones</ThemedText>
              </Pressable>
            </View>
          ) : null}
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  titleIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  profileCard: {
    marginTop: 24,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 999,
    backgroundColor: '#18181B',
  },
  avatarFallback: {
    width: 104,
    height: 104,
    borderRadius: 999,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  actionsRow: {
    marginTop: 12,
    alignItems: 'flex-start',
    gap: 10,
  },
  authCard: {
    flex: 1,
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  authIcon: {
    width: 104,
    height: 104,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  authSubtitle: {
    textAlign: 'center',
    maxWidth: 300,
  },
  authActions: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 999,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#E4E4E7',
    fontWeight: '700',
  },
  editButton: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#27272A',
    backgroundColor: '#1E1E24',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  footerActions: {
    marginTop: 16,
    gap: 12,
  },
  notificationsButton: {
    alignSelf: 'flex-start',
  },
  infoCard: {
    paddingTop: 8,
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
