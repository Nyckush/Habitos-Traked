import { DATABASE_NAME, DATABASE_VERSION } from './schema';

export type AppDatabase = {
  runAsync: (sql: string, params?: unknown[]) => Promise<void>;
  getFirstAsync: <T>(sql: string, params?: unknown[]) => Promise<T | null>;
  getAllAsync: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
};

type UserRow = {
  local_id: string;
  remote_id: number | null;
  username: string;
  perfil: string | null;
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
  tareas: Record<string, TareaRow>;
  metas: Record<string, MetaRow>;
  objetivos: Record<string, ObjetivoRow>;
  objetivoHabitos: Record<string, ObjetivoHabitoRow>;
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

type TareaRow = {
  local_id: string;
  remote_id: number | null;
  user_remote_id: number | null;
  titulo: string;
  hora_inicio: string | null;
  estado: 'pendiente' | 'completada';
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
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
  nombre: string;
  meta_esperada: number;
  fecha_limite: string;
  created_at: string | null;
  updated_at: string | null;
  sync_status: string;
};

type ObjetivoHabitoRow = {
  local_id: string;
  remote_id: number | null;
  objetivo_local_id: string;
  habito_local_id: string;
  created_at: string | null;
  updated_at: string | null;
  sync_status: string;
};

const STORAGE_KEY = 'habitracked.web.db';

function loadState(): WebDatabaseState {
  if (typeof window === 'undefined') {
    return { app_meta: {}, users: {}, habitos: {}, rutinas: {}, rutinaHabitos: {}, rutinaDias: {}, registroHabitos: {}, actividadHabitos: {}, tareas: {}, metas: {}, objetivos: {}, objetivoHabitos: {}, syncQueueCount: 0 };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return { app_meta: {}, users: {}, habitos: {}, rutinas: {}, rutinaHabitos: {}, rutinaDias: {}, registroHabitos: {}, actividadHabitos: {}, tareas: {}, metas: {}, objetivos: {}, objetivoHabitos: {}, syncQueueCount: 0 };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WebDatabaseState>;
    const users = Object.fromEntries(
      Object.entries((parsed as Partial<WebDatabaseState> & { users?: Record<string, UserRow & { nombre?: string; perfil?: string | null }> }).users ?? {}).map(
        ([key, value]) => [
          key,
          {
            local_id: value.local_id,
            remote_id: value.remote_id,
            username: value.username ?? value.nombre ?? '',
            perfil: value.perfil ?? null,
            email: value.email,
            created_at: value.created_at ?? null,
            updated_at: value.updated_at ?? null,
            sync_status: value.sync_status,
          } satisfies UserRow,
        ],
      ),
    );
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

    const objetivos = Object.fromEntries(
      Object.entries(parsed.objetivos ?? {}).map(([key, value]) => {
        const legacyObjetivo = value as ObjetivoRow & { habito_local_id?: string };

        return [
          key,
          {
            local_id: legacyObjetivo.local_id,
            remote_id: legacyObjetivo.remote_id,
            user_remote_id: legacyObjetivo.user_remote_id,
            meta_local_id: legacyObjetivo.meta_local_id ?? null,
            nombre: legacyObjetivo.nombre,
            meta_esperada: legacyObjetivo.meta_esperada,
            fecha_limite: legacyObjetivo.fecha_limite,
            created_at: legacyObjetivo.created_at ?? null,
            updated_at: legacyObjetivo.updated_at ?? null,
            sync_status: legacyObjetivo.sync_status,
          } satisfies ObjetivoRow,
        ];
      }),
    );
    const objetivoHabitos = Object.fromEntries(
      Object.entries((parsed as Partial<WebDatabaseState> & { objetivoHabitos?: Record<string, ObjetivoHabitoRow> }).objetivoHabitos ?? {}).map(
        ([key, value]) => [key, value satisfies ObjetivoHabitoRow],
      ),
    );

    for (const legacyObjetivo of Object.values(parsed.objetivos ?? {}) as (ObjetivoRow & { habito_local_id?: string })[]) {
      if (!legacyObjetivo.habito_local_id) {
        continue;
      }

      const pivotLocalId = `objetivo-habito-${legacyObjetivo.local_id}-${legacyObjetivo.habito_local_id}`;

      if (!objetivoHabitos[pivotLocalId]) {
        objetivoHabitos[pivotLocalId] = {
          local_id: pivotLocalId,
          remote_id: null,
          objetivo_local_id: legacyObjetivo.local_id,
          habito_local_id: legacyObjetivo.habito_local_id,
          created_at: legacyObjetivo.created_at ?? null,
          updated_at: legacyObjetivo.updated_at ?? null,
          sync_status: legacyObjetivo.sync_status === 'synced' ? 'synced' : 'pending_create',
        };
      }
    }

    return {
      app_meta: parsed.app_meta ?? {},
      users,
      habitos,
      rutinas: parsed.rutinas ?? {},
      rutinaHabitos: parsed.rutinaHabitos ?? {},
      rutinaDias: parsed.rutinaDias ?? {},
      registroHabitos: parsed.registroHabitos ?? {},
      actividadHabitos: parsed.actividadHabitos ?? {},
      tareas: parsed.tareas ?? {},
      metas,
      objetivos,
      objetivoHabitos,
      syncQueueCount: parsed.syncQueueCount ?? 0,
    };
  } catch {
    return { app_meta: {}, users: {}, habitos: {}, rutinas: {}, rutinaHabitos: {}, rutinaDias: {}, registroHabitos: {}, actividadHabitos: {}, tareas: {}, metas: {}, objetivos: {}, objetivoHabitos: {}, syncQueueCount: 0 };
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
      const [localId, remoteId, username, perfil, email, createdAt, updatedAt] = params as [
        string,
        number | null,
        string,
        string | null,
        string,
        string | null,
        string | null,
      ];

      state.users[localId] = {
        local_id: localId,
        remote_id: remoteId,
        username,
        perfil,
        email,
        created_at: createdAt,
        updated_at: updatedAt,
        sync_status: 'synced',
      };

      saveState(state);
      return;
    }

    if (normalizedSql.startsWith('UPDATE USERS')) {
      const [username, perfil, updatedAt, localId] = params as [
        string,
        string | null,
        string | null,
        string,
      ];

      const existingUser = state.users[localId];

      if (existingUser) {
        state.users[localId] = {
          ...existingUser,
          username,
          perfil,
          updated_at: updatedAt,
          sync_status: 'synced',
        };

        saveState(state);
      }

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

    if (normalizedSql.startsWith('UPDATE HABITOS')) {
      if (normalizedSql.includes('SET REMOTE_ID =')) {
        const [remoteId, userRemoteId, nombre, createdAt, updatedAt, deletedAt, syncStatus, localId] =
          params as [
            number | null,
            number | null,
            string,
            string | null,
            string | null,
            string | null,
            string,
            string,
          ];

        const existingHabit = state.habitos[localId];

        if (existingHabit) {
          state.habitos[localId] = {
            ...existingHabit,
            remote_id: remoteId,
            user_remote_id: userRemoteId,
            nombre,
            created_at: createdAt,
            updated_at: updatedAt,
            deleted_at: deletedAt,
            sync_status: syncStatus,
          };

          saveState(state);
        }

        return;
      }

      if (normalizedSql.includes('SET NOMBRE =')) {
        const [nombre, updatedAt, syncStatus, localId] = params as [
          string,
          string | null,
          string,
          string,
        ];

        const existingHabit = state.habitos[localId];

        if (existingHabit) {
          state.habitos[localId] = {
            ...existingHabit,
            nombre,
            updated_at: updatedAt,
            sync_status: syncStatus,
          };

          saveState(state);
        }

        return;
      }

      if (normalizedSql.includes('SET DELETED_AT =')) {
        const [deletedAt, updatedAt, syncStatus, localId] = params as [
          string | null,
          string | null,
          string,
          string,
        ];

        const existingHabit = state.habitos[localId];

        if (existingHabit) {
          state.habitos[localId] = {
            ...existingHabit,
            deleted_at: deletedAt,
            updated_at: updatedAt,
            sync_status: syncStatus,
          };

          saveState(state);
        }

        return;
      }
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

    if (normalizedSql.startsWith('UPDATE RUTINAS')) {
      if (normalizedSql.includes('SET REMOTE_ID =')) {
        const [remoteId, userRemoteId, nombre, createdAt, updatedAt, deletedAt, syncStatus, localId] =
          params as [
            number | null,
            number | null,
            string,
            string | null,
            string | null,
            string | null,
            string,
            string,
          ];

        const existingRoutine = state.rutinas[localId];

        if (existingRoutine) {
          state.rutinas[localId] = {
            ...existingRoutine,
            remote_id: remoteId,
            user_remote_id: userRemoteId,
            nombre,
            created_at: createdAt,
            updated_at: updatedAt,
            deleted_at: deletedAt,
            sync_status: syncStatus,
          };

          saveState(state);
        }

        return;
      }

      if (normalizedSql.includes('SET NOMBRE =')) {
        const [nombre, updatedAt, syncStatus, localId] = params as [
          string,
          string | null,
          string,
          string,
        ];

        const existingRoutine = state.rutinas[localId];

        if (existingRoutine) {
          state.rutinas[localId] = {
            ...existingRoutine,
            nombre,
            updated_at: updatedAt,
            sync_status: syncStatus,
          };

          saveState(state);
        }

        return;
      }

      if (normalizedSql.includes('SET DELETED_AT =')) {
        const [deletedAt, updatedAt, syncStatus, localId] = params as [
          string | null,
          string | null,
          string,
          string,
        ];

        const existingRoutine = state.rutinas[localId];

        if (existingRoutine) {
          state.rutinas[localId] = {
            ...existingRoutine,
            deleted_at: deletedAt,
            updated_at: updatedAt,
            sync_status: syncStatus,
          };

          saveState(state);
        }

        return;
      }
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

    if (normalizedSql.startsWith('UPDATE RUTINA_HABITOS')) {
      if (normalizedSql.includes('SET REMOTE_ID =')) {
        const [remoteId, rutinaLocalId, habitoLocalId, horaInicio, syncStatus, localId] =
          params as [
            number | null,
            string,
            string,
            string | null,
            string,
            string,
          ];

        const existingLink = state.rutinaHabitos[localId];

        if (existingLink) {
          state.rutinaHabitos[localId] = {
            ...existingLink,
            remote_id: remoteId,
            rutina_local_id: rutinaLocalId,
            habito_local_id: habitoLocalId,
            hora_inicio: horaInicio,
            sync_status: syncStatus,
          };

          saveState(state);
        }

        return;
      }

      const [horaInicio, syncStatus, localId] = params as [
        string | null,
        string,
        string,
      ];

      const existingLink = state.rutinaHabitos[localId];

      if (existingLink) {
        state.rutinaHabitos[localId] = {
          ...existingLink,
          hora_inicio: horaInicio,
          sync_status: syncStatus,
        };

        saveState(state);
      }

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

    if (normalizedSql.startsWith('DELETE FROM RUTINA_DIAS')) {
      const [rutinaLocalId] = params as [string];

      for (const [localId, day] of Object.entries(state.rutinaDias)) {
        if (day.rutina_local_id === rutinaLocalId) {
          delete state.rutinaDias[localId];
        }
      }

      saveState(state);
      return;
    }

    if (normalizedSql.startsWith('DELETE FROM RUTINA_HABITOS')) {
      const [localId] = params as [string];
      delete state.rutinaHabitos[localId];
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
      if (normalizedSql.includes('SET REMOTE_ID =')) {
        const [
          remoteId,
          habitoLocalId,
          fecha,
          completado,
          observacion,
          createdAt,
          updatedAt,
          syncStatus,
          localId,
        ] = params as [
          number | null,
          string,
          string,
          0 | 1,
          string | null,
          string | null,
          string | null,
          string,
          string,
        ];

        const existingEntry = state.registroHabitos[localId];

        if (existingEntry) {
          state.registroHabitos[localId] = {
            ...existingEntry,
            remote_id: remoteId,
            habito_local_id: habitoLocalId,
            fecha,
            completado,
            observacion,
            created_at: createdAt,
            updated_at: updatedAt,
            sync_status: syncStatus,
          };

          saveState(state);
        }

        return;
      }

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

    if (normalizedSql.startsWith('DELETE FROM REGISTRO_HABITOS')) {
      const [localId] = params as [string];
      delete state.registroHabitos[localId];
      saveState(state);
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

    if (normalizedSql.startsWith('INSERT INTO TAREAS')) {
      const [
        localId,
        remoteId,
        userRemoteId,
        titulo,
        horaInicio,
        estado,
        completedAt,
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
        'pendiente' | 'completada',
        string | null,
        string | null,
        string | null,
        string | null,
        string,
      ];

      state.tareas[localId] = {
        local_id: localId,
        remote_id: remoteId,
        user_remote_id: userRemoteId,
        titulo,
        hora_inicio: horaInicio,
        estado,
        completed_at: completedAt,
        created_at: createdAt,
        updated_at: updatedAt,
        deleted_at: deletedAt,
        sync_status: syncStatus,
      };

      saveState(state);
      return;
    }

    if (normalizedSql.startsWith('UPDATE TAREAS')) {
      if (normalizedSql.includes('SET REMOTE_ID =')) {
        const [
          remoteId,
          userRemoteId,
          titulo,
          horaInicio,
          estado,
          completedAt,
          createdAt,
          updatedAt,
          deletedAt,
          syncStatus,
          localId,
        ] = params as [
          number | null,
          number | null,
          string,
          string | null,
          'pendiente' | 'completada',
          string | null,
          string | null,
          string | null,
          string | null,
          string,
          string,
        ];

        const existingTask = state.tareas[localId];

        if (existingTask) {
          state.tareas[localId] = {
            ...existingTask,
            remote_id: remoteId,
            user_remote_id: userRemoteId,
            titulo,
            hora_inicio: horaInicio,
            estado,
            completed_at: completedAt,
            created_at: createdAt,
            updated_at: updatedAt,
            deleted_at: deletedAt,
            sync_status: syncStatus,
          };

          saveState(state);
        }

        return;
      }

      if (normalizedSql.includes('SET DELETED_AT =')) {
        const [deletedAt, updatedAt, syncStatus, localId] = params as [
          string | null,
          string | null,
          string,
          string,
        ];

        const existingTask = state.tareas[localId];

        if (existingTask) {
          state.tareas[localId] = {
            ...existingTask,
            deleted_at: deletedAt,
            updated_at: updatedAt,
            sync_status: syncStatus,
          };

          saveState(state);
        }

        return;
      }

      const [estado, completedAt, updatedAt, syncStatus, localId] = params as [
        'pendiente' | 'completada',
        string | null,
        string | null,
        string,
        string,
      ];

      const existingTask = state.tareas[localId];

      if (existingTask) {
        state.tareas[localId] = {
          ...existingTask,
          estado,
          completed_at: completedAt,
          updated_at: updatedAt,
          sync_status: syncStatus,
        };

        saveState(state);
      }

      return;
    }

    if (normalizedSql.startsWith('DELETE FROM TAREAS')) {
      const [localId] = params as [string];
      delete state.tareas[localId];
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

    if (normalizedSql.startsWith('UPDATE METAS')) {
      if (normalizedSql.includes('SET REMOTE_ID =')) {
        const [remoteId, userRemoteId, nombre, fechaInicio, createdAt, updatedAt, syncStatus, localId] =
          params as [
            number | null,
            number | null,
            string,
            string | null,
            string | null,
            string | null,
            string,
            string,
          ];

        const existingMeta = state.metas[localId];

        if (existingMeta) {
          state.metas[localId] = {
            ...existingMeta,
            remote_id: remoteId,
            user_remote_id: userRemoteId,
            nombre,
            fecha_inicio: fechaInicio,
            created_at: createdAt,
            updated_at: updatedAt,
            sync_status: syncStatus,
          };

          saveState(state);
        }

        return;
      }

      const [nombre, updatedAt, syncStatus, localId] = params as [
        string,
        string | null,
        string,
        string,
      ];

      const existingMeta = state.metas[localId];

      if (existingMeta) {
        state.metas[localId] = {
          ...existingMeta,
          nombre,
          updated_at: updatedAt,
          sync_status: syncStatus,
        };

        saveState(state);
      }

      return;
    }

    if (normalizedSql.startsWith('INSERT INTO OBJETIVOS')) {
      const [
        localId,
        remoteId,
        userRemoteId,
        metaLocalId,
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

    if (normalizedSql.startsWith('INSERT INTO OBJETIVO_HABITOS')) {
      const [localId, remoteId, objetivoLocalId, habitoLocalId, createdAt, updatedAt, syncStatus] = params as [
        string,
        number | null,
        string,
        string,
        string | null,
        string | null,
        string,
      ];

      state.objetivoHabitos[localId] = {
        local_id: localId,
        remote_id: remoteId,
        objetivo_local_id: objetivoLocalId,
        habito_local_id: habitoLocalId,
        created_at: createdAt,
        updated_at: updatedAt,
        sync_status: syncStatus,
      };

      saveState(state);
      return;
    }

    if (normalizedSql.startsWith('UPDATE OBJETIVO_HABITOS')) {
      const [remoteId, objetivoLocalId, habitoLocalId, createdAt, updatedAt, syncStatus, localId] =
        params as [
          number | null,
          string,
          string,
          string | null,
          string | null,
          string,
          string,
        ];

      const existingLink = state.objetivoHabitos[localId];

      if (existingLink) {
        state.objetivoHabitos[localId] = {
          ...existingLink,
          remote_id: remoteId,
          objetivo_local_id: objetivoLocalId,
          habito_local_id: habitoLocalId,
          created_at: createdAt,
          updated_at: updatedAt,
          sync_status: syncStatus,
        };

        saveState(state);
      }

      return;
    }

    if (normalizedSql.startsWith('UPDATE OBJETIVOS')) {
      if (normalizedSql.includes('SET REMOTE_ID =')) {
        const [
          remoteId,
          userRemoteId,
          metaLocalId,
          nombre,
          metaEsperada,
          fechaLimite,
          createdAt,
          updatedAt,
          syncStatus,
          localId,
        ] = params as [
          number | null,
          number | null,
          string | null,
          string,
          number,
          string,
          string | null,
          string | null,
          string,
          string,
        ];

        const existingObjetivo = state.objetivos[localId];

        if (existingObjetivo) {
          state.objetivos[localId] = {
            ...existingObjetivo,
            remote_id: remoteId,
            user_remote_id: userRemoteId,
            meta_local_id: metaLocalId,
            nombre,
            meta_esperada: metaEsperada,
            fecha_limite: fechaLimite,
            created_at: createdAt,
            updated_at: updatedAt,
            sync_status: syncStatus,
          };

          saveState(state);
        }

        return;
      }

      const [nombre, metaEsperada, fechaLimite, updatedAt, syncStatus, localId] = params as [
        string,
        number,
        string,
        string | null,
        string,
        string,
      ];

      const existingObjetivo = state.objetivos[localId];

      if (existingObjetivo) {
        state.objetivos[localId] = {
          ...existingObjetivo,
          nombre,
          meta_esperada: metaEsperada,
          fecha_limite: fechaLimite,
          updated_at: updatedAt,
          sync_status: syncStatus,
        };

        saveState(state);
      }

      return;
    }

    if (normalizedSql.startsWith('DELETE FROM OBJETIVO_HABITOS')) {
      const [value] = params as [string];

      if (normalizedSql.includes('WHERE LOCAL_ID =')) {
        delete state.objetivoHabitos[value];
      } else {
        for (const [localId, pivot] of Object.entries(state.objetivoHabitos)) {
          if (pivot.objetivo_local_id === value) {
            delete state.objetivoHabitos[localId];
          }
        }
      }

      saveState(state);
      return;
    }

    if (normalizedSql.startsWith('DELETE FROM OBJETIVOS')) {
      const [localId] = params as [string];
      delete state.objetivos[localId];
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

    if (normalizedSql === 'SELECT COUNT(*) AS COUNT FROM TAREAS;') {
      return { count: Object.values(state.tareas).filter((item) => !item.deleted_at).length } as T;
    }

    if (normalizedSql === 'SELECT COUNT(*) AS COUNT FROM METAS;') {
      return { count: Object.keys(state.metas).length } as T;
    }

    if (normalizedSql === 'SELECT COUNT(*) AS COUNT FROM OBJETIVOS;') {
      return { count: Object.keys(state.objetivos).length } as T;
    }

    if (normalizedSql === 'SELECT COUNT(*) AS COUNT FROM OBJETIVO_HABITOS;') {
      return { count: Object.keys(state.objetivoHabitos).length } as T;
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

    if (normalizedSql.includes('FROM HABITOS') && normalizedSql.includes('WHERE LOCAL_ID =')) {
      const [localId] = params as unknown as [string];
      const habit = state.habitos[localId];

      if (!habit || habit.deleted_at) {
        return null;
      }

      return habit as T;
    }

    if (normalizedSql.includes('FROM RUTINAS') && normalizedSql.includes('WHERE LOCAL_ID =')) {
      const [localId] = params as unknown as [string];
      const routine = state.rutinas[localId];

      if (!routine || routine.deleted_at) {
        return null;
      }

      return routine as T;
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

    if (normalizedSql.includes('FROM TAREAS')) {
      const shouldFilterDeleted = normalizedSql.includes('WHERE DELETED_AT IS NULL');
      const shouldFilterPendingDelete = normalizedSql.includes("SYNC_STATUS != 'PENDING_DELETE'");

      return Object.values(state.tareas)
        .filter((item) => (shouldFilterDeleted ? !item.deleted_at : true))
        .filter((item) => (shouldFilterPendingDelete ? item.sync_status !== 'pending_delete' : true))
        .sort((a, b) => {
          if (a.hora_inicio === b.hora_inicio) {
            return (b.created_at ?? '').localeCompare(a.created_at ?? '');
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

    if (normalizedSql.includes('FROM METAS')) {
      return Object.values(state.metas)
        .filter((item) => item.sync_status !== 'pending_delete')
        .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? '')) as T[];
    }

    if (normalizedSql.includes('FROM OBJETIVOS')) {
      return Object.values(state.objetivos)
        .filter((item) => item.sync_status !== 'pending_delete')
        .sort((a, b) => (a.fecha_limite ?? '').localeCompare(b.fecha_limite ?? '')) as T[];
    }

    if (normalizedSql.includes('FROM OBJETIVO_HABITOS')) {
      return Object.values(state.objetivoHabitos)
        .sort((a, b) => a.objetivo_local_id.localeCompare(b.objetivo_local_id) || a.habito_local_id.localeCompare(b.habito_local_id)) as T[];
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

export async function clearLocalDomainData(): Promise<void> {
  const state = loadState();

  state.habitos = {};
  state.rutinas = {};
  state.rutinaHabitos = {};
  state.rutinaDias = {};
  state.registroHabitos = {};
  state.actividadHabitos = {};
  state.tareas = {};
  state.metas = {};
  state.objetivos = {};
  state.objetivoHabitos = {};
  state.syncQueueCount = 0;

  saveState(state);
}
