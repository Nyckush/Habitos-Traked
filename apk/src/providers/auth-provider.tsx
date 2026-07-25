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
import { authApi, type AuthUser, type LoginPayload, type RegisterPayload } from '@/services';
import { pullGoals, syncGoals } from '@/services/goals-sync';
import { pullHabits, syncHabits } from '@/services/habits-sync';
import { pullHabitRecords, syncHabitRecords } from '@/services/habit-records-sync';
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

        if (!mounted) {
          return;
        }

        setToken(storedToken);
        setUser(response.user);
        await pullHabits(storedToken, response.user.id);
        await pullRoutines(storedToken, response.user.id);
        await pullRoutineHabitLinks(storedToken);
        await pullHabitRecords(storedToken);
        await pullGoals(storedToken, response.user.id);
        await pullTasks(storedToken, response.user.id);
      } catch {
        const storedToken = await getStoredToken();
        const localUser = await getCurrentAuthUser();

        if (storedToken && localUser) {
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
    await clearLocalDomainData();
    await clearCurrentAuthUser();
    setToken(null);
    setUser(null);
  }

  async function updateProfile(payload: { username: string; perfil: string | null }) {
    const nextUser = await updateCurrentAuthUser(payload);
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
