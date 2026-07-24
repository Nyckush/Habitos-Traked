import { getDatabase } from '../client';

export type HabitActivity = {
  local_id: string;
  remote_id: number | null;
  habito_local_id: string;
  nombre: string;
  created_at: string | null;
  updated_at: string | null;
  sync_status: string;
};

export type CreateHabitActivityInput = {
  habitoLocalId: string;
  nombre: string;
};

function createLocalId(): string {
  return `habit-activity-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createHabitActivity(input: CreateHabitActivityInput): Promise<HabitActivity> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();

  if (!input.nombre.trim()) {
    throw new Error('Escribi un nombre para la actividad.');
  }

  const activity: HabitActivity = {
    local_id: createLocalId(),
    remote_id: null,
    habito_local_id: input.habitoLocalId,
    nombre: input.nombre.trim(),
    created_at: timestamp,
    updated_at: timestamp,
    sync_status: 'pending_create',
  };

  await db.runAsync(
    `
      INSERT INTO actividad_habitos (
        local_id, remote_id, habito_local_id, nombre, created_at, updated_at, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
    [
      activity.local_id,
      activity.remote_id,
      activity.habito_local_id,
      activity.nombre,
      activity.created_at,
      activity.updated_at,
      activity.sync_status,
    ],
  );

  return activity;
}

export async function listHabitActivities(): Promise<HabitActivity[]> {
  const db = await getDatabase();

  return db.getAllAsync<HabitActivity>(
    `
      SELECT
        local_id,
        remote_id,
        habito_local_id,
        nombre,
        created_at,
        updated_at,
        sync_status
      FROM actividad_habitos
      ORDER BY datetime(created_at) ASC;
    `,
  );
}
