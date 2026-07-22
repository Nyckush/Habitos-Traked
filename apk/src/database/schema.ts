export const DATABASE_NAME = 'habitracked.db';
export const DATABASE_VERSION = 1;

export const schemaStatements = [
  `
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS users (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'synced'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS habitos (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      user_remote_id INTEGER,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      estado TEXT NOT NULL DEFAULT 'activo',
      frecuencia TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS rutinas (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      user_remote_id INTEGER,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS tareas (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      user_remote_id INTEGER,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      fecha_limite TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS metas (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      user_remote_id INTEGER,
      titulo TEXT NOT NULL,
      motivo TEXT,
      objetivo INTEGER,
      fecha_inicio TEXT,
      fecha_limite TEXT,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_local_id TEXT NOT NULL,
      operation TEXT NOT NULL
        CHECK (operation IN ('create', 'update', 'delete')),
      payload TEXT,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'failed')),
      retries INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
  `CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_habitos_sync_status ON habitos(sync_status);`,
  `CREATE INDEX IF NOT EXISTS idx_rutinas_sync_status ON rutinas(sync_status);`,
  `CREATE INDEX IF NOT EXISTS idx_tareas_sync_status ON tareas(sync_status);`,
  `CREATE INDEX IF NOT EXISTS idx_metas_sync_status ON metas(sync_status);`,
] as const;
