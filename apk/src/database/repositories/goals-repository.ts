import type { RemoteMeta, RemoteObjetivo, RemoteObjetivoHabitoLink } from '@/services';

import { getDatabase } from '../client';
import { listHabitRecords, type HabitRecord } from './habit-records-repository';
import { getHabitByRemoteId } from './habits-repository';

export type Meta = {
  local_id: string;
  remote_id: number | null;
  user_remote_id: number | null;
  nombre: string;
  fecha_inicio: string | null;
  created_at: string | null;
  updated_at: string | null;
  sync_status: string;
};

export type Objetivo = {
  local_id: string;
  remote_id: number | null;
  user_remote_id: number | null;
  meta_local_id: string | null;
  nombre: string;
  meta_esperada: number;
  fecha_limite: string;
  created_at: string | null;
  updated_at: string | null;
  sync_status: string;
};

export type ObjetivoHabito = {
  local_id: string;
  remote_id: number | null;
  objetivo_local_id: string;
  habito_local_id: string;
  created_at: string | null;
  updated_at: string | null;
  sync_status: string;
};

export type ObjetivoWithProgress = Objetivo & {
  habitos_local_ids: string[];
  meta_actual: number;
  tasa_exito: number;
  estado: string;
};

export type MetaWithEstado = Meta & {
  estado: string;
};

export type CreateMetaInput = {
  userRemoteId?: number | null;
  nombre: string;
  fechaInicio?: string | null;
};

export type UpdateMetaInput = {
  localId: string;
  nombre: string;
};

export type CreateObjetivoInput = {
  userRemoteId?: number | null;
  metaLocalId?: string | null;
  habitoLocalIds?: string[];
  habitoLocalId?: string;
  nombre: string;
  metaEsperada: number;
  fechaLimite: string;
};

export type UpdateObjetivoInput = {
  localId: string;
  habitoLocalIds: string[];
  nombre: string;
  metaEsperada: number;
  fechaLimite: string;
};

function createLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDate(value: string | null | undefined, fallback: string): string {
  const normalized = (value ?? fallback).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error('La fecha debe tener formato YYYY-MM-DD.');
  }

  return normalized;
}

function calculateMetaActual(
  objetivo: Objetivo,
  objetivoHabitos: ObjetivoHabito[],
  records: HabitRecord[],
): number {
  if (!objetivo.created_at) {
    return 0;
  }

  const start = objetivo.created_at.slice(0, 10);
  const habitosLocalIds = objetivoHabitos
    .filter((item) => item.objetivo_local_id === objetivo.local_id)
    .map((item) => item.habito_local_id);

  return records.filter(
    (record) =>
      habitosLocalIds.includes(record.habito_local_id) &&
      record.completado &&
      record.fecha >= start &&
      record.fecha <= objetivo.fecha_limite,
  ).length;
}

function decorateObjetivo(
  objetivo: Objetivo,
  objetivoHabitos: ObjetivoHabito[],
  records: HabitRecord[],
): ObjetivoWithProgress {
  const habitosLocalIds = objetivoHabitos
    .filter((item) => item.objetivo_local_id === objetivo.local_id)
    .map((item) => item.habito_local_id);
  const metaActual = calculateMetaActual(objetivo, objetivoHabitos, records);
  const tasaExito =
    Math.round((metaActual / Math.max(1, objetivo.meta_esperada)) * 10000) / 100;
  const today = todayString();

  let estado = 'En Progreso';

  if (metaActual >= objetivo.meta_esperada) {
    estado = 'Realizado con Exito';
  } else if (today > objetivo.fecha_limite) {
    estado = 'Vencido';
  } else if (metaActual > 0) {
    estado = 'Completado Parcialmente';
  }

  return {
    ...objetivo,
    habitos_local_ids: habitosLocalIds,
    meta_actual: metaActual,
    tasa_exito: tasaExito,
    estado,
  };
}

