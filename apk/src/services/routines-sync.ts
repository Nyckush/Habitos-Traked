import {
  listRoutineDays,
  listRoutines,
  markRoutineAsSynced,
  ROUTINE_DAY_OPTIONS,
  type Routine,
  type RoutineDayValue,
  upsertRoutineFromRemote,
} from '@/database';

import { routinesApi } from './api';

function shouldSyncRoutine(routine: Routine, userRemoteId: number): boolean {
  return routine.user_remote_id === null || routine.user_remote_id === userRemoteId;
}

function normalizeDays(days: string[]): RoutineDayValue[] {
  return Array.from(
    new Set(days.filter((day): day is RoutineDayValue => ROUTINE_DAY_OPTIONS.includes(day as RoutineDayValue))),
  );
}

export async function pullRoutines(token: string, userRemoteId: number): Promise<void> {
  const response = await routinesApi.list(token);

  for (const remoteRoutine of response.data) {
    await upsertRoutineFromRemote(remoteRoutine, userRemoteId);
  }
}

export async function syncRoutines(token: string, userRemoteId: number): Promise<void> {
  const localRoutines = (await listRoutines()).filter((routine) => shouldSyncRoutine(routine, userRemoteId));
  const localDays = await listRoutineDays();

  const pendingDeletes = localRoutines.filter(
    (routine) => routine.sync_status === 'pending_delete' && routine.remote_id !== null,
  );
  const pendingCreates = localRoutines.filter(
    (routine) => routine.sync_status === 'pending_create' && !routine.deleted_at,
  );
  const pendingUpdates = localRoutines.filter(
    (routine) =>
      routine.sync_status === 'pending_update' && routine.remote_id !== null && !routine.deleted_at,
  );

  for (const routine of pendingDeletes) {
    await routinesApi.delete(token, routine.remote_id!);
  }

  for (const routine of pendingCreates) {
    const days = normalizeDays(
      localDays
        .filter((day) => day.rutina_local_id === routine.local_id)
        .map((day) => day.dia_semana),
    );

    const response = await routinesApi.create(token, {
      nombre: routine.nombre,
      dias: days,
    });

    await markRoutineAsSynced(routine.local_id, response.data, userRemoteId);
  }

  for (const routine of pendingUpdates) {
    const days = normalizeDays(
      localDays
        .filter((day) => day.rutina_local_id === routine.local_id)
        .map((day) => day.dia_semana),
    );

    const response = await routinesApi.update(token, routine.remote_id!, {
      nombre: routine.nombre,
      dias: days,
    });

    await markRoutineAsSynced(routine.local_id, response.data, userRemoteId);
  }

  await pullRoutines(token, userRemoteId);
}
