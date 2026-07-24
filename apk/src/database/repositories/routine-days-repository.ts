import { getDatabase } from '../client';

export const ROUTINE_DAY_OPTIONS = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
] as const;

export type RoutineDayValue = (typeof ROUTINE_DAY_OPTIONS)[number];

export type RoutineDay = {
  local_id: string;
  remote_id: number | null;
  rutina_local_id: string;
  dia_semana: RoutineDayValue;
  sync_status: string;
};

export type CreateRoutineDayInput = {
  rutinaLocalId: string;
  diaSemana: RoutineDayValue;
};

function createLocalId(): string {
  return `routine-day-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function assertValidDay(value: string): asserts value is RoutineDayValue {
  if (!ROUTINE_DAY_OPTIONS.includes(value as RoutineDayValue)) {
    throw new Error('El dia de la semana no es valido.');
  }
}

export async function listRoutineDays(): Promise<RoutineDay[]> {
  const db = await getDatabase();

  return db.getAllAsync<RoutineDay>(
    `
      SELECT
        local_id,
        remote_id,
        rutina_local_id,
        dia_semana,
        sync_status
      FROM rutina_dias
      ORDER BY dia_semana ASC;
    `,
  );
}

export async function createRoutineDay(input: CreateRoutineDayInput): Promise<RoutineDay> {
  const db = await getDatabase();
  assertValidDay(input.diaSemana);

  const existingDays = await listRoutineDays();
  const duplicate = existingDays.find(
    (item) =>
      item.rutina_local_id === input.rutinaLocalId &&
      item.dia_semana === input.diaSemana,
  );

  if (duplicate) {
    throw new Error('Ese dia ya esta vinculado a la rutina.');
  }

  const routineDay: RoutineDay = {
    local_id: createLocalId(),
    remote_id: null,
    rutina_local_id: input.rutinaLocalId,
    dia_semana: input.diaSemana,
    sync_status: 'pending_create',
  };

  await db.runAsync(
    `
      INSERT INTO rutina_dias (
        local_id, remote_id, rutina_local_id, dia_semana, sync_status
      )
      VALUES (?, ?, ?, ?, ?);
    `,
    [
      routineDay.local_id,
      routineDay.remote_id,
      routineDay.rutina_local_id,
      routineDay.dia_semana,
      routineDay.sync_status,
    ],
  );

  return routineDay;
}

export async function deleteRoutineDaysByRoutineId(rutinaLocalId: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM rutina_dias
      WHERE rutina_local_id = ?;
    `,
    [rutinaLocalId],
  );
}