function decorateMeta(meta: Meta, objetivos: ObjetivoWithProgress[]): MetaWithEstado {
  const related = objetivos.filter((objetivo) => objetivo.meta_local_id === meta.local_id);

  if (related.length === 0) {
    return { ...meta, estado: 'En Progreso' };
  }

  const estados = related.map((objetivo) => objetivo.estado);

  if (estados.every((estado) => estado === 'Realizado con Exito')) {
    return { ...meta, estado: 'Completada' };
  }

  if (
    estados.some(
      (estado) => estado === 'En Progreso' || estado === 'Completado Parcialmente',
    )
  ) {
    return { ...meta, estado: 'En Progreso' };
  }

  return { ...meta, estado: 'Incompleta' };
}

async function replaceObjetivoHabitos(
  objetivoLocalId: string,
  habitoLocalIds: string[],
  syncStatus: string,
  timestamp: string,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM objetivo_habitos
      WHERE objetivo_local_id = ?;
    `,
    [objetivoLocalId],
  );

  for (const habitoLocalId of habitoLocalIds) {
    const objetivoHabito: ObjetivoHabito = {
      local_id: createLocalId('objetivo-habito'),
      remote_id: null,
      objetivo_local_id: objetivoLocalId,
      habito_local_id: habitoLocalId,
      created_at: timestamp,
      updated_at: timestamp,
      sync_status: syncStatus,
    };

    await db.runAsync(
      `
        INSERT INTO objetivo_habitos (
          local_id, remote_id, objetivo_local_id, habito_local_id, created_at, updated_at, sync_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
      [
        objetivoHabito.local_id,
        objetivoHabito.remote_id,
        objetivoHabito.objetivo_local_id,
        objetivoHabito.habito_local_id,
        objetivoHabito.created_at,
        objetivoHabito.updated_at,
        objetivoHabito.sync_status,
      ],
    );
  }
}

export async function createMeta(input: CreateMetaInput): Promise<Meta> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();

  if (!input.nombre.trim()) {
    throw new Error('Escribi un nombre para la meta.');
  }

  const meta: Meta = {
    local_id: createLocalId('meta'),
    remote_id: null,
    user_remote_id: input.userRemoteId ?? null,
    nombre: input.nombre.trim(),
    fecha_inicio: normalizeDate(input.fechaInicio, todayString()),
    created_at: timestamp,
    updated_at: timestamp,
    sync_status: 'pending_create',
  };

  await db.runAsync(
    `
      INSERT INTO metas (
        local_id, remote_id, user_remote_id, nombre, fecha_inicio, created_at, updated_at, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      meta.local_id,
      meta.remote_id,
      meta.user_remote_id,
      meta.nombre,
      meta.fecha_inicio,
      meta.created_at,
      meta.updated_at,
      meta.sync_status,
    ],
  );

  return meta;
}

export async function listMetas(): Promise<Meta[]> {
  const db = await getDatabase();

  return db.getAllAsync<Meta>(
    `
      SELECT
        local_id,
        remote_id,
        user_remote_id,
        nombre,
        fecha_inicio,
        created_at,
        updated_at,
        sync_status
      FROM metas
      WHERE sync_status != 'pending_delete'
      ORDER BY datetime(created_at) ASC;
    `,
  );
}

export async function getMetaById(localId: string): Promise<Meta | null> {
  const metas = await listMetas();
  return metas.find((meta) => meta.local_id === localId) ?? null;
}

export async function getMetaByRemoteId(remoteId: number): Promise<Meta | null> {
  const metas = await listMetas();
  return metas.find((meta) => meta.remote_id === remoteId) ?? null;
}

export async function updateMeta(input: UpdateMetaInput): Promise<void> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();
  const currentMeta = await getMetaById(input.localId);

  if (!currentMeta) {
    throw new Error('No se encontro la meta.');
  }

  if (!input.nombre.trim()) {
    throw new Error('Escribi un nombre para la meta.');
  }

  const nextSyncStatus =
    currentMeta.sync_status === 'pending_create' ? 'pending_create' : 'pending_update';

  await db.runAsync(
    `
      UPDATE metas
      SET nombre = ?, updated_at = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    [input.nombre.trim(), timestamp, nextSyncStatus, input.localId],
  );
}

