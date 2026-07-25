import {
  hardDeleteHabitRecord,
  listHabitRecords,
  listHabits,
  markHabitRecordAsSynced,
  upsertHabitRecordFromRemote,
} from '@/database';

import { habitRecordsApi } from './api';

export async function pullHabitRecords(token: string): Promise<void> {
  const response = await habitRecordsApi.list(token);
  const remoteIds = new Set<number>();

  for (const remoteRecord of response.data) {
    remoteIds.add(remoteRecord.id);
    await upsertHabitRecordFromRemote(remoteRecord);
  }

  const localRecords = await listHabitRecords();

  for (const localRecord of localRecords) {
    if (localRecord.remote_id !== null && !remoteIds.has(localRecord.remote_id)) {
      await hardDeleteHabitRecord(localRecord.local_id);
    }
  }
}

export async function syncHabitRecords(token: string): Promise<void> {
  const localHabits = await listHabits();
  const syncedHabitLocalIds = new Set(
    localHabits.filter((habit) => habit.remote_id !== null).map((habit) => habit.local_id),
  );
  const localRecords = (await listHabitRecords()).filter((record) =>
    syncedHabitLocalIds.has(record.habito_local_id),
  );

  const pendingCreates = localRecords.filter((record) => record.sync_status === 'pending_create');
  const pendingUpdates = localRecords.filter(
    (record) => record.sync_status === 'pending_update' && record.remote_id !== null,
  );

  for (const record of pendingCreates) {
    const habit = localHabits.find((item) => item.local_id === record.habito_local_id);

    if (!habit?.remote_id) {
      continue;
    }

    const response = await habitRecordsApi.create(token, {
      habito_id: habit.remote_id,
      fecha: record.fecha,
      completado: record.completado,
      observacion: record.observacion,
    });

    await markHabitRecordAsSynced(record.local_id, response.data, habit.local_id);
  }

  for (const record of pendingUpdates) {
    const response = await habitRecordsApi.update(token, record.remote_id!, {
      completado: record.completado,
      observacion: record.observacion,
    });

    await markHabitRecordAsSynced(record.local_id, response.data, record.habito_local_id);
  }

  await pullHabitRecords(token);
}
