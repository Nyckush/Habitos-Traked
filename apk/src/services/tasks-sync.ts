import {
  hardDeleteTask,
  listTasks,
  markTaskAsSynced,
  type Task,
  upsertTaskFromRemote,
} from '@/database';

import { tasksApi } from './api';

function shouldSyncTask(task: Task, userRemoteId: number): boolean {
  return task.user_remote_id === null || task.user_remote_id === userRemoteId;
}

export async function pullTasks(token: string, userRemoteId: number): Promise<void> {
  const response = await tasksApi.list(token);
  const remoteIds = new Set<number>();

  for (const remoteTask of response.data) {
    remoteIds.add(remoteTask.id);
    await upsertTaskFromRemote(remoteTask, userRemoteId);
  }

  const localTasks = await listTasks(true);

  for (const localTask of localTasks) {
    if (localTask.remote_id !== null && !remoteIds.has(localTask.remote_id)) {
      await hardDeleteTask(localTask.local_id);
    }
  }
}

export async function syncTasks(token: string, userRemoteId: number): Promise<void> {
  const localTasks = (await listTasks(true)).filter((task) => shouldSyncTask(task, userRemoteId));

  const pendingDeletes = localTasks.filter(
    (task) => task.sync_status === 'pending_delete' && task.remote_id !== null,
  );
  const pendingCreates = localTasks.filter(
    (task) => task.sync_status === 'pending_create' && !task.deleted_at,
  );
  const pendingUpdates = localTasks.filter(
    (task) => task.sync_status === 'pending_update' && task.remote_id !== null && !task.deleted_at,
  );

  for (const task of pendingDeletes) {
    await tasksApi.delete(token, task.remote_id!);
    await hardDeleteTask(task.local_id);
  }

  for (const task of pendingCreates) {
    const response = await tasksApi.create(token, {
      titulo: task.titulo,
      hora_inicio: task.hora_inicio,
      estado: task.estado,
      completed_at: task.completed_at,
    });

    await markTaskAsSynced(task.local_id, response.data, userRemoteId);
  }

  for (const task of pendingUpdates) {
    const response = await tasksApi.update(token, task.remote_id!, {
      titulo: task.titulo,
      hora_inicio: task.hora_inicio,
      estado: task.estado,
      completed_at: task.completed_at,
    });

    await markTaskAsSynced(task.local_id, response.data, userRemoteId);
  }

  await pullTasks(token, userRemoteId);
}