export async function markMetaAsSynced(
  localId: string,
  remoteMeta: RemoteMeta,
  userRemoteId: number,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE metas
      SET remote_id = ?, user_remote_id = ?, nombre = ?, fecha_inicio = ?, created_at = ?, updated_at = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    [
      remoteMeta.id,
      userRemoteId,
      remoteMeta.nombre,
      remoteMeta.fecha_inicio,
      remoteMeta.created_at,
      remoteMeta.updated_at,
      'synced',
      localId,
    ],
  );
}

export async function upsertMetaFromRemote(
  remoteMeta: RemoteMeta,
  userRemoteId: number,
): Promise<Meta> {
  const existingMeta = await getMetaByRemoteId(remoteMeta.id);

  if (existingMeta) {
    await markMetaAsSynced(existingMeta.local_id, remoteMeta, userRemoteId);

    return {
      ...existingMeta,
      remote_id: remoteMeta.id,
      user_remote_id: userRemoteId,
      nombre: remoteMeta.nombre,
      fecha_inicio: remoteMeta.fecha_inicio,
      created_at: remoteMeta.created_at,
      updated_at: remoteMeta.updated_at,
      sync_status: 'synced',
    };
  }

  const db = await getDatabase();
  const localId = `remote-meta-${remoteMeta.id}`;

  await db.runAsync(
    `
      INSERT INTO metas (
        local_id, remote_id, user_remote_id, nombre, fecha_inicio, created_at, updated_at, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      localId,
      remoteMeta.id,
      userRemoteId,
      remoteMeta.nombre,
      remoteMeta.fecha_inicio,
      remoteMeta.created_at,
      remoteMeta.updated_at,
      'synced',
    ],
  );

  return {
    local_id: localId,
    remote_id: remoteMeta.id,
    user_remote_id: userRemoteId,
    nombre: remoteMeta.nombre,
    fecha_inicio: remoteMeta.fecha_inicio,
    created_at: remoteMeta.created_at,
    updated_at: remoteMeta.updated_at,
    sync_status: 'synced',
  };
}

export async function createObjetivo(input: CreateObjetivoInput): Promise<Objetivo> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();
  const habitoLocalIds = Array.from(
    new Set(
      [input.habitoLocalId, ...(input.habitoLocalIds ?? [])].filter(
        (value): value is string => Boolean(value?.trim()),
      ),
    ),
  );

  if (!input.nombre.trim()) {
    throw new Error('Escribi un nombre para el objetivo.');
  }

  if (!Number.isInteger(input.metaEsperada) || input.metaEsperada < 1) {
    throw new Error('La meta esperada debe ser un numero entero mayor o igual a 1.');
  }

  if (habitoLocalIds.length === 0) {
    throw new Error('Selecciona al menos un habito para el objetivo.');
  }

  const objetivo: Objetivo = {
    local_id: createLocalId('objetivo'),
    remote_id: null,
    user_remote_id: input.userRemoteId ?? null,
    meta_local_id: input.metaLocalId ?? null,
    nombre: input.nombre.trim(),
    meta_esperada: input.metaEsperada,
    fecha_limite: normalizeDate(input.fechaLimite, todayString()),
    created_at: timestamp,
    updated_at: timestamp,
    sync_status: 'pending_create',
  };

  await db.runAsync(
    `
      INSERT INTO objetivos (
        local_id, remote_id, user_remote_id, meta_local_id, nombre, meta_esperada, fecha_limite, created_at, updated_at, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      objetivo.local_id,
      objetivo.remote_id,
      objetivo.user_remote_id,
      objetivo.meta_local_id,
      objetivo.nombre,
      objetivo.meta_esperada,
      objetivo.fecha_limite,
      objetivo.created_at,
      objetivo.updated_at,
      objetivo.sync_status,
    ],
  );

  await replaceObjetivoHabitos(
    objetivo.local_id,
    habitoLocalIds,
    objetivo.sync_status,
    timestamp,
  );

  return objetivo;
}

