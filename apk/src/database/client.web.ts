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
  rutinas: Record<string, RutinaRow>;
  rutinaHabitos: Record<string, RutinaHabitoRow>;
  rutinaDias: Record<string, RutinaDiaRow>;
  registroHabitos: Record<string, RegistroHabitoRow>;
  actividadHabitos: Record<string, ActividadHabitoRow>;
  metas: Record<string, MetaRow>;
  objetivos: Record<string, ObjetivoRow>;
  syncQueueCount: number;
};

type HabitoRow = {
  local_id: string;
  remote_id: number | null;
  user_remote_id: number | null;
  nombre: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  sync_status: string;
};

type RutinaRow = {
  local_id: string;
  remote_id: number | null;
  user_remote_id: number | null;
  nombre: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  sync_status: string;
};

type RutinaHabitoRow = {
  local_id: string;
  remote_id: number | null;
  rutina_local_id: string;
  habito_local_id: string;
  hora_inicio: string | null;
  sync_status: string;
};

type RutinaDiaRow = {
  local_id: string;
  remote_id: number | null;
  rutina_local_id: string;
  dia_semana: string;
  sync_status: string;
};

type RegistroHabitoRow = {
  local_id: string;
  remote_id: number | null;
  habito_local_id: string;
  fecha: string;
  completado: 0 | 1;
  observacion: string | null;
  created_at: string | null;
  updated_at: string | null;
  sync_status: string;
};

type ActividadHabitoRow = {
  local_id: string;
  remote_id: number | null;
  habito_local_id: string;
  nombre: string;
  created_at: string | null;
  updated_at: string | null;
  sync_status: string;
};

type MetaRow = {
  local_id: string;
  remote_id: number | null;
  user_remote_id: number | null;
  nombre: string;
  fecha_inicio: string | null;
  created_at: string | null;
  updated_at: string | null;
  sync_status: string;
};

type ObjetivoRow = {
  local_id: string;
  remote_id: number | null;
  user_remote_id: number | null;
  meta_local_id: string | null;
  habito_local_id: string;
  nombre: string;
  meta_esperada: number;
  fecha_limite: string;
  created_at: string | null;
  updated_at: string | null;
  sync_status: string;
};

const STORAGE_KEY = 'habitracked.web.db';

