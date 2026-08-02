import type { RemoteTask } from '@/services';

import { getDatabase } from '../client';

export type Task = {
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

export type CreateTaskInput = {
  userRemoteId?: number | null;
  titulo: string;
  horaInicio?: string | null;
};

function createLocalId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeHoraInicio(value?: string | null): string | null {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    return null;
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(normalized)) {
    throw new Error('La hora debe tener formato HH:MM.');
  }

  return normalized.slice(0, 5);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();

  if (!input.titulo.trim()) {
    throw new Error('Escribi un titulo para la tarea.');
  }

  const task: Task = {
    local_id: createLocalId(),
    remote_id: null,
    user_remote_id: input.userRemoteId ?? null,
    titulo: input.titulo.trim(),
    hora_inicio: normalizeHoraInicio(input.horaInicio),
    estado: 'pendiente',
    completed_at: null,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: 'pending_create',
  };

  await db.runAsync(
    `
      INSERT INTO tareas (
        local_id, remote_id, user_remote_id, titulo, hora_inicio, estado, completed_at, created_at, updated_at, deleted_at, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      task.local_id,
      task.remote_id,
      task.user_remote_id,
      task.titulo,
      task.hora_inicio,
      task.estado,
      task.completed_at,
      task.created_at,
      task.updated_at,
      task.deleted_at,
      task.sync_status,
    ],
  );

  return task;
}

export async function listTasks(includePendingDelete = false): Promise<Task[]> {
  const db = await getDatabase();

  return db.getAllAsync<Task>(
    `
      SELECT
        local_id,
        remote_id,
        user_remote_id,
        titulo,
        hora_inicio,
        estado,
      completed_at,
      created_at,
      updated_at,
      deleted_at,
      sync_status
      FROM tareas
      ${includePendingDelete ? '' : "WHERE deleted_at IS NULL AND sync_status != 'pending_delete'"}
      ORDER BY
        CASE WHEN hora_inicio IS NULL THEN 1 ELSE 0 END,
        hora_inicio ASC,
        datetime(created_at) DESC;
    `,
  );
}

export async function listPendingTasks(): Promise<Task[]> {
  const tasks = await listTasks();

  return tasks.filter((task) => task.estado === 'pendiente' && !task.completed_at);
}

export async function getTaskById(localId: string): Promise<Task | null> {
  const tasks = await listTasks();

  return tasks.find((task) => task.local_id === localId) ?? null;
}

export async function getTaskByRemoteId(remoteId: number): Promise<Task | null> {
  const tasks = await listTasks();

  return tasks.find((task) => task.remote_id === remoteId) ?? null;
}

export async function completeTask(localId: string): Promise<void> {
  const db = await getDatabase();
  const currentTask = await getTaskById(localId);

  if (!currentTask) {
    throw new Error('No se encontro la tarea.');
  }

  const timestamp = new Date().toISOString();
  const nextSyncStatus =
    currentTask.sync_status === 'pending_create' ? 'pending_create' : 'pending_update';

  await db.runAsync(
    `
      UPDATE tareas
      SET estado = ?, completed_at = ?, updated_at = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    ['completada', timestamp, timestamp, nextSyncStatus, localId],
  );
}

export async function deleteTask(localId: string): Promise<void> {
  const db = await getDatabase();
  const currentTask = await getTaskById(localId);

  if (!currentTask) {
    throw new Error('No se encontro la tarea.');
  }

  const timestamp = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE tareas
      SET deleted_at = ?, updated_at = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    [timestamp, timestamp, 'pending_delete', localId],
  );
}

export async function hardDeleteTask(localId: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM tareas
      WHERE local_id = ?;
    `,
    [localId],
  );
}

export async function markTaskAsSynced(
  localId: string,
  remoteTask: RemoteTask,
  userRemoteId: number,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE tareas
      SET remote_id = ?, user_remote_id = ?, titulo = ?, hora_inicio = ?, estado = ?, completed_at = ?, created_at = ?, updated_at = ?, deleted_at = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    [
      remoteTask.id,
      userRemoteId,
      remoteTask.titulo,
      remoteTask.hora_inicio,
      remoteTask.estado,
      remoteTask.completed_at,
      remoteTask.created_at,
      remoteTask.updated_at,
      remoteTask.deleted_at,
      'synced',
      localId,
    ],
  );
}

export async function upsertTaskFromRemote(
  remoteTask: RemoteTask,
  userRemoteId: number,
): Promise<Task> {
  const existingTask = await getTaskByRemoteId(remoteTask.id);

  if (existingTask) {
    await markTaskAsSynced(existingTask.local_id, remoteTask, userRemoteId);

    return {
      ...existingTask,
      remote_id: remoteTask.id,
      user_remote_id: userRemoteId,
      titulo: remoteTask.titulo,
      hora_inicio: remoteTask.hora_inicio,
      estado: remoteTask.estado,
      completed_at: remoteTask.completed_at,
      created_at: remoteTask.created_at,
      updated_at: remoteTask.updated_at,
      deleted_at: remoteTask.deleted_at,
      sync_status: 'synced',
    };
  }

  const db = await getDatabase();
  const localId = `remote-task-${remoteTask.id}`;

  await db.runAsync(
    `
      INSERT INTO tareas (
        local_id, remote_id, user_remote_id, titulo, hora_inicio, estado, completed_at, created_at, updated_at, deleted_at, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      localId,
      remoteTask.id,
      userRemoteId,
      remoteTask.titulo,
      remoteTask.hora_inicio,
      remoteTask.estado,
      remoteTask.completed_at,
      remoteTask.created_at,
      remoteTask.updated_at,
      remoteTask.deleted_at,
      'synced',
    ],
  );

  return {
    local_id: localId,
    remote_id: remoteTask.id,
    user_remote_id: userRemoteId,
    titulo: remoteTask.titulo,
    hora_inicio: remoteTask.hora_inicio,
    estado: remoteTask.estado,
    completed_at: remoteTask.completed_at,
    created_at: remoteTask.created_at,
    updated_at: remoteTask.updated_at,
    deleted_at: remoteTask.deleted_at,
    sync_status: 'synced',
  };
}
