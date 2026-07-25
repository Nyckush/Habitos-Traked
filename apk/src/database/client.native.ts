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

async function migrateToVersion9(db: SQLiteDatabase) {
  if (!(await tableExists(db, 'tareas'))) {
    return;
  }

  const taskColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(tareas);');
  const hasDescripcionColumn = taskColumns.some((column) => column.name === 'descripcion');
  const hasFechaLimiteColumn = taskColumns.some((column) => column.name === 'fecha_limite');

  if (!hasDescripcionColumn && !hasFechaLimiteColumn) {
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_tareas_sync_status ON tareas(sync_status);');
    return;
  }

  if (await tableExists(db, 'tareas_new')) {
    await db.execAsync('DROP TABLE tareas_new;');
  }

  await db.execAsync(`
    CREATE TABLE tareas_new (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      user_remote_id INTEGER,
      titulo TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
    );
  `);

  await db.execAsync(`
    INSERT INTO tareas_new (
      local_id, remote_id, user_remote_id, titulo, estado, created_at, updated_at, deleted_at, sync_status
    )
    SELECT
      local_id,
      remote_id,
      user_remote_id,
      titulo,
      estado,
      created_at,
      updated_at,
      deleted_at,
      sync_status
    FROM tareas;
  `);

  await db.execAsync('DROP TABLE tareas;');
  await db.execAsync('ALTER TABLE tareas_new RENAME TO tareas;');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_tareas_sync_status ON tareas(sync_status);');
}

async function migrateToVersion10(db: SQLiteDatabase) {
  if (!(await tableExists(db, 'tareas'))) {
    return;
  }

  const taskColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(tareas);');
  const hasCompletedAtColumn = taskColumns.some((column) => column.name === 'completed_at');

  if (hasCompletedAtColumn) {
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_tareas_sync_status ON tareas(sync_status);');
    return;
  }

  if (await tableExists(db, 'tareas_new')) {
    await db.execAsync('DROP TABLE tareas_new;');
  }

  await db.execAsync(`
    CREATE TABLE tareas_new (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      user_remote_id INTEGER,
      titulo TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      completed_at TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
    );
  `);

  await db.execAsync(`
    INSERT INTO tareas_new (
      local_id, remote_id, user_remote_id, titulo, estado, completed_at, created_at, updated_at, deleted_at, sync_status
    )
    SELECT
      local_id,
      remote_id,
      user_remote_id,
      titulo,
      estado,
      NULL,
      created_at,
      updated_at,
      deleted_at,
      sync_status
    FROM tareas;
  `);

  await db.execAsync('DROP TABLE tareas;');
  await db.execAsync('ALTER TABLE tareas_new RENAME TO tareas;');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_tareas_sync_status ON tareas(sync_status);');
}

async function migrateToVersion11(db: SQLiteDatabase) {
  if (!(await tableExists(db, 'tareas'))) {
    return;
  }

  const taskColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(tareas);');
  const hasHoraInicioColumn = taskColumns.some((column) => column.name === 'hora_inicio');

  if (hasHoraInicioColumn) {
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_tareas_sync_status ON tareas(sync_status);');
    return;
  }

  if (await tableExists(db, 'tareas_new')) {
    await db.execAsync('DROP TABLE tareas_new;');
  }

  await db.execAsync(`
    CREATE TABLE tareas_new (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      user_remote_id INTEGER,
      titulo TEXT NOT NULL,
      hora_inicio TEXT,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      completed_at TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
    );
  `);

  await db.execAsync(`
    INSERT INTO tareas_new (
      local_id, remote_id, user_remote_id, titulo, hora_inicio, estado, completed_at, created_at, updated_at, deleted_at, sync_status
    )
    SELECT
      local_id,
      remote_id,
      user_remote_id,
      titulo,
      NULL,
      estado,
      completed_at,
      created_at,
      updated_at,
      deleted_at,
      sync_status
    FROM tareas;
  `);

  await db.execAsync('DROP TABLE tareas;');
  await db.execAsync('ALTER TABLE tareas_new RENAME TO tareas;');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_tareas_sync_status ON tareas(sync_status);');
}

