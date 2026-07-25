import type { RemoteRoutineHabitLink } from '@/services';

import { getDatabase } from '../client';
import { getHabitByRemoteId } from './habits-repository';
import { getRoutineByRemoteId } from './routines-repository';

export type RoutineHabitLink = {
  local_id: string;
  remote_id: number | null;
  rutina_local_id: string;
  habito_local_id: string;
  hora_inicio: string | null;
  sync_status: string;
};

export type CreateRoutineHabitLinkInput = {
  rutinaLocalId: string;
  habitoLocalId: string;
  horaInicio?: string | null;
};

export type UpdateRoutineHabitLinkInput = {
  localId: string;
  horaInicio?: string | null;
};

function createLocalId(): string {
  return `routine-habit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeHoraInicio(value?: string | null): string | null {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    return null;
  }

  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    throw new Error('La hora debe tener formato HH:MM.');
  }

  return normalized;
}

export async function listRoutineHabitLinks(): Promise<RoutineHabitLink[]> {
  const db = await getDatabase();

  return db.getAllAsync<RoutineHabitLink>(
    `
      SELECT
        local_id,
        remote_id,
        rutina_local_id,
        habito_local_id,
        hora_inicio,
        sync_status
      FROM rutina_habitos
      ORDER BY
        CASE WHEN hora_inicio IS NULL THEN 1 ELSE 0 END,
        hora_inicio ASC;
    `,
  );
}

export async function createRoutineHabitLink(
  input: CreateRoutineHabitLinkInput,
): Promise<RoutineHabitLink> {
  const db = await getDatabase();
  const existingLinks = await listRoutineHabitLinks();

  const duplicate = existingLinks.find(
    (link) =>
      link.rutina_local_id === input.rutinaLocalId &&
      link.habito_local_id === input.habitoLocalId,
  );

  if (duplicate) {
    throw new Error('Ese habito ya esta vinculado a la rutina.');
  }

  const link: RoutineHabitLink = {
    local_id: createLocalId(),
    remote_id: null,
    rutina_local_id: input.rutinaLocalId,
    habito_local_id: input.habitoLocalId,
    hora_inicio: normalizeHoraInicio(input.horaInicio),
    sync_status: 'pending_create',
  };

  await db.runAsync(
    `
      INSERT INTO rutina_habitos (
        local_id, remote_id, rutina_local_id, habito_local_id, hora_inicio, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?);
    `,
    [
      link.local_id,
      link.remote_id,
      link.rutina_local_id,
      link.habito_local_id,
      link.hora_inicio,
      link.sync_status,
    ],
  );

  return link;
}

export async function updateRoutineHabitLink(
  input: UpdateRoutineHabitLinkInput,
): Promise<void> {
  const db = await getDatabase();
  const existingLinks = await listRoutineHabitLinks();
  const currentLink = existingLinks.find((link) => link.local_id === input.localId);

  if (!currentLink) {
    throw new Error('No se encontro el vinculo de la rutina.');
  }

  const nextSyncStatus =
    currentLink.sync_status === 'pending_create' ? 'pending_create' : 'pending_update';

  await db.runAsync(
    `
      UPDATE rutina_habitos
      SET hora_inicio = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    [normalizeHoraInicio(input.horaInicio), nextSyncStatus, input.localId],
  );
}

export async function deleteRoutineHabitLink(localId: string): Promise<void> {
  const db = await getDatabase();
  const existingLinks = await listRoutineHabitLinks();
  const currentLink = existingLinks.find((link) => link.local_id === localId);

  if (!currentLink) {
    return;
  }

  if (currentLink.remote_id === null) {
    await db.runAsync(
      `
        DELETE FROM rutina_habitos
        WHERE local_id = ?;
      `,
      [localId],
    );
    return;
  }

  await db.runAsync(
    `
      UPDATE rutina_habitos
      SET sync_status = ?
      WHERE local_id = ?;
    `,
    ['pending_delete', localId],
  );
}

export async function hardDeleteRoutineHabitLink(localId: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM rutina_habitos
      WHERE local_id = ?;
    `,
    [localId],
  );
}

export async function getRoutineHabitLinkByRemoteId(
  remoteId: number,
): Promise<RoutineHabitLink | null> {
  const links = await listRoutineHabitLinks();

  return links.find((link) => link.remote_id === remoteId) ?? null;
}

export async function markRoutineHabitLinkAsSynced(
  localId: string,
  remoteLink: RemoteRoutineHabitLink,
  routineLocalId: string,
  habitLocalId: string,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE rutina_habitos
      SET remote_id = ?, rutina_local_id = ?, habito_local_id = ?, hora_inicio = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    [
      remoteLink.id,
      routineLocalId,
      habitLocalId,
      remoteLink.hora_inicio,
      'synced',
      localId,
    ],
  );
}

export async function upsertRoutineHabitLinkFromRemote(
  remoteLink: RemoteRoutineHabitLink,
): Promise<RoutineHabitLink | null> {
  const [existingLink, routine, habit] = await Promise.all([
    getRoutineHabitLinkByRemoteId(remoteLink.id),
    getRoutineByRemoteId(remoteLink.rutina_id),
    getHabitByRemoteId(remoteLink.habito_id),
  ]);

  if (!routine || !habit) {
    return null;
  }

  if (existingLink) {
    await markRoutineHabitLinkAsSynced(
      existingLink.local_id,
      remoteLink,
      routine.local_id,
      habit.local_id,
    );

    return {
      ...existingLink,
      remote_id: remoteLink.id,
      rutina_local_id: routine.local_id,
      habito_local_id: habit.local_id,
      hora_inicio: remoteLink.hora_inicio,
      sync_status: 'synced',
    };
  }

  const db = await getDatabase();
  const localId = `remote-routine-habit-${remoteLink.id}`;

  await db.runAsync(
    `
      INSERT INTO rutina_habitos (
        local_id, remote_id, rutina_local_id, habito_local_id, hora_inicio, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?);
    `,
    [
      localId,
      remoteLink.id,
      routine.local_id,
      habit.local_id,
      remoteLink.hora_inicio,
      'synced',
    ],
  );

  return {
    local_id: localId,
    remote_id: remoteLink.id,
    rutina_local_id: routine.local_id,
    habito_local_id: habit.local_id,
    hora_inicio: remoteLink.hora_inicio,
    sync_status: 'synced',
  };
}
