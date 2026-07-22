import { getDatabase } from '../client';

export type Habit = {
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

export type CreateHabitInput = {
  userRemoteId?: number | null;
  titulo: string;
  descripcion?: string | null;
  frecuencia?: string | null;
};

function createLocalId(): string {
  return `habit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();
  const localId = createLocalId();

  const habit: Habit = {
    local_id: localId,
    remote_id: null,
    user_remote_id: input.userRemoteId ?? null,
    titulo: input.titulo.trim(),
    descripcion: input.descripcion?.trim() || null,
    estado: 'activo',
    frecuencia: input.frecuencia?.trim() || null,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: 'pending_create',
  };

  await db.runAsync(
    `
      INSERT INTO habitos (
        local_id, remote_id, user_remote_id, titulo, descripcion, estado,
        frecuencia, created_at, updated_at, deleted_at, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      habit.local_id,
      habit.remote_id,
      habit.user_remote_id,
      habit.titulo,
      habit.descripcion,
      habit.estado,
      habit.frecuencia,
      habit.created_at,
      habit.updated_at,
      habit.deleted_at,
      habit.sync_status,
    ],
  );

  return habit;
}

export async function listHabits(): Promise<Habit[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<Habit>(
    `
      SELECT
        local_id,
        remote_id,
        user_remote_id,
        titulo,
        descripcion,
        estado,
        frecuencia,
        created_at,
        updated_at,
        deleted_at,
        sync_status
      FROM habitos
      WHERE deleted_at IS NULL
      ORDER BY datetime(created_at) DESC;
    `,
  );

  return rows;
}