async function migrateToVersion12(db: SQLiteDatabase) {
  const objetivosExists = await tableExists(db, 'objetivos');
  const objetivoHabitosExists = await tableExists(db, 'objetivo_habitos');

  if (!objetivoHabitosExists) {
    await db.execAsync(`
      CREATE TABLE objetivo_habitos (
        local_id TEXT PRIMARY KEY NOT NULL,
        remote_id INTEGER UNIQUE,
        objetivo_local_id TEXT NOT NULL,
        habito_local_id TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending_create'
          CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict')),
        UNIQUE(objetivo_local_id, habito_local_id)
      );
    `);
  }

  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_objetivo_habitos_sync_status ON objetivo_habitos(sync_status);');

  if (!objetivosExists) {
    await db.execAsync(`
      CREATE TABLE objetivos (
        local_id TEXT PRIMARY KEY NOT NULL,
        remote_id INTEGER UNIQUE,
        user_remote_id INTEGER,
        meta_local_id TEXT,
        nombre TEXT NOT NULL,
        meta_esperada INTEGER NOT NULL,
        fecha_limite TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending_create'
          CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
      );
    `);
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_objetivos_sync_status ON objetivos(sync_status);');
    return;
  }

  const objetivoColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(objetivos);');
  const hasHabitoLocalIdColumn = objetivoColumns.some((column) => column.name === 'habito_local_id');

  if (!hasHabitoLocalIdColumn) {
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_objetivos_sync_status ON objetivos(sync_status);');
    return;
  }

  await db.execAsync(`
    INSERT OR IGNORE INTO objetivo_habitos (
      local_id, remote_id, objetivo_local_id, habito_local_id, created_at, updated_at, sync_status
    )
    SELECT
      'objetivo-habito-' || objetivos.local_id || '-' || objetivos.habito_local_id,
      NULL,
      objetivos.local_id,
      objetivos.habito_local_id,
      objetivos.created_at,
      objetivos.updated_at,
      CASE
        WHEN objetivos.sync_status = 'synced' THEN 'synced'
        ELSE 'pending_create'
      END
    FROM objetivos
    WHERE objetivos.habito_local_id IS NOT NULL;
  `);

  if (await tableExists(db, 'objetivos_new')) {
    await db.execAsync('DROP TABLE objetivos_new;');
  }

  await db.execAsync(`
    CREATE TABLE objetivos_new (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      user_remote_id INTEGER,
      meta_local_id TEXT,
      nombre TEXT NOT NULL,
      meta_esperada INTEGER NOT NULL,
      fecha_limite TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
    );
  `);

  await db.execAsync(`
    INSERT INTO objetivos_new (
      local_id, remote_id, user_remote_id, meta_local_id, nombre, meta_esperada, fecha_limite, created_at, updated_at, sync_status
    )
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
    FROM objetivos;
  `);

  await db.execAsync('DROP TABLE objetivos;');
  await db.execAsync('ALTER TABLE objetivos_new RENAME TO objetivos;');
  await db.execAsync('CREATE INDEX IF NOT EXISTS idx_objetivos_sync_status ON objetivos(sync_status);');
}

async function migrateToVersion13(db: SQLiteDatabase) {
  if (!(await tableExists(db, 'users'))) {
    return;
  }

  const userColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(users);');
  const hasUsernameColumn = userColumns.some((column) => column.name === 'username');
  const hasPerfilColumn = userColumns.some((column) => column.name === 'perfil');
  const hasNombreColumn = userColumns.some((column) => column.name === 'nombre');

  if (hasUsernameColumn && hasPerfilColumn) {
    return;
  }

  if (await tableExists(db, 'users_new')) {
    await db.execAsync('DROP TABLE users_new;');
  }

  await db.execAsync(`
    CREATE TABLE users_new (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      username TEXT NOT NULL,
      perfil TEXT,
      email TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'synced'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
    );
  `);

  await db.execAsync(`
    INSERT INTO users_new (
      local_id, remote_id, username, perfil, email, created_at, updated_at, sync_status
    )
    SELECT
      local_id,
      remote_id,
      ${hasUsernameColumn ? 'username' : hasNombreColumn ? 'nombre' : "''"},
      ${hasPerfilColumn ? 'perfil' : 'NULL'},
      email,
      created_at,
      updated_at,
      sync_status
    FROM users;
  `);

  await db.execAsync('DROP TABLE users;');
  await db.execAsync('ALTER TABLE users_new RENAME TO users;');
}

async function ensureUsersSchema(db: SQLiteDatabase) {
  if (!(await tableExists(db, 'users'))) {
    return;
  }

  const userColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(users);');
  const hasUsernameColumn = userColumns.some((column) => column.name === 'username');
  const hasPerfilColumn = userColumns.some((column) => column.name === 'perfil');

  if (hasUsernameColumn && hasPerfilColumn) {
    return;
  }

  await migrateToVersion13(db);
}

async function runMigrations(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    await ensureUsersSchema(db);
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

    if (currentVersion <= 8 && DATABASE_VERSION >= 9) {
      await migrateToVersion9(db);
    }

    if (currentVersion <= 9 && DATABASE_VERSION >= 10) {
      await migrateToVersion10(db);
    }

    if (currentVersion <= 10 && DATABASE_VERSION >= 11) {
      await migrateToVersion11(db);
    }

    if (currentVersion <= 11 && DATABASE_VERSION >= 12) {
      await migrateToVersion12(db);
    }

    if (currentVersion <= 12 && DATABASE_VERSION >= 13) {
      await migrateToVersion13(db);
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
  });

  await ensureUsersSchema(db);
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

export async function clearLocalDomainData(): Promise<void> {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM objetivo_habitos;');
    await db.execAsync('DELETE FROM objetivos;');
    await db.execAsync('DELETE FROM metas;');
    await db.execAsync('DELETE FROM registro_habitos;');
    await db.execAsync('DELETE FROM actividad_habitos;');
    await db.execAsync('DELETE FROM rutina_habitos;');
    await db.execAsync('DELETE FROM rutina_dias;');
    await db.execAsync('DELETE FROM habitos;');
    await db.execAsync('DELETE FROM rutinas;');
    await db.execAsync('DELETE FROM tareas;');
    await db.execAsync('DELETE FROM sync_queue;');
  });
}
