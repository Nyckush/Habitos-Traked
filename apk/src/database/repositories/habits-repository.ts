import { getDatabase } from '../client';

export type Habit = {
  local_id: string;
  remote_id: number | null;
  user_remote_id: number | null;
  nombre: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  sync_status: string;
};

export type CreateHabitInput = {
  userRemoteId?: number | null;
  nombre: string;
};

export type UpdateHabitInput = {
  localId: string;
  nombre: string;
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
    nombre: input.nombre.trim(),
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: 'pending_create',
  };

  await db.runAsync(
    `
      INSERT INTO habitos (
        local_id, remote_id, user_remote_id, nombre, created_at, updated_at, deleted_at, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      habit.local_id,
      habit.remote_id,
      habit.user_remote_id,
      habit.nombre,
      habit.created_at,
      habit.updated_at,
      habit.deleted_at,
      habit.sync_status,
    ],
  );

  return habit;
}

export async function getHabitById(localId: string): Promise<Habit | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Habit>(
    `
      SELECT
        local_id,
        remote_id,
        user_remote_id,
        nombre,
        created_at,
        updated_at,
        deleted_at,
        sync_status
      FROM habitos
      WHERE local_id = ?
        AND deleted_at IS NULL
      LIMIT 1;
    `,
    [localId],
  );

  return row ?? null;
}

export async function updateHabit(input: UpdateHabitInput): Promise<void> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();
  const currentHabit = await getHabitById(input.localId);

  if (!currentHabit) {
    throw new Error('No se encontro el habito.');
  }

  const nextSyncStatus =
    currentHabit.sync_status === 'pending_create' ? 'pending_create' : 'pending_update';

  await db.runAsync(
    `
      UPDATE habitos
      SET nombre = ?, updated_at = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    [input.nombre.trim(), timestamp, nextSyncStatus, input.localId],
  );
}

export async function deleteHabit(localId: string): Promise<void> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();
  const currentHabit = await getHabitById(localId);

  if (!currentHabit) {
    throw new Error('No se encontro el habito.');
  }

  const nextSyncStatus =
    currentHabit.sync_status === 'pending_create' ? 'pending_delete' : 'pending_delete';

  await db.runAsync(
    `
      UPDATE habitos
      SET deleted_at = ?, updated_at = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    [timestamp, timestamp, nextSyncStatus, localId],
  );
}

export async function listHabits(): Promise<Habit[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<Habit>(
    `
      SELECT
        local_id,
        remote_id,
        user_remote_id,
        nombre,
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
