import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_NAME, DATABASE_VERSION, schemaStatements } from './schema';

export type AppDatabase = Pick<SQLiteDatabase, 'runAsync' | 'getFirstAsync' | 'getAllAsync'>;

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function tableExists(db: SQLiteDatabase, tableName: string) {
  const result = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?;",
    [tableName],
  );

  return Boolean(result?.name);
}

async function migrateToVersion2(db: SQLiteDatabase) {
  if (await tableExists(db, 'habitos_new')) {
    await db.execAsync('DROP TABLE habitos_new;');
  }

  await db.execAsync(`
    CREATE TABLE habitos_new (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      user_remote_id INTEGER,
      nombre TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
    );
  `);

  await db.execAsync(`
    INSERT INTO habitos_new (
      local_id, remote_id, user_remote_id, nombre, created_at, updated_at, deleted_at, sync_status
    )
    SELECT
      local_id,
      remote_id,
      user_remote_id,
      titulo,
      created_at,
      updated_at,
      deleted_at,
      sync_status
    FROM habitos;
  `);

  await db.execAsync('DROP TABLE habitos;');
  await db.execAsync('ALTER TABLE habitos_new RENAME TO habitos;');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_habitos_sync_status ON habitos(sync_status);');
}

async function migrateToVersion3(db: SQLiteDatabase) {
  if (await tableExists(db, 'rutinas_new')) {
    await db.execAsync('DROP TABLE rutinas_new;');
  }

  await db.execAsync(`
    CREATE TABLE rutinas_new (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      user_remote_id INTEGER,
      nombre TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
    );
  `);

  await db.execAsync(`
    INSERT INTO rutinas_new (
      local_id, remote_id, user_remote_id, nombre, created_at, updated_at, deleted_at, sync_status
    )
    SELECT
      local_id,
      remote_id,
      user_remote_id,
      nombre,
      created_at,
      updated_at,
      deleted_at,
      sync_status
    FROM rutinas;
  `);

  await db.execAsync('DROP TABLE rutinas;');
  await db.execAsync('ALTER TABLE rutinas_new RENAME TO rutinas;');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_rutinas_sync_status ON rutinas(sync_status);');
}

async function migrateToVersion4(db: SQLiteDatabase) {
  if (await tableExists(db, 'rutina_habitos')) {
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_rutina_habitos_sync_status ON rutina_habitos(sync_status);');
    return;
  }

  await db.execAsync(`
    CREATE TABLE rutina_habitos (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      rutina_local_id TEXT NOT NULL,
      habito_local_id TEXT NOT NULL,
      hora_inicio TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict')),
      UNIQUE(rutina_local_id, habito_local_id)
    );
  `);

  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_rutina_habitos_sync_status ON rutina_habitos(sync_status);');
}

async function migrateToVersion5(db: SQLiteDatabase) {
  if (await tableExists(db, 'rutina_dias')) {
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_rutina_dias_sync_status ON rutina_dias(sync_status);');
    return;
  }

  await db.execAsync(`
    CREATE TABLE rutina_dias (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      rutina_local_id TEXT NOT NULL,
      dia_semana TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict')),
      UNIQUE(rutina_local_id, dia_semana)
    );
  `);

  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_rutina_dias_sync_status ON rutina_dias(sync_status);');
}

async function migrateToVersion6(db: SQLiteDatabase) {
  if (await tableExists(db, 'registro_habitos')) {
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_registro_habitos_sync_status ON registro_habitos(sync_status);');
    return;
  }

  await db.execAsync(`
    CREATE TABLE registro_habitos (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      habito_local_id TEXT NOT NULL,
      fecha TEXT NOT NULL,
      completado INTEGER NOT NULL DEFAULT 0 CHECK (completado IN (0, 1)),
      observacion TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict')),
      UNIQUE(habito_local_id, fecha)
    );
  `);

  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_registro_habitos_sync_status ON registro_habitos(sync_status);');
}

