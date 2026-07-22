import type { AuthUser } from '@/services';

import { getDatabase } from '../client';

const CURRENT_USER_LOCAL_ID_KEY = 'auth.current_user_local_id';

type UserRow = {
  local_id: string;
  remote_id: number | null;
  nombre: string;
  email: string;
  created_at: string | null;
  updated_at: string | null;
};

function buildUserLocalId(user: AuthUser): string {
  return user.id ? `remote-user-${user.id}` : `user-${user.email}`;
}

function mapUserRow(row: UserRow | null): AuthUser | null {
  if (!row || row.remote_id === null) {
    return null;
  }

  return {
    id: row.remote_id,
    nombre: row.nombre,
    email: row.email,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function upsertAuthUser(user: AuthUser): Promise<string> {
  const db = await getDatabase();
  const localId = buildUserLocalId(user);

  await db.runAsync(
    `
      INSERT INTO users (local_id, remote_id, nombre, email, created_at, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, 'synced')
      ON CONFLICT(local_id) DO UPDATE SET
        remote_id = excluded.remote_id,
        nombre = excluded.nombre,
        email = excluded.email,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        sync_status = 'synced';
    `,
    [localId, user.id, user.nombre, user.email, user.created_at, user.updated_at],
  );

  return localId;
}

export async function setCurrentAuthUser(user: AuthUser): Promise<void> {
  const db = await getDatabase();
  const localId = await upsertAuthUser(user);

  await db.runAsync(
    `
      INSERT INTO app_meta (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value;
    `,
    [CURRENT_USER_LOCAL_ID_KEY, localId],
  );
}

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const db = await getDatabase();

  const metaRow = await db.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM app_meta WHERE key = ?;',
    [CURRENT_USER_LOCAL_ID_KEY],
  );

  if (!metaRow?.value) {
    return null;
  }

  const userRow = await db.getFirstAsync<UserRow>(
    `
      SELECT local_id, remote_id, nombre, email, created_at, updated_at
      FROM users
      WHERE local_id = ?;
    `,
    [metaRow.value],
  );

  return mapUserRow(userRow);
}

export async function clearCurrentAuthUser(): Promise<void> {
  const db = await getDatabase();

  await db.runAsync('DELETE FROM app_meta WHERE key = ?;', [CURRENT_USER_LOCAL_ID_KEY]);
}
