import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { createContext, type PropsWithChildren, use, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import {
  clearCurrentAuthUser,
  clearLocalDomainData,
  getCurrentAuthUser,
  setCurrentAuthUser,
  updateCurrentAuthUser,
} from '@/database';
import {
  ApiError,
  authApi,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from '@/services';
import { pullGoals, syncGoals } from '@/services/goals-sync';
import { pullHabits, syncHabits } from '@/services/habits-sync';
import { pullHabitRecords, syncHabitRecords } from '@/services/habit-records-sync';
import { clearScheduledNotificationsAsync, syncScheduledNotificationsAsync } from '@/services/notifications';
import { pullRoutineHabitLinks, syncRoutineHabitLinks } from '@/services/routine-habit-links-sync';
import { pullRoutines, syncRoutines } from '@/services/routines-sync';
import { pullTasks, syncTasks } from '@/services/tasks-sync';

type AuthContextValue = {
  isLoading: boolean;
  token: string | null;
  user: AuthUser | null;
  signIn: (payload: LoginPayload) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (payload: { username: string; perfil: string | null }) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'habitracked.auth.token';
const shouldUseSecureStore =
  Platform.OS !== 'web' &&
  typeof SecureStore.getItemAsync === 'function' &&
  typeof SecureStore.setItemAsync === 'function' &&
  typeof SecureStore.deleteItemAsync === 'function';

function getDeviceName(): string {
  return Constants.deviceName ?? 'apk';
}

function mergeAuthUserWithLocalProfile(remoteUser: AuthUser, localUser: AuthUser | null): AuthUser {
  if (!localUser || localUser.id !== remoteUser.id) {
    return remoteUser;
  }

  return {
    ...remoteUser,
    username: localUser.username?.trim() ? localUser.username : remoteUser.username,
    perfil: localUser.perfil?.trim() ? localUser.perfil : remoteUser.perfil,
  };
}

async function getStoredToken(): Promise<string | null> {
  if (shouldUseSecureStore) {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.localStorage.getItem(TOKEN_KEY);
  }

  return null;
}

async function setStoredToken(token: string): Promise<void> {
  if (shouldUseSecureStore) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

async function deleteStoredToken(): Promise<void> {
  if (shouldUseSecureStore) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let mounted = true;

    async function hydrateSession() {
      try {
        const storedToken = await getStoredToken();

        if (!storedToken) {
          const localUser = await getCurrentAuthUser();

          if (mounted) {
            setUser(localUser);
          }

          return;
        }

        const response = await authApi.me(storedToken);
        const localUser = await getCurrentAuthUser();
        const nextUser = mergeAuthUserWithLocalProfile(response.user, localUser);

        if (!mounted) {
          return;
        }

        setToken(storedToken);
        setUser(nextUser);
        await setCurrentAuthUser(nextUser);
        await pullHabits(storedToken, nextUser.id);
        await pullRoutines(storedToken, nextUser.id);
        await pullRoutineHabitLinks(storedToken);
        await pullHabitRecords(storedToken);
        await pullGoals(storedToken, nextUser.id);
        await pullTasks(storedToken, nextUser.id);
        await syncScheduledNotificationsAsync();
      } catch (error) {
        const storedToken = await getStoredToken();
        const localUser = await getCurrentAuthUser();
        const hasInvalidSession =
          error instanceof ApiError && (error.status === 401 || error.status === 403);

        if (!hasInvalidSession && storedToken && localUser) {
          if (!mounted) {
            return;
          }

          setToken(storedToken);
          setUser(localUser);
          return;
        }

        await deleteStoredToken();
        await clearCurrentAuthUser();

        if (!mounted) {
          return;
        }

        setToken(null);
        setUser(null);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    hydrateSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function persistSession(nextToken: string, nextUser: AuthUser) {
    await setStoredToken(nextToken);
    await setCurrentAuthUser(nextUser);
    setToken(nextToken);
    setUser(nextUser);
  }

  async function signIn(payload: LoginPayload) {
    const response = await authApi.login({
      ...payload,
      device_name: payload.device_name ?? getDeviceName(),
    });

    await clearLocalDomainData();
    await persistSession(response.token, response.user);
    await pullHabits(response.token, response.user.id);
    await pullRoutines(response.token, response.user.id);
    await pullRoutineHabitLinks(response.token);
    await pullHabitRecords(response.token);
    await pullGoals(response.token, response.user.id);
    await pullTasks(response.token, response.user.id);
    await syncScheduledNotificationsAsync();
  }

  async function signUp(payload: RegisterPayload) {
    const response = await authApi.register({
      ...payload,
      device_name: payload.device_name ?? getDeviceName(),
    });

    await persistSession(response.token, response.user);
    await syncHabits(response.token, response.user.id);
    await syncRoutines(response.token, response.user.id);
    await syncRoutineHabitLinks(response.token);
    await syncHabitRecords(response.token);
    await syncGoals(response.token, response.user.id);
    await syncTasks(response.token, response.user.id);
    await syncScheduledNotificationsAsync();
  }

  async function signOut() {
    const currentToken = token;

    if (currentToken) {
      try {
        await authApi.logout(currentToken);
      } catch {
        // We still clear the local session even if the remote logout fails.
      }
    }

    await deleteStoredToken();
    await clearScheduledNotificationsAsync();
    await clearLocalDomainData();
    await clearCurrentAuthUser();
    setToken(null);
    setUser(null);
  }

  async function updateProfile(payload: { username: string; perfil: string | null }) {
    const shouldUploadNewProfilePhoto =
      Boolean(payload.perfil) &&
      (payload.perfil.startsWith('file://') || payload.perfil.startsWith('content://'));
    const shouldRemoveRemoteProfilePhoto = payload.perfil === null && Boolean(user?.perfil);

    const nextUser =
      token && user
        ? (
            await authApi.updateProfile(token, {
              username: payload.username,
              perfilUri: shouldUploadNewProfilePhoto ? payload.perfil : null,
              removeProfilePhoto: shouldRemoveRemoteProfilePhoto,
            })
          ).user
        : await updateCurrentAuthUser(payload);

    await setCurrentAuthUser(nextUser);
    setUser(nextUser);
  }

  async function refreshCurrentUser() {
    if (!token) {
      const localUser = await getCurrentAuthUser();
      setUser(localUser);
      return;
    }

    const response = await authApi.me(token);
    const localUser = await getCurrentAuthUser();
    const nextUser = mergeAuthUserWithLocalProfile(response.user, localUser);

    await setCurrentAuthUser(nextUser);
    setUser(nextUser);
  }

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        token,
        user,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshCurrentUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = use(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
}