export async function listObjetivos(includePendingDelete = false): Promise<Objetivo[]> {
  const db = await getDatabase();

  return db.getAllAsync<Objetivo>(
    `
      SELECT
        local_id,
        remote_id,
        user_remote_id,
        meta_local_id,
        nombre,
        meta_esperada,
        fecha_limite,
      created_at,
      updated_at,
      sync_status
      FROM objetivos
      ${includePendingDelete ? '' : "WHERE sync_status != 'pending_delete'"}
      ORDER BY fecha_limite ASC;
    `,
  );
}

export async function getObjetivoById(localId: string): Promise<Objetivo | null> {
  const objetivos = await listObjetivos();
  return objetivos.find((objetivo) => objetivo.local_id === localId) ?? null;
}

export async function getObjetivoByRemoteId(remoteId: number): Promise<Objetivo | null> {
  const objetivos = await listObjetivos();
  return objetivos.find((objetivo) => objetivo.remote_id === remoteId) ?? null;
}

export async function listObjetivoHabitos(): Promise<ObjetivoHabito[]> {
  const db = await getDatabase();

  return db.getAllAsync<ObjetivoHabito>(
    `
      SELECT
        local_id,
        remote_id,
        objetivo_local_id,
        habito_local_id,
        created_at,
        updated_at,
        sync_status
      FROM objetivo_habitos
      ORDER BY objetivo_local_id ASC, habito_local_id ASC;
    `,
  );
}

export async function getObjetivoHabitoByRemoteId(
  remoteId: number,
): Promise<ObjetivoHabito | null> {
  const links = await listObjetivoHabitos();

  return links.find((link) => link.remote_id === remoteId) ?? null;
}

export async function getObjetivoHabitoByPair(
  objetivoLocalId: string,
  habitoLocalId: string,
): Promise<ObjetivoHabito | null> {
  const links = await listObjetivoHabitos();

  return (
    links.find(
      (link) =>
        link.objetivo_local_id === objetivoLocalId && link.habito_local_id === habitoLocalId,
    ) ?? null
  );
}

export async function updateObjetivo(input: UpdateObjetivoInput): Promise<void> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();
  const currentObjetivo = await getObjetivoById(input.localId);
  const habitoLocalIds = Array.from(
    new Set(input.habitoLocalIds.map((value) => value.trim()).filter(Boolean)),
  );

  if (!currentObjetivo) {
    throw new Error('No se encontro el objetivo.');
  }

  if (!input.nombre.trim()) {
    throw new Error('Escribi un nombre para el objetivo.');
  }

  if (!Number.isInteger(input.metaEsperada) || input.metaEsperada < 1) {
    throw new Error('La meta esperada debe ser un numero entero mayor o igual a 1.');
  }

  if (habitoLocalIds.length === 0) {
    throw new Error('Selecciona al menos un habito para el objetivo.');
  }

  const nextSyncStatus =
    currentObjetivo.sync_status === 'pending_create' ? 'pending_create' : 'pending_update';

  await db.runAsync(
    `
      UPDATE objetivos
      SET nombre = ?, meta_esperada = ?, fecha_limite = ?, updated_at = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    [
      input.nombre.trim(),
      input.metaEsperada,
      normalizeDate(input.fechaLimite, todayString()),
      timestamp,
      nextSyncStatus,
      input.localId,
    ],
  );

  await replaceObjetivoHabitos(input.localId, habitoLocalIds, nextSyncStatus, timestamp);
}

export async function deleteObjetivo(localId: string): Promise<void> {
  const db = await getDatabase();
  const currentObjetivo = await getObjetivoById(localId);

  if (!currentObjetivo) {
    throw new Error('No se encontro el objetivo.');
  }

  if (currentObjetivo.remote_id === null || currentObjetivo.sync_status === 'pending_create') {
    await db.runAsync(
      `
        DELETE FROM objetivo_habitos
        WHERE objetivo_local_id = ?;
      `,
      [localId],
    );

    await db.runAsync(
      `
        DELETE FROM objetivos
        WHERE local_id = ?;
      `,
      [localId],
    );

    return;
  }

  await db.runAsync(
    `
      UPDATE objetivos
      SET sync_status = ?
      WHERE local_id = ?;
    `,
    ['pending_delete', localId],
  );
}

export async function hardDeleteObjetivo(localId: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM objetivo_habitos
      WHERE objetivo_local_id = ?;
    `,
    [localId],
  );

  await db.runAsync(
    `
      DELETE FROM objetivos
      WHERE local_id = ?;
    `,
    [localId],
  );
}

