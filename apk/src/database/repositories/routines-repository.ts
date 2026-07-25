import type { RemoteRoutine } from '@/services';

import { getDatabase } from '../client';
import { createRoutineDay, deleteRoutineDaysByRoutineId } from './routine-days-repository';

export type Routine = {
  local_id: string;
  remote_id: number | null;
  user_remote_id: number | null;
  nombre: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  sync_status: string;
};

export type CreateRoutineInput = {
  userRemoteId?: number | null;
  nombre: string;
};

export type UpdateRoutineInput = {
  localId: string;
  nombre: string;
};

function createLocalId(): string {
  return `routine-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createRoutine(input: CreateRoutineInput): Promise<Routine> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();
  const localId = createLocalId();

  const routine: Routine = {
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
      INSERT INTO rutinas (
        local_id, remote_id, user_remote_id, nombre, created_at, updated_at, deleted_at, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      routine.local_id,
      routine.remote_id,
      routine.user_remote_id,
      routine.nombre,
      routine.created_at,
      routine.updated_at,
      routine.deleted_at,
      routine.sync_status,
    ],
  );

  return routine;
}

export async function getRoutineById(localId: string): Promise<Routine | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Routine>(
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
      FROM rutinas
      WHERE local_id = ?
        AND deleted_at IS NULL
      LIMIT 1;
    `,
    [localId],
  );

  return row ?? null;
}

export async function updateRoutine(input: UpdateRoutineInput): Promise<void> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();
  const currentRoutine = await getRoutineById(input.localId);

  if (!currentRoutine) {
    throw new Error('No se encontro la rutina.');
  }

  const nextSyncStatus =
    currentRoutine.sync_status === 'pending_create' ? 'pending_create' : 'pending_update';

  await db.runAsync(
    `
      UPDATE rutinas
      SET nombre = ?, updated_at = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    [input.nombre.trim(), timestamp, nextSyncStatus, input.localId],
  );
}

export async function deleteRoutine(localId: string): Promise<void> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();
  const currentRoutine = await getRoutineById(localId);

  if (!currentRoutine) {
    throw new Error('No se encontro la rutina.');
  }

  await db.runAsync(
    `
      UPDATE rutinas
      SET deleted_at = ?, updated_at = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    [timestamp, timestamp, 'pending_delete', localId],
  );
}

export async function listRoutines(): Promise<Routine[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<Routine>(
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
      FROM rutinas
      WHERE deleted_at IS NULL
      ORDER BY datetime(created_at) DESC;
    `,
  );

  return rows;
}

export async function getRoutineByRemoteId(remoteId: number): Promise<Routine | null> {
  const routines = await listRoutines();

  return routines.find((routine) => routine.remote_id === remoteId) ?? null;
}

export async function markRoutineAsSynced(
  localId: string,
  remoteRoutine: RemoteRoutine,
  userRemoteId: number,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE rutinas
      SET remote_id = ?, user_remote_id = ?, nombre = ?, created_at = ?, updated_at = ?, deleted_at = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    [
      remoteRoutine.id,
      userRemoteId,
      remoteRoutine.nombre,
      remoteRoutine.created_at,
      remoteRoutine.updated_at,
      null,
      'synced',
      localId,
    ],
  );

  await deleteRoutineDaysByRoutineId(localId);

  for (const day of remoteRoutine.dias) {
    await createRoutineDay({
      rutinaLocalId: localId,
      diaSemana: day,
    });
  }
}

export async function upsertRoutineFromRemote(
  remoteRoutine: RemoteRoutine,
  userRemoteId: number,
): Promise<Routine> {
  const existingRoutine = await getRoutineByRemoteId(remoteRoutine.id);

  if (existingRoutine) {
    await markRoutineAsSynced(existingRoutine.local_id, remoteRoutine, userRemoteId);

    return {
      ...existingRoutine,
      remote_id: remoteRoutine.id,
      user_remote_id: userRemoteId,
      nombre: remoteRoutine.nombre,
      created_at: remoteRoutine.created_at,
      updated_at: remoteRoutine.updated_at,
      deleted_at: null,
      sync_status: 'synced',
    };
  }

  const db = await getDatabase();
  const localId = `remote-routine-${remoteRoutine.id}`;

  await db.runAsync(
    `
      INSERT INTO rutinas (
        local_id, remote_id, user_remote_id, nombre, created_at, updated_at, deleted_at, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      localId,
      remoteRoutine.id,
      userRemoteId,
      remoteRoutine.nombre,
      remoteRoutine.created_at,
      remoteRoutine.updated_at,
      null,
      'synced',
    ],
  );

  for (const day of remoteRoutine.dias) {
    await createRoutineDay({
      rutinaLocalId: localId,
      diaSemana: day,
    });
  }

  return {
    local_id: localId,
    remote_id: remoteRoutine.id,
    user_remote_id: userRemoteId,
    nombre: remoteRoutine.nombre,
    created_at: remoteRoutine.created_at,
    updated_at: remoteRoutine.updated_at,
    deleted_at: null,
    sync_status: 'synced',
  };
}
