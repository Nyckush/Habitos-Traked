export const DATABASE_NAME = 'habitracked.db';
export const DATABASE_VERSION = 13;

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
      username TEXT NOT NULL,
      perfil TEXT,
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
      nombre TEXT NOT NULL,
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
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS rutina_habitos (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      rutina_local_id TEXT NOT NULL,
      habito_local_id TEXT NOT NULL,
      hora_inicio TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict')),
      UNIQUE(rutina_local_id, habito_local_id)
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS rutina_dias (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      rutina_local_id TEXT NOT NULL,
      dia_semana TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict')),
      UNIQUE(rutina_local_id, dia_semana)
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS registro_habitos (
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
  `,
  `
    CREATE TABLE IF NOT EXISTS actividad_habitos (
      local_id TEXT PRIMARY KEY NOT NULL,
      remote_id INTEGER UNIQUE,
      habito_local_id TEXT NOT NULL,
      nombre TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT,
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
      hora_inicio TEXT,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      completed_at TEXT,
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
      nombre TEXT NOT NULL,
      fecha_inicio TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
        CHECK (sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict'))
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS objetivos (
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
  `,
  `
    CREATE TABLE IF NOT EXISTS objetivo_habitos (
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
  `CREATE INDEX IF NOT EXISTS idx_rutina_habitos_sync_status ON rutina_habitos(sync_status);`,
  `CREATE INDEX IF NOT EXISTS idx_rutina_dias_sync_status ON rutina_dias(sync_status);`,
  `CREATE INDEX IF NOT EXISTS idx_registro_habitos_sync_status ON registro_habitos(sync_status);`,
  `CREATE INDEX IF NOT EXISTS idx_actividad_habitos_sync_status ON actividad_habitos(sync_status);`,
  `CREATE INDEX IF NOT EXISTS idx_tareas_sync_status ON tareas(sync_status);`,
  `CREATE INDEX IF NOT EXISTS idx_metas_sync_status ON metas(sync_status);`,
  `CREATE INDEX IF NOT EXISTS idx_objetivos_sync_status ON objetivos(sync_status);`,
  `CREATE INDEX IF NOT EXISTS idx_objetivo_habitos_sync_status ON objetivo_habitos(sync_status);`,
] as const;