export async function hardDeleteObjetivoHabito(localId: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM objetivo_habitos
      WHERE local_id = ?;
    `,
    [localId],
  );
}

export async function markObjetivoHabitoAsSynced(
  localId: string,
  remoteLink: RemoteObjetivoHabitoLink,
  objetivoLocalId: string,
  habitoLocalId: string,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE objetivo_habitos
      SET remote_id = ?, objetivo_local_id = ?, habito_local_id = ?, created_at = ?, updated_at = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    [
      remoteLink.id,
      objetivoLocalId,
      habitoLocalId,
      null,
      null,
      'synced',
      localId,
    ],
  );
}

export async function markObjetivoAsSynced(
  localId: string,
  remoteObjetivo: RemoteObjetivo,
  userRemoteId: number,
  metaLocalId: string | null,
  habitoLocalIds: string[],
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE objetivos
      SET remote_id = ?, user_remote_id = ?, meta_local_id = ?, nombre = ?, meta_esperada = ?, fecha_limite = ?, created_at = ?, updated_at = ?, sync_status = ?
      WHERE local_id = ?;
    `,
    [
      remoteObjetivo.id,
      userRemoteId,
      metaLocalId,
      remoteObjetivo.nombre,
      remoteObjetivo.meta_esperada,
      remoteObjetivo.fecha_limite,
      remoteObjetivo.created_at,
      remoteObjetivo.updated_at,
      'synced',
      localId,
    ],
  );

  await replaceObjetivoHabitos(
    localId,
    habitoLocalIds,
    'synced',
    remoteObjetivo.updated_at ?? remoteObjetivo.created_at ?? new Date().toISOString(),
  );
}