function loadState(): WebDatabaseState {
  if (typeof window === 'undefined') {
    return { app_meta: {}, users: {}, habitos: {}, rutinas: {}, rutinaHabitos: {}, rutinaDias: {}, registroHabitos: {}, actividadHabitos: {}, metas: {}, objetivos: {}, syncQueueCount: 0 };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return { app_meta: {}, users: {}, habitos: {}, rutinas: {}, rutinaHabitos: {}, rutinaDias: {}, registroHabitos: {}, actividadHabitos: {}, metas: {}, objetivos: {}, syncQueueCount: 0 };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WebDatabaseState>;
    const habitos = Object.fromEntries(
      Object.entries(parsed.habitos ?? {}).map(([key, value]) => {
        const legacyHabit = value as HabitoRow & { titulo?: string };

        return [
          key,
          {
            ...legacyHabit,
            nombre: legacyHabit.nombre ?? legacyHabit.titulo ?? '',
          } satisfies HabitoRow,
        ];
      }),
    );
    const metas = Object.fromEntries(
      Object.entries((parsed as Partial<WebDatabaseState> & { metas?: Record<string, MetaRow & { titulo?: string }> }).metas ?? {}).map(
        ([key, value]) => [
          key,
          {
            ...value,
            nombre: value.nombre ?? value.titulo ?? '',
          } satisfies MetaRow,
        ],
      ),
    );

    return {
      app_meta: parsed.app_meta ?? {},
      users: parsed.users ?? {},
      habitos,
      rutinas: parsed.rutinas ?? {},
      rutinaHabitos: parsed.rutinaHabitos ?? {},
      rutinaDias: parsed.rutinaDias ?? {},
      registroHabitos: parsed.registroHabitos ?? {},
      actividadHabitos: parsed.actividadHabitos ?? {},
      metas,
      objetivos: parsed.objetivos ?? {},
      syncQueueCount: parsed.syncQueueCount ?? 0,
    };
  } catch {
    return { app_meta: {}, users: {}, habitos: {}, rutinas: {}, rutinaHabitos: {}, rutinaDias: {}, registroHabitos: {}, actividadHabitos: {}, metas: {}, objetivos: {}, syncQueueCount: 0 };
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
        nombre,
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
        string | null,
        string | null,
        string,
      ];

      state.habitos[localId] = {
        local_id: localId,
        remote_id: remoteId,
        user_remote_id: userRemoteId,
        nombre,
        created_at: createdAt,
        updated_at: updatedAt,
        deleted_at: deletedAt,
        sync_status: syncStatus,
      };

      saveState(state);
      return;
    }

    if (normalizedSql.startsWith('INSERT INTO RUTINAS')) {
      const [localId, remoteId, userRemoteId, nombre, createdAt, updatedAt, deletedAt, syncStatus] = params as [
        string,
        number | null,
        number | null,
        string,
        string | null,
        string | null,
        string | null,
        string,
      ];

      state.rutinas[localId] = {
        local_id: localId,
        remote_id: remoteId,
        user_remote_id: userRemoteId,
        nombre,
        created_at: createdAt,
        updated_at: updatedAt,
        deleted_at: deletedAt,
        sync_status: syncStatus,
      };

      saveState(state);
      return;
    }

    if (normalizedSql.startsWith('INSERT INTO RUTINA_HABITOS')) {
      const [localId, remoteId, rutinaLocalId, habitoLocalId, horaInicio, syncStatus] = params as [
        string,
        number | null,
        string,
        string,
        string | null,
        string,
      ];

      state.rutinaHabitos[localId] = {
        local_id: localId,
        remote_id: remoteId,
        rutina_local_id: rutinaLocalId,
        habito_local_id: habitoLocalId,
        hora_inicio: horaInicio,
        sync_status: syncStatus,
      };

      saveState(state);
      return;
    }

    if (normalizedSql.startsWith('INSERT INTO RUTINA_DIAS')) {
      const [localId, remoteId, rutinaLocalId, diaSemana, syncStatus] = params as [
        string,
        number | null,
        string,
        string,
        string,
      ];

      state.rutinaDias[localId] = {
        local_id: localId,
        remote_id: remoteId,
        rutina_local_id: rutinaLocalId,
        dia_semana: diaSemana,
        sync_status: syncStatus,
      };

      saveState(state);
      return;
    }

    if (normalizedSql.startsWith('INSERT INTO REGISTRO_HABITOS')) {
      const [
        localId,
        remoteId,
        habitoLocalId,
        fecha,
        completado,
        observacion,
        createdAt,
        updatedAt,
        syncStatus,
      ] = params as [
        string,
        number | null,
        string,
        string,
        0 | 1,
        string | null,
        string | null,
        string | null,
        string,
      ];

      const existingEntry = Object.values(state.registroHabitos).find(
        (item) => item.habito_local_id === habitoLocalId && item.fecha === fecha,
      );

      const recordKey = existingEntry?.local_id ?? localId;

      state.registroHabitos[recordKey] = {
        local_id: recordKey,
        remote_id: existingEntry?.remote_id ?? remoteId,
        habito_local_id: habitoLocalId,
        fecha,
        completado,
        observacion,
        created_at: existingEntry?.created_at ?? createdAt,
        updated_at: updatedAt,
        sync_status: existingEntry ? 'pending_update' : syncStatus,
      };

      saveState(state);
      return;
    }

    if (normalizedSql.startsWith('UPDATE REGISTRO_HABITOS')) {
      const [completado, observacion, updatedAt, syncStatus, localId] = params as [
        0 | 1,
        string | null,
        string | null,
        string,
        string,
      ];

      const existingEntry = state.registroHabitos[localId];

      if (existingEntry) {
        state.registroHabitos[localId] = {
          ...existingEntry,
          completado,
          observacion,
          updated_at: updatedAt,
          sync_status: syncStatus,
        };

        saveState(state);
      }

      return;
    }

    if (normalizedSql.startsWith('INSERT INTO ACTIVIDAD_HABITOS')) {
      const [localId, remoteId, habitoLocalId, nombre, createdAt, updatedAt, syncStatus] = params as [
        string,
        number | null,
        string,
        string,
        string | null,
        string | null,
        string,
      ];

      state.actividadHabitos[localId] = {
        local_id: localId,
        remote_id: remoteId,
        habito_local_id: habitoLocalId,
        nombre,
        created_at: createdAt,
        updated_at: updatedAt,
        sync_status: syncStatus,
      };

      saveState(state);
      return;
    }

    if (normalizedSql.startsWith('INSERT INTO METAS')) {
      const [localId, remoteId, userRemoteId, nombre, fechaInicio, createdAt, updatedAt, syncStatus] = params as [
        string,
        number | null,
        number | null,
        string,
        string | null,
        string | null,
        string | null,
        string,
      ];

      state.metas[localId] = {
        local_id: localId,
        remote_id: remoteId,
        user_remote_id: userRemoteId,
        nombre,
        fecha_inicio: fechaInicio,
        created_at: createdAt,
        updated_at: updatedAt,
        sync_status: syncStatus,
      };

      saveState(state);
      return;
    }

    if (normalizedSql.startsWith('INSERT INTO OBJETIVOS')) {
      const [
        localId,
        remoteId,
        userRemoteId,
        metaLocalId,
        habitoLocalId,
        nombre,
        metaEsperada,
        fechaLimite,
        createdAt,
        updatedAt,
        syncStatus,
      ] = params as [
        string,
        number | null,
        number | null,
        string | null,
        string,
        string,
        number,
        string,
        string | null,
        string | null,
        string,
      ];

      state.objetivos[localId] = {
        local_id: localId,
        remote_id: remoteId,
        user_remote_id: userRemoteId,
        meta_local_id: metaLocalId,
        habito_local_id: habitoLocalId,
        nombre,
        meta_esperada: metaEsperada,
        fecha_limite: fechaLimite,
        created_at: createdAt,
        updated_at: updatedAt,
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

    if (normalizedSql === 'SELECT COUNT(*) AS COUNT FROM RUTINAS;') {
      return { count: Object.values(state.rutinas).filter((item) => !item.deleted_at).length } as T;
    }

    if (normalizedSql === 'SELECT COUNT(*) AS COUNT FROM RUTINA_HABITOS;') {
      return { count: Object.keys(state.rutinaHabitos).length } as T;
    }

    if (normalizedSql === 'SELECT COUNT(*) AS COUNT FROM RUTINA_DIAS;') {
      return { count: Object.keys(state.rutinaDias).length } as T;
    }

    if (normalizedSql === 'SELECT COUNT(*) AS COUNT FROM REGISTRO_HABITOS;') {
      return { count: Object.keys(state.registroHabitos).length } as T;
    }

    if (normalizedSql === 'SELECT COUNT(*) AS COUNT FROM ACTIVIDAD_HABITOS;') {
      return { count: Object.keys(state.actividadHabitos).length } as T;
    }

    if (normalizedSql === 'SELECT COUNT(*) AS COUNT FROM METAS;') {
      return { count: Object.keys(state.metas).length } as T;
    }

    if (normalizedSql === 'SELECT COUNT(*) AS COUNT FROM OBJETIVOS;') {
      return { count: Object.keys(state.objetivos).length } as T;
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

    if (normalizedSql.includes('FROM RUTINAS')) {
      return Object.values(state.rutinas)
        .filter((item) => !item.deleted_at)
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')) as T[];
    }

    if (normalizedSql.includes('FROM RUTINA_HABITOS')) {
      return Object.values(state.rutinaHabitos)
        .sort((a, b) => {
          if (a.hora_inicio === b.hora_inicio) {
            return a.local_id.localeCompare(b.local_id);
          }

          if (a.hora_inicio === null) {
            return 1;
          }

          if (b.hora_inicio === null) {
            return -1;
          }

          return a.hora_inicio.localeCompare(b.hora_inicio);
        }) as T[];
    }

    if (normalizedSql.includes('FROM RUTINA_DIAS')) {
      return Object.values(state.rutinaDias)
        .sort((a, b) => a.dia_semana.localeCompare(b.dia_semana)) as T[];
    }

    if (normalizedSql.includes('FROM REGISTRO_HABITOS')) {
      return Object.values(state.registroHabitos)
        .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.updated_at?.localeCompare(a.updated_at ?? '') || 0) as T[];
    }

    if (normalizedSql.includes('FROM ACTIVIDAD_HABITOS')) {
      return Object.values(state.actividadHabitos)
        .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? '')) as T[];
    }

    if (normalizedSql.includes('FROM METAS')) {
      return Object.values(state.metas)
        .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? '')) as T[];
    }

    if (normalizedSql.includes('FROM OBJETIVOS')) {
      return Object.values(state.objetivos)
        .sort((a, b) => (a.fecha_limite ?? '').localeCompare(b.fecha_limite ?? '')) as T[];
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
    routinesCount: Object.values(state.rutinas).filter((item) => !item.deleted_at).length,
    queueCount: state.syncQueueCount,
  };
}
