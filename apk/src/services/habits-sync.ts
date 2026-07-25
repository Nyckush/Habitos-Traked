import {
  listHabits,
  markHabitAsSynced,
  type Habit,
  upsertHabitFromRemote,
} from '@/database';

import { habitsApi } from './api';

function shouldSyncHabit(habit: Habit, userRemoteId: number): boolean {
  return habit.user_remote_id === null || habit.user_remote_id === userRemoteId;
}

export async function pullHabits(token: string, userRemoteId: number): Promise<void> {
  const response = await habitsApi.list(token);

  for (const remoteHabit of response.data) {
    await upsertHabitFromRemote(remoteHabit, userRemoteId);
  }
}

export async function syncHabits(token: string, userRemoteId: number): Promise<void> {
  const localHabits = (await listHabits()).filter((habit) => shouldSyncHabit(habit, userRemoteId));

  const pendingDeletes = localHabits.filter(
    (habit) => habit.sync_status === 'pending_delete' && habit.remote_id !== null,
  );
  const pendingCreates = localHabits.filter(
    (habit) => habit.sync_status === 'pending_create' && !habit.deleted_at,
  );
  const pendingUpdates = localHabits.filter(
    (habit) =>
      habit.sync_status === 'pending_update' && habit.remote_id !== null && !habit.deleted_at,
  );

  for (const habit of pendingDeletes) {
    await habitsApi.delete(token, habit.remote_id!);
  }

  for (const habit of pendingCreates) {
    const response = await habitsApi.create(token, { nombre: habit.nombre });
    await markHabitAsSynced(habit.local_id, response.data, userRemoteId);
  }

  for (const habit of pendingUpdates) {
    const response = await habitsApi.update(token, habit.remote_id!, { nombre: habit.nombre });
    await markHabitAsSynced(habit.local_id, response.data, userRemoteId);
  }

  await pullHabits(token, userRemoteId);
}
