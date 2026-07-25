import type { AuthUser } from '@/services';

import { getDatabase } from '../client';

const CURRENT_USER_LOCAL_ID_KEY = 'auth.current_user_local_id';

type UserRow = {
  local_id: string;
  remote_id: number | null;
  username: string;
  perfil: string | null;
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
    username: row.username,
    perfil: row.perfil,
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
      INSERT INTO users (local_id, remote_id, username, perfil, email, created_at, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'synced')
      ON CONFLICT(local_id) DO UPDATE SET
        remote_id = excluded.remote_id,
        username = excluded.username,
        perfil = excluded.perfil,
        email = excluded.email,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        sync_status = 'synced';
    `,
    [localId, user.id, user.username, user.perfil, user.email, user.created_at, user.updated_at],
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
      SELECT local_id, remote_id, username, perfil, email, created_at, updated_at
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

export type UpdateCurrentAuthUserInput = {
  username: string;
  perfil: string | null;
};

export async function updateCurrentAuthUser(input: UpdateCurrentAuthUserInput): Promise<AuthUser> {
  const db = await getDatabase();
  const metaRow = await db.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM app_meta WHERE key = ?;',
    [CURRENT_USER_LOCAL_ID_KEY],
  );

  if (!metaRow?.value) {
    throw new Error('No se encontro el usuario actual.');
  }

  const currentUser = await db.getFirstAsync<UserRow>(
    `
      SELECT local_id, remote_id, username, perfil, email, created_at, updated_at
      FROM users
      WHERE local_id = ?;
    `,
    [metaRow.value],
  );

  if (!currentUser || currentUser.remote_id === null) {
    throw new Error('No se encontro el usuario actual.');
  }

  const nextUsername = input.username.trim();

  if (!nextUsername) {
    throw new Error('Escribi un username.');
  }

  const nextUpdatedAt = new Date().toISOString();
  const nextPerfil = input.perfil?.trim() ? input.perfil.trim() : null;

  await db.runAsync(
    `
      UPDATE users
      SET username = ?, perfil = ?, updated_at = ?, sync_status = 'synced'
      WHERE local_id = ?;
    `,
    [nextUsername, nextPerfil, nextUpdatedAt, metaRow.value],
  );

  return {
    id: currentUser.remote_id,
    username: nextUsername,
    perfil: nextPerfil,
    email: currentUser.email,
    created_at: currentUser.created_at,
    updated_at: nextUpdatedAt,
  };
}
