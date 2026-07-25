import {
  getHabitById,
  getObjetivoById,
  hardDeleteObjetivoHabito,
  listObjetivoHabitos,
  markObjetivoHabitoAsSynced,
  upsertObjetivoHabitoFromRemote,
  type ObjetivoHabito,
} from '@/database';

import { objetivoHabitoLinksApi } from './api';

function shouldSyncLink(
  link: ObjetivoHabito,
  objetivoLocalIds: Set<string>,
  habitLocalIds: Set<string>,
): boolean {
  return (
    objetivoLocalIds.has(link.objetivo_local_id) && habitLocalIds.has(link.habito_local_id)
  );
}

export async function pullObjetivoHabitoLinks(token: string): Promise<void> {
  const response = await objetivoHabitoLinksApi.list(token);
  const remoteIds = new Set<number>();

  for (const remoteLink of response.data) {
    remoteIds.add(remoteLink.id);
    await upsertObjetivoHabitoFromRemote(remoteLink);
  }

  const localLinks = await listObjetivoHabitos();

  for (const localLink of localLinks) {
    if (localLink.remote_id !== null && !remoteIds.has(localLink.remote_id)) {
      await hardDeleteObjetivoHabito(localLink.local_id);
    }
  }
}

export async function syncObjetivoHabitoLinks(token: string): Promise<void> {
  const links = await listObjetivoHabitos();

  const syncedObjetivos = new Set<string>();
  const syncedHabitos = new Set<string>();

  for (const link of links) {
    const [objetivo, habit] = await Promise.all([
      getObjetivoById(link.objetivo_local_id),
      getHabitById(link.habito_local_id),
    ]);

    if (objetivo?.remote_id) {
      syncedObjetivos.add(link.objetivo_local_id);
    }

    if (habit?.remote_id) {
      syncedHabitos.add(link.habito_local_id);
    }
  }

  const localLinks = links.filter((link) => shouldSyncLink(link, syncedObjetivos, syncedHabitos));
  const pendingCreates = localLinks.filter((link) => link.sync_status === 'pending_create');
  const pendingDeletes = localLinks.filter(
    (link) => link.sync_status === 'pending_delete' && link.remote_id !== null,
  );

  for (const link of pendingDeletes) {
    await objetivoHabitoLinksApi.delete(token, link.remote_id!);
    await hardDeleteObjetivoHabito(link.local_id);
  }

  for (const link of pendingCreates) {
    const [objetivo, habit] = await Promise.all([
      getObjetivoById(link.objetivo_local_id),
      getHabitById(link.habito_local_id),
    ]);

    if (!objetivo?.remote_id || !habit?.remote_id) {
      continue;
    }

    const response = await objetivoHabitoLinksApi.create(token, {
      objetivo_id: objetivo.remote_id,
      habito_id: habit.remote_id,
    });

    await markObjetivoHabitoAsSynced(
      link.local_id,
      response.data,
      objetivo.local_id,
      habit.local_id,
    );
  }

  await pullObjetivoHabitoLinks(token);
}
