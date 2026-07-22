import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_NAME, DATABASE_VERSION, schemaStatements } from './schema';

export type AppDatabase = Pick<SQLiteDatabase, 'runAsync' | 'getFirstAsync' | 'getAllAsync'>;

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function runMigrations(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  await db.withTransactionAsync(async () => {
    for (const statement of schemaStatements) {
      await db.execAsync(statement);
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
  });
}

export async function getDatabase(): Promise<AppDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await openDatabaseAsync(DATABASE_NAME);
      await runMigrations(db);
      return db;
    })();
  }

  return databasePromise;
}

export async function getDatabaseStatus() {
  const db = await getDatabase();

  const [usersRow, habitsRow, queueRow] = await Promise.all([
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM users;'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM habitos;'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sync_queue;'),
  ]);

  return {
    name: DATABASE_NAME,
    version: DATABASE_VERSION,
    usersCount: usersRow?.count ?? 0,
    habitsCount: habitsRow?.count ?? 0,
    queueCount: queueRow?.count ?? 0,
  };
}
