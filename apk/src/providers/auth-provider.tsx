import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { createContext, type PropsWithChildren, use, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { clearCurrentAuthUser, getCurrentAuthUser, setCurrentAuthUser } from '@/database';
import { authApi, type AuthUser, type LoginPayload, type RegisterPayload } from '@/services';

type AuthContextValue = {
  isLoading: boolean;
  token: string | null;
  user: AuthUser | null;
  signIn: (payload: LoginPayload) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
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

    await persistSession(response.token, response.user);
  }

  async function signUp(payload: RegisterPayload) {
    const response = await authApi.register({
      ...payload,
      device_name: payload.device_name ?? getDeviceName(),
    });

    await persistSession(response.token, response.user);
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
    await clearCurrentAuthUser();
    setToken(null);
    setUser(null);
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
