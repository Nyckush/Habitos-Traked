import { createContext, type PropsWithChildren, use, useEffect, useState } from 'react';

import { getDatabase, getDatabaseStatus } from '@/database';

type DatabaseStatus = {
  name: string;
  version: number;
  usersCount: number;
  habitsCount: number;
  queueCount: number;
};

type DatabaseContextValue = {
  isReady: boolean;
  error: string | null;
  status: DatabaseStatus | null;
  refreshStatus: () => Promise<void>;
};

const DatabaseContext = createContext<DatabaseContextValue | undefined>(undefined);

export function DatabaseProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<DatabaseStatus | null>(null);

  async function refreshStatus() {
    const nextStatus = await getDatabaseStatus();
    setStatus(nextStatus);
  }

  useEffect(() => {
    let mounted = true;

    async function bootstrapDatabase() {
      try {
        await getDatabase();
        const nextStatus = await getDatabaseStatus();

        if (!mounted) {
          return;
        }

        setStatus(nextStatus);
        setIsReady(true);
      } catch (databaseError) {
        if (!mounted) {
          return;
        }

        setError(
          databaseError instanceof Error
            ? databaseError.message
            : 'No se pudo inicializar la base local.',
        );
      }
    }

    bootstrapDatabase();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DatabaseContext.Provider
      value={{
        isReady,
        error,
        status,
        refreshStatus,
      }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = use(DatabaseContext);

  if (!context) {
    throw new Error('useDatabase debe usarse dentro de DatabaseProvider.');
  }

  return context;
}
