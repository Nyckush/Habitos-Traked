import { DATABASE_NAME, DATABASE_VERSION } from './schema';

export type AppDatabase = {
  runAsync: (sql: string, params?: unknown[]) => Promise<void>;
  getFirstAsync: <T>(sql: string, params?: unknown[]) => Promise<T | null>;
  getAllAsync: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
};

type UserRow = {
  local_id: string;
  remote_id: number | null;
  nombre: string;
  email: string;
  created_at: string | null;
  updated_at: string | null;
  sync_status: string;
};

type WebDatabaseState = {
  app_meta: Record<string, string>;
  users: Record<string, UserRow>;
  habitos: Record<string, HabitoRow>;
  syncQueueCount: number;
};

type HabitoRow = {
  local_id: string;
  remote_id: number | null;
  user_remote_id: number | null;
  titulo: string;
  descripcion: string | null;
  estado: string;
  frecuencia: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  sync_status: string;
};

const STORAGE_KEY = 'habitracked.web.db';

function loadState(): WebDatabaseState {
  if (typeof window === 'undefined') {
    return { app_meta: {}, users: {}, habitos: {}, syncQueueCount: 0 };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return { app_meta: {}, users: {}, habitos: {}, syncQueueCount: 0 };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WebDatabaseState>;

    return {
      app_meta: parsed.app_meta ?? {},
      users: parsed.users ?? {},
      habitos: parsed.habitos ?? {},
      syncQueueCount: parsed.syncQueueCount ?? 0,
    };
  } catch {
    return { app_meta: {}, users: {}, habitos: {}, syncQueueCount: 0 };
  }
}

function saveState(state: WebDatabaseState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const webDatabase: AppDatabase = {
  async runAsync(sql: string, params: unknown[] = []) {
    const normalizedSql = sql.replace(/\s+/g, ' ').trim().toUpperCase();
    const state = loadState();

    if (normalizedSql.startsWith('INSERT INTO USERS')) {
      const [localId, remoteId, nombre, email, createdAt, updatedAt] = params as [
        string,
        number | null,
        string,
        string,
        string | null,
        string | null,
      ];

      state.users[localId] = {
        local_id: localId,
        remote_id: remoteId,
        nombre,
        email,
        created_at: createdAt,
        updated_at: updatedAt,
        sync_status: 'synced',
      };

      saveState(state);
      return;
    }

    if (normalizedSql.startsWith('INSERT INTO HABITOS')) {
      const [
        localId,
        remoteId,
        userRemoteId,
        titulo,
        descripcion,
        estado,
        frecuencia,
        createdAt,
        updatedAt,
        deletedAt,
        syncStatus,
      ] = params as [
        string,
        number | null,
        number | null,
        string,
        string | null,
        string,
        string | null,
        string | null,
        string | null,
        string | null,
        string,
      ];

      state.habitos[localId] = {
        local_id: localId,
        remote_id: remoteId,
        user_remote_id: userRemoteId,
        titulo,
        descripcion,
        estado,
        frecuencia,
        created_at: createdAt,
        updated_at: updatedAt,
        deleted_at: deletedAt,
        sync_status: syncStatus,
      };

      saveState(state);
      return;
    }

    if (normalizedSql.startsWith('INSERT INTO APP_META')) {
      const [key, value] = params as [string, string];
      state.app_meta[key] = value;
      saveState(state);
      return;
    }

    if (normalizedSql.startsWith('DELETE FROM APP_META')) {
      const [key] = params as [string];
      delete state.app_meta[key];
      saveState(state);
    }
  },

  async getFirstAsync<T>(sql: string, params: unknown[] = []) {
    const normalizedSql = sql.replace(/\s+/g, ' ').trim().toUpperCase();
    const state = loadState();

    if (normalizedSql === 'SELECT COUNT(*) AS COUNT FROM USERS;') {
      return { count: Object.keys(state.users).length } as T;
    }

    if (normalizedSql === 'SELECT COUNT(*) AS COUNT FROM HABITOS;') {
      return { count: Object.values(state.habitos).filter((item) => !item.deleted_at).length } as T;
    }

    if (normalizedSql === 'SELECT COUNT(*) AS COUNT FROM SYNC_QUEUE;') {
      return { count: state.syncQueueCount } as T;
    }

    if (normalizedSql.startsWith('SELECT VALUE FROM APP_META WHERE KEY =')) {
      const [key] = params as unknown as [string];
      return (state.app_meta[key] ? { value: state.app_meta[key] } : null) as T | null;
    }

    if (normalizedSql.includes('FROM USERS') && normalizedSql.includes('WHERE LOCAL_ID =')) {
      const [localId] = params as unknown as [string];
      return (state.users[localId] ?? null) as T | null;
    }

    return null;
  },

  async getAllAsync<T>(sql: string) {
    const normalizedSql = sql.replace(/\s+/g, ' ').trim().toUpperCase();
    const state = loadState();

    if (normalizedSql.includes('FROM HABITOS')) {
      return Object.values(state.habitos)
        .filter((item) => !item.deleted_at)
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')) as T[];
    }

    return [];
  },
};

export async function getDatabase(): Promise<AppDatabase> {
  return webDatabase;
}

export async function getDatabaseStatus() {
  const state = loadState();

  return {
    name: `${DATABASE_NAME} (web)`,
    version: DATABASE_VERSION,
    usersCount: Object.keys(state.users).length,
    habitsCount: Object.values(state.habitos).filter((item) => !item.deleted_at).length,
    queueCount: state.syncQueueCount,
  };
}