export async function upsertObjetivoFromRemote(
  remoteObjetivo: RemoteObjetivo,
  userRemoteId: number,
): Promise<Objetivo | null> {
  const meta = remoteObjetivo.meta_id !== null
    ? await getMetaByRemoteId(remoteObjetivo.meta_id)
    : null;

  const habitos = await Promise.all(
    remoteObjetivo.habito_ids.map((habitoId) => getHabitByRemoteId(habitoId)),
  );
  const habitoLocalIds = habitos
    .map((habito) => habito?.local_id ?? null)
    .filter((value): value is string => value !== null);

  if (remoteObjetivo.habito_ids.length > 0 && habitoLocalIds.length !== remoteObjetivo.habito_ids.length) {
    return null;
  }

  const existingObjetivo = await getObjetivoByRemoteId(remoteObjetivo.id);

  if (existingObjetivo) {
    await markObjetivoAsSynced(
      existingObjetivo.local_id,
      remoteObjetivo,
      userRemoteId,
      meta?.local_id ?? null,
      habitoLocalIds,
    );

    return {
      ...existingObjetivo,
      remote_id: remoteObjetivo.id,
      user_remote_id: userRemoteId,
      meta_local_id: meta?.local_id ?? null,
      nombre: remoteObjetivo.nombre,
      meta_esperada: remoteObjetivo.meta_esperada,
      fecha_limite: remoteObjetivo.fecha_limite,
      created_at: remoteObjetivo.created_at,
      updated_at: remoteObjetivo.updated_at,
      sync_status: 'synced',
    };
  }

  const db = await getDatabase();
  const localId = `remote-objetivo-${remoteObjetivo.id}`;

  await db.runAsync(
    `
      INSERT INTO objetivos (
        local_id, remote_id, user_remote_id, meta_local_id, nombre, meta_esperada, fecha_limite, created_at, updated_at, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      localId,
      remoteObjetivo.id,
      userRemoteId,
      meta?.local_id ?? null,
      remoteObjetivo.nombre,
      remoteObjetivo.meta_esperada,
      remoteObjetivo.fecha_limite,
      remoteObjetivo.created_at,
      remoteObjetivo.updated_at,
      'synced',
    ],
  );

  await replaceObjetivoHabitos(
    localId,
    habitoLocalIds,
    'synced',
    remoteObjetivo.updated_at ?? remoteObjetivo.created_at ?? new Date().toISOString(),
  );

  return {
    local_id: localId,
    remote_id: remoteObjetivo.id,
    user_remote_id: userRemoteId,
    meta_local_id: meta?.local_id ?? null,
    nombre: remoteObjetivo.nombre,
    meta_esperada: remoteObjetivo.meta_esperada,
    fecha_limite: remoteObjetivo.fecha_limite,
    created_at: remoteObjetivo.created_at,
    updated_at: remoteObjetivo.updated_at,
    sync_status: 'synced',
  };
}

export async function upsertObjetivoHabitoFromRemote(
  remoteLink: RemoteObjetivoHabitoLink,
): Promise<ObjetivoHabito | null> {
  const [objetivo, habito] = await Promise.all([
    getObjetivoByRemoteId(remoteLink.objetivo_id),
    getHabitByRemoteId(remoteLink.habito_id),
  ]);

  if (!objetivo || !habito) {
    return null;
  }

  const existingLink =
    (await getObjetivoHabitoByRemoteId(remoteLink.id)) ??
    (await getObjetivoHabitoByPair(objetivo.local_id, habito.local_id));

  if (existingLink) {
    await markObjetivoHabitoAsSynced(
      existingLink.local_id,
      remoteLink,
      objetivo.local_id,
      habito.local_id,
    );

    return {
      ...existingLink,
      remote_id: remoteLink.id,
      objetivo_local_id: objetivo.local_id,
      habito_local_id: habito.local_id,
      created_at: null,
      updated_at: null,
      sync_status: 'synced',
    };
  }

  const db = await getDatabase();
  const localId = `remote-objetivo-habito-${remoteLink.id}`;

  await db.runAsync(
    `
      INSERT INTO objetivo_habitos (
        local_id, remote_id, objetivo_local_id, habito_local_id, created_at, updated_at, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
    [localId, remoteLink.id, objetivo.local_id, habito.local_id, null, null, 'synced'],
  );

  return {
    local_id: localId,
    remote_id: remoteLink.id,
    objetivo_local_id: objetivo.local_id,
    habito_local_id: habito.local_id,
    created_at: null,
    updated_at: null,
    sync_status: 'synced',
  };
}

export async function listObjetivosWithProgress(): Promise<ObjetivoWithProgress[]> {
  const [objetivos, objetivoHabitos, records] = await Promise.all([
    listObjetivos(),
    listObjetivoHabitos(),
    listHabitRecords(),
  ]);
  return objetivos.map((objetivo) => decorateObjetivo(objetivo, objetivoHabitos, records));
}

export async function listMetasWithEstado(): Promise<MetaWithEstado[]> {
  const [metas, objetivos] = await Promise.all([listMetas(), listObjetivosWithProgress()]);
  return metas.map((meta) => decorateMeta(meta, objetivos));
}