async function migrateToVersion7(db: SQLiteDatabase) {
  if (await tableExists(db, 'actividad_habitos')) {
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_actividad_habitos_sync_status ON actividad_habitos(sync_status);');
    return;
  }

  await db.execAsync(`
    CREATE TABLE actividad_habitos (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      habito_local_id TEXT NOT NULL,
      nombre TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
    );
  `);

  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_actividad_habitos_sync_status ON actividad_habitos(sync_status);');
}

async function migrateToVersion8(db: SQLiteDatabase) {
  const metasExists = await tableExists(db, 'metas');
  const objetivosExists = await tableExists(db, 'objetivos');

  if (metasExists) {
    const metaColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(metas);');
    const hasNombreColumn = metaColumns.some((column) => column.name === 'nombre');
    const hasTituloColumn = metaColumns.some((column) => column.name === 'titulo');

    if (!hasNombreColumn && hasTituloColumn) {
      if (await tableExists(db, 'metas_new')) {
        await db.execAsync('DROP TABLE metas_new;');
      }

      await db.execAsync(`
        CREATE TABLE metas_new (
          local_id TEXT PRIMARY KEY NOT NULL,
          remote_id INTEGER UNIQUE,
          user_remote_id INTEGER,
          nombre TEXT NOT NULL,
          fecha_inicio TEXT,
          created_at TEXT,
          updated_at TEXT,
          sync_status TEXT NOT NULL DEFAULT 'pending_create'
            CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
        );
      `);

      await db.execAsync(`
        INSERT INTO metas_new (
          local_id, remote_id, user_remote_id, nombre, fecha_inicio, created_at, updated_at, sync_status
        )
        SELECT
          local_id,
          remote_id,
          user_remote_id,
          titulo,
          fecha_inicio,
          created_at,
          updated_at,
          sync_status
        FROM metas;
      `);

      await db.execAsync('DROP TABLE metas;');
      await db.execAsync('ALTER TABLE metas_new RENAME TO metas;');
    }
  }

  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_metas_sync_status ON metas(sync_status);');

  if (!objetivosExists) {
    await db.execAsync(`
      CREATE TABLE objetivos (
        local_id TEXT PRIMARY KEY NOT NULL,
        remote_id INTEGER UNIQUE,
        user_remote_id INTEGER,
        meta_local_id TEXT,
        habito_local_id TEXT NOT NULL,
        nombre TEXT NOT NULL,
        meta_esperada INTEGER NOT NULL,
        fecha_limite TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending_create'
          CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
      );
    `);
  }

  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_objetivos_sync_status ON objetivos(sync_status);');
}

async function runMigrations(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  await db.withTransactionAsync(async () => {
    if (currentVersion === 0) {
      for (const statement of schemaStatements) {
        await db.execAsync(statement);
      }
    }

    if (currentVersion === 1) {
      await migrateToVersion2(db);
    }

    if (currentVersion <= 2 && DATABASE_VERSION >= 3) {
      await migrateToVersion3(db);
    }

    if (currentVersion <= 3 && DATABASE_VERSION >= 4) {
      await migrateToVersion4(db);
    }

    if (currentVersion <= 4 && DATABASE_VERSION >= 5) {
      await migrateToVersion5(db);
    }

    if (currentVersion <= 5 && DATABASE_VERSION >= 6) {
      await migrateToVersion6(db);
    }

    if (currentVersion <= 6 && DATABASE_VERSION >= 7) {
      await migrateToVersion7(db);
    }

    if (currentVersion <= 7 && DATABASE_VERSION >= 8) {
      await migrateToVersion8(db);
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

  const [usersRow, habitsRow, routinesRow, queueRow] = await Promise.all([
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM users;'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM habitos;'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM rutinas;'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sync_queue;'),
  ]);

  return {
    name: DATABASE_NAME,
    version: DATABASE_VERSION,
    usersCount: usersRow?.count ?? 0,
    habitsCount: habitsRow?.count ?? 0,
    routinesCount: routinesRow?.count ?? 0,
    queueCount: queueRow?.count ?? 0,
  };
}
