import type { RemoteHabitRecord } from '@/services';

import { getDatabase } from '../client';
import { getHabitByRemoteId } from './habits-repository';

export type HabitRecord = {
  local_id: string;
  remote_id: number | null;
  habito_local_id: string;
  fecha: string;
  completado: boolean;
  observacion: string | null;
  created_at: string | null;
  updated_at: string | null;
  sync_status: string;
};

export type SaveHabitRecordInput = {
  habitoLocalId: string;
  fecha?: string;
  completado: boolean;
  observacion?: string | null;
};

function createLocalId(): string {
  return `habit-record-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeFecha(value?: string): string {
  const fecha = (value ?? new Date().toISOString().slice(0, 10)).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new Error('La fecha debe tener formato YYYY-MM-DD.');
  }

  return fecha;
}

function normalizeObservacion(value?: string | null): string | null {
  const normalized = value?.trim() ?? '';
  return normalized ? normalized : null;
}

function mapRow(row: HabitRecordRow): HabitRecord {
  return {
    ...row,
    completado: row.completado === 1,
  };
}

type HabitRecordRow = Omit<HabitRecord, 'completado'> & {
  completado: 0 | 1;
};

export async function listHabitRecords(): Promise<HabitRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<HabitRecordRow>(
    `
      SELECT
        local_id,
        remote_id,
        habito_local_id,
        fecha,
        completado,
        observacion,
        created_at,
        updated_at,
        sync_status
      FROM registro_habitos
      ORDER BY fecha DESC, datetime(updated_at) DESC;
    `,
  );

  return rows.map(mapRow);
}

export async function saveHabitRecord(input: SaveHabitRecordInput): Promise<HabitRecord> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();
  const fecha = normalizeFecha(input.fecha);
  const observacion = normalizeObservacion(input.observacion);
  const existingRecord = (await listHabitRecords()).find(
    (item) => item.habito_local_id === input.habitoLocalId && item.fecha === fecha,
  );

  const record: HabitRecord = {
    local_id: existingRecord?.local_id ?? createLocalId(),
    remote_id: existingRecord?.remote_id ?? null,
    habito_local_id: input.habitoLocalId,
    fecha,
    completado: input.completado,
    observacion,
    created_at: existingRecord?.created_at ?? timestamp,
    updated_at: timestamp,
    sync_status: existingRecord ? 'pending_update' : 'pending_create',
  };

  if (existingRecord) {
    await db.runAsync(
      `
        UPDATE registro_habitos
        SET
          completado = ?,
          observacion = ?,
          updated_at = ?,
          sync_status = ?
        WHERE local_id = ?;
      `,
      [
        record.completado ? 1 : 0,
        record.observacion,
        record.updated_at,
        record.sync_status,
        record.local_id,
      ],
    );
  } else {
    await db.runAsync(
      `
        INSERT INTO registro_habitos (
          local_id, remote_id, habito_local_id, fecha, completado, observacion, created_at, updated_at, sync_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        record.local_id,
        record.remote_id,
        record.habito_local_id,
        record.fecha,
        record.completado ? 1 : 0,
        record.observacion,
        record.created_at,
        record.updated_at,
        record.sync_status,
      ],
    );
  }

  return record;
}

export async function getHabitRecordByRemoteId(remoteId: number): Promise<HabitRecord | null> {
  const records = await listHabitRecords();

  return records.find((record) => record.remote_id === remoteId) ?? null;
}

export async function getHabitRecordByUniqueKey(
  habitoLocalId: string,
  fecha: string,
): Promise<HabitRecord | null> {
  const records = await listHabitRecords();

  return records.find(
    (record) => record.habito_local_id === habitoLocalId && record.fecha === fecha,
  ) ?? null;
}

export async function markHabitRecordAsSynced(
  localId: string,
  remoteRecord: RemoteHabitRecord,
  habitLocalId: string,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE registro_habitos
      SET remote_id = ?, habito_local_id = ?, fecha = ?, completado = ?, observacion = ?, created_at = ?, updated_at = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    [
      remoteRecord.id,
      habitLocalId,
      remoteRecord.fecha,
      remoteRecord.completado ? 1 : 0,
      remoteRecord.observacion,
      remoteRecord.created_at,
      remoteRecord.updated_at,
      'synced',
      localId,
    ],
  );
}

export async function upsertHabitRecordFromRemote(
  remoteRecord: RemoteHabitRecord,
): Promise<HabitRecord | null> {
  const habit = await getHabitByRemoteId(remoteRecord.habito_id);

  if (!habit) {
    return null;
  }

  const existingRecord =
    (await getHabitRecordByRemoteId(remoteRecord.id)) ??
    (await getHabitRecordByUniqueKey(habit.local_id, remoteRecord.fecha));

  if (existingRecord) {
    await markHabitRecordAsSynced(existingRecord.local_id, remoteRecord, habit.local_id);

    return {
      ...existingRecord,
      remote_id: remoteRecord.id,
      habito_local_id: habit.local_id,
      fecha: remoteRecord.fecha,
      completado: remoteRecord.completado,
      observacion: remoteRecord.observacion,
      created_at: remoteRecord.created_at,
      updated_at: remoteRecord.updated_at,
      sync_status: 'synced',
    };
  }

  const db = await getDatabase();
  const localId = `remote-habit-record-${remoteRecord.id}`;

  await db.runAsync(
    `
      INSERT INTO registro_habitos (
        local_id, remote_id, habito_local_id, fecha, completado, observacion, created_at, updated_at, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      localId,
      remoteRecord.id,
      habit.local_id,
      remoteRecord.fecha,
      remoteRecord.completado ? 1 : 0,
      remoteRecord.observacion,
      remoteRecord.created_at,
      remoteRecord.updated_at,
      'synced',
    ],
  );

  return {
    local_id: localId,
    remote_id: remoteRecord.id,
    habito_local_id: habit.local_id,
    fecha: remoteRecord.fecha,
    completado: remoteRecord.completado,
    observacion: remoteRecord.observacion,
    created_at: remoteRecord.created_at,
    updated_at: remoteRecord.updated_at,
    sync_status: 'synced',
  };
}

export async function hardDeleteHabitRecord(localId: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM registro_habitos
      WHERE local_id = ?;
    `,
    [localId],
  );
}
