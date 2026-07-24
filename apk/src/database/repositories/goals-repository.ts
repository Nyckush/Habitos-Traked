import { getDatabase } from '../client';
import { listHabitRecords, type HabitRecord } from './habit-records-repository';

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
  habito_local_id: string;
  nombre: string;
  meta_esperada: number;
  fecha_limite: string;
  created_at: string | null;
  updated_at: string | null;
  sync_status: string;
};

export type ObjetivoWithProgress = Objetivo & {
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

export type CreateObjetivoInput = {
  userRemoteId?: number | null;
  metaLocalId?: string | null;
  habitoLocalId: string;
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

function calculateMetaActual(objetivo: Objetivo, records: HabitRecord[]): number {
  if (!objetivo.created_at) {
    return 0;
  }

  const start = objetivo.created_at.slice(0, 10);

  return records.filter(
    (record) =>
      record.habito_local_id === objetivo.habito_local_id &&
      record.completado &&
      record.fecha >= start &&
      record.fecha <= objetivo.fecha_limite,
  ).length;
}

function decorateObjetivo(objetivo: Objetivo, records: HabitRecord[]): ObjetivoWithProgress {
  const metaActual = calculateMetaActual(objetivo, records);
  const tasaExito = Math.round((metaActual / Math.max(1, objetivo.meta_esperada)) * 10000) / 100;
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

  if (estados.some((estado) => estado === 'En Progreso' || estado === 'Completado Parcialmente')) {
    return { ...meta, estado: 'En Progreso' };
  }

  return { ...meta, estado: 'Incompleta' };
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
      ORDER BY datetime(created_at) ASC;
    `,
  );
}

export async function createObjetivo(input: CreateObjetivoInput): Promise<Objetivo> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();

  if (!input.nombre.trim()) {
    throw new Error('Escribi un nombre para el objetivo.');
  }

  if (!Number.isInteger(input.metaEsperada) || input.metaEsperada < 1) {
    throw new Error('La meta esperada debe ser un numero entero mayor o igual a 1.');
  }

  const objetivo: Objetivo = {
    local_id: createLocalId('objetivo'),
    remote_id: null,
    user_remote_id: input.userRemoteId ?? null,
    meta_local_id: input.metaLocalId ?? null,
    habito_local_id: input.habitoLocalId,
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
        local_id, remote_id, user_remote_id, meta_local_id, habito_local_id, nombre, meta_esperada, fecha_limite, created_at, updated_at, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      objetivo.local_id,
      objetivo.remote_id,
      objetivo.user_remote_id,
      objetivo.meta_local_id,
      objetivo.habito_local_id,
      objetivo.nombre,
      objetivo.meta_esperada,
      objetivo.fecha_limite,
      objetivo.created_at,
      objetivo.updated_at,
      objetivo.sync_status,
    ],
  );

  return objetivo;
}

export async function listObjetivos(): Promise<Objetivo[]> {
  const db = await getDatabase();

  return db.getAllAsync<Objetivo>(
    `
      SELECT
        local_id,
        remote_id,
        user_remote_id,
        meta_local_id,
        habito_local_id,
        nombre,
        meta_esperada,
        fecha_limite,
        created_at,
        updated_at,
        sync_status
      FROM objetivos
      ORDER BY fecha_limite ASC;
    `,
  );
}

export async function listObjetivosWithProgress(): Promise<ObjetivoWithProgress[]> {
  const [objetivos, records] = await Promise.all([listObjetivos(), listHabitRecords()]);
  return objetivos.map((objetivo) => decorateObjetivo(objetivo, records));
}

export async function listMetasWithEstado(): Promise<MetaWithEstado[]> {
  const [metas, objetivos] = await Promise.all([listMetas(), listObjetivosWithProgress()]);
  return metas.map((meta) => decorateMeta(meta, objetivos));
}
