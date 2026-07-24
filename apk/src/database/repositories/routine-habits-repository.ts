import { getDatabase } from '../client';

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

  await db.runAsync(
    `
      DELETE FROM rutina_habitos
      WHERE local_id = ?;
    `,
    [localId],
  );
}
