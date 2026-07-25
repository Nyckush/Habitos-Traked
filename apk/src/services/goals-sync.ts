import {
  getHabitById,
  getMetaById,
  hardDeleteObjetivo,
  listMetas,
  listObjetivoHabitos,
  listObjetivos,
  markMetaAsSynced,
  markObjetivoAsSynced,
  type Meta,
  type Objetivo,
  upsertMetaFromRemote,
  upsertObjetivoFromRemote,
} from '@/database';

import { metasApi, objetivosApi } from './api';
import { pullObjetivoHabitoLinks, syncObjetivoHabitoLinks } from './objective-habit-links-sync';

function shouldSyncMeta(meta: Meta, userRemoteId: number): boolean {
  return meta.user_remote_id === null || meta.user_remote_id === userRemoteId;
}

function shouldSyncObjetivo(objetivo: Objetivo, userRemoteId: number): boolean {
  return objetivo.user_remote_id === null || objetivo.user_remote_id === userRemoteId;
}

export async function pullMetas(token: string, userRemoteId: number): Promise<void> {
  const response = await metasApi.list(token);

  for (const remoteMeta of response.data) {
    await upsertMetaFromRemote(remoteMeta, userRemoteId);
  }
}

export async function pullObjetivos(token: string, userRemoteId: number): Promise<void> {
  const response = await objetivosApi.list(token);
  const remoteIds = new Set<number>();

  for (const remoteObjetivo of response.data) {
    remoteIds.add(remoteObjetivo.id);
    await upsertObjetivoFromRemote(remoteObjetivo, userRemoteId);
  }

  const localObjetivos = await listObjetivos(true);

  for (const localObjetivo of localObjetivos) {
    if (localObjetivo.remote_id !== null && !remoteIds.has(localObjetivo.remote_id)) {
      await hardDeleteObjetivo(localObjetivo.local_id);
    }
  }
}

export async function pullGoals(token: string, userRemoteId: number): Promise<void> {
  await pullMetas(token, userRemoteId);
  await pullObjetivos(token, userRemoteId);
  await pullObjetivoHabitoLinks(token);
}

export async function syncMetas(token: string, userRemoteId: number): Promise<void> {
  const metas = (await listMetas()).filter((meta) => shouldSyncMeta(meta, userRemoteId));
  const pendingCreates = metas.filter((meta) => meta.sync_status === 'pending_create');
  const pendingUpdates = metas.filter(
    (meta) => meta.sync_status === 'pending_update' && meta.remote_id !== null,
  );

  for (const meta of pendingCreates) {
    const response = await metasApi.create(token, {
      nombre: meta.nombre,
      fecha_inicio: meta.fecha_inicio ?? new Date().toISOString().slice(0, 10),
    });

    await markMetaAsSynced(meta.local_id, response.data, userRemoteId);
  }

  for (const meta of pendingUpdates) {
    const response = await metasApi.update(token, meta.remote_id!, {
      nombre: meta.nombre,
      fecha_inicio: meta.fecha_inicio ?? new Date().toISOString().slice(0, 10),
    });

    await markMetaAsSynced(meta.local_id, response.data, userRemoteId);
  }

  await pullMetas(token, userRemoteId);
}

export async function syncObjetivos(token: string, userRemoteId: number): Promise<void> {
  const objetivos = (await listObjetivos(true)).filter((objetivo) =>
    shouldSyncObjetivo(objetivo, userRemoteId),
  );

  const pendingDeletes = objetivos.filter(
    (objetivo) => objetivo.sync_status === 'pending_delete' && objetivo.remote_id !== null,
  );
  const pendingCreates = objetivos.filter((objetivo) => objetivo.sync_status === 'pending_create');
  const pendingUpdates = objetivos.filter(
    (objetivo) => objetivo.sync_status === 'pending_update' && objetivo.remote_id !== null,
  );

  for (const objetivo of pendingDeletes) {
    await objetivosApi.delete(token, objetivo.remote_id!);
    await hardDeleteObjetivo(objetivo.local_id);
  }

  for (const objetivo of pendingCreates) {
    const payload = await buildObjetivoPayload(objetivo);

    if (!payload) {
      continue;
    }

    const response = await objetivosApi.create(token, payload);
    await markObjetivoAsSynced(
      objetivo.local_id,
      response.data,
      userRemoteId,
      objetivo.meta_local_id ?? null,
      payload.habito_ids
        .map((remoteId) => payload.habitsByRemoteId.get(remoteId) ?? null)
        .filter((value): value is string => value !== null),
    );
  }

  for (const objetivo of pendingUpdates) {
    const payload = await buildObjetivoPayload(objetivo);

    if (!payload) {
      continue;
    }

    const response = await objetivosApi.update(token, objetivo.remote_id!, payload);
    await markObjetivoAsSynced(
      objetivo.local_id,
      response.data,
      userRemoteId,
      objetivo.meta_local_id ?? null,
      payload.habito_ids
        .map((remoteId) => payload.habitsByRemoteId.get(remoteId) ?? null)
        .filter((value): value is string => value !== null),
    );
  }

  await pullObjetivos(token, userRemoteId);
}

export async function syncGoals(token: string, userRemoteId: number): Promise<void> {
  await syncMetas(token, userRemoteId);
  await syncObjetivos(token, userRemoteId);
  await syncObjetivoHabitoLinks(token);
  await pullGoals(token, userRemoteId);
}

async function buildObjetivoPayload(objetivo: Objetivo) {
  const meta = objetivo.meta_local_id ? await getMetaById(objetivo.meta_local_id) : null;
  const objetivoHabitos = await listObjetivoHabitos();
  const habitoLocalIds = objetivoHabitos
    .filter((item) => item.objetivo_local_id === objetivo.local_id)
    .map((item) => item.habito_local_id);

  const habitsByRemoteId = new Map<number, string>();
  const remoteHabitIds: number[] = [];

  for (const habitoLocalId of habitoLocalIds) {
    const habit = await getHabitById(habitoLocalId);

    if (!habit?.remote_id) {
      return null;
    }

    habitsByRemoteId.set(habit.remote_id, habit.local_id);
    remoteHabitIds.push(habit.remote_id);
  }

  if (objetivo.meta_local_id && !meta?.remote_id) {
    return null;
  }

  return {
    meta_id: meta?.remote_id ?? null,
    nombre: objetivo.nombre,
    meta_esperada: objetivo.meta_esperada,
    fecha_limite: objetivo.fecha_limite,
    habito_ids: remoteHabitIds,
    habitsByRemoteId,
  };
}
