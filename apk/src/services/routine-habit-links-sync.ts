import {
  getHabitById,
  getRoutineById,
  hardDeleteRoutineHabitLink,
  listRoutineHabitLinks,
  markRoutineHabitLinkAsSynced,
  upsertRoutineHabitLinkFromRemote,
  type RoutineHabitLink,
} from '@/database';

import { routineHabitLinksApi } from './api';

function shouldSyncLink(link: RoutineHabitLink, routineLocalIds: Set<string>, habitLocalIds: Set<string>): boolean {
  return routineLocalIds.has(link.rutina_local_id) && habitLocalIds.has(link.habito_local_id);
}

export async function pullRoutineHabitLinks(token: string): Promise<void> {
  const response = await routineHabitLinksApi.list(token);

  for (const remoteLink of response.data) {
    await upsertRoutineHabitLinkFromRemote(remoteLink);
  }
}

export async function syncRoutineHabitLinks(token: string): Promise<void> {
  const links = await listRoutineHabitLinks();

  const syncedRoutines = new Set<string>();
  const syncedHabits = new Set<string>();

  for (const link of links) {
    const routine = await getRoutineByRemoteIdFromLocalLink(link);
    const habit = await getHabitByRemoteIdFromLocalLink(link);

    if (routine) {
      syncedRoutines.add(link.rutina_local_id);
    }

    if (habit) {
      syncedHabits.add(link.habito_local_id);
    }
  }

  const localLinks = links.filter((link) => shouldSyncLink(link, syncedRoutines, syncedHabits));

  const pendingDeletes = localLinks.filter(
    (link) => link.sync_status === 'pending_delete' && link.remote_id !== null,
  );
  const pendingCreates = localLinks.filter(
    (link) => link.sync_status === 'pending_create',
  );
  const pendingUpdates = localLinks.filter(
    (link) => link.sync_status === 'pending_update' && link.remote_id !== null,
  );

  for (const link of pendingDeletes) {
    await routineHabitLinksApi.delete(token, link.remote_id!);
    await hardDeleteRoutineHabitLink(link.local_id);
  }

  for (const link of pendingCreates) {
    const routine = await getRoutineByRemoteIdFromLocalLink(link);
    const habit = await getHabitByRemoteIdFromLocalLink(link);

    if (!routine?.remote_id || !habit?.remote_id) {
      continue;
    }

    const response = await routineHabitLinksApi.create(token, {
      rutina_id: routine.remote_id,
      habito_id: habit.remote_id,
      hora_inicio: link.hora_inicio,
    });

    await markRoutineHabitLinkAsSynced(
      link.local_id,
      response.data,
      routine.local_id,
      habit.local_id,
    );
  }

  for (const link of pendingUpdates) {
    const routine = await getRoutineByRemoteIdFromLocalLink(link);
    const habit = await getHabitByRemoteIdFromLocalLink(link);

    if (!routine || !habit) {
      continue;
    }

    const response = await routineHabitLinksApi.update(token, link.remote_id!, {
      hora_inicio: link.hora_inicio,
    });

    await markRoutineHabitLinkAsSynced(
      link.local_id,
      response.data,
      routine.local_id,
      habit.local_id,
    );
  }

  await pullRoutineHabitLinks(token);
}

async function getRoutineByRemoteIdFromLocalLink(link: RoutineHabitLink) {
  return getRoutineById(link.rutina_local_id);
}

async function getHabitByRemoteIdFromLocalLink(link: RoutineHabitLink) {
  return getHabitById(link.habito_local_id);
}
