import { getDatabase } from '../client';

const NOTIFICATIONS_ENABLED_KEY = 'settings.notifications.enabled';
const NOTIFICATION_TONE_KEY = 'settings.notifications.tone';

export type NotificationTone = 'default' | 'silent';

export type NotificationSettings = {
  enabled: boolean;
  tone: NotificationTone;
};

async function setMetaValue(key: string, value: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT INTO app_meta (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value;
    `,
    [key, value],
  );
}

async function getMetaValue(key: string): Promise<string | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM app_meta WHERE key = ?;',
    [key],
  );

  return row?.value ?? null;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const [enabledValue, toneValue] = await Promise.all([
    getMetaValue(NOTIFICATIONS_ENABLED_KEY),
    getMetaValue(NOTIFICATION_TONE_KEY),
  ]);

  return {
    enabled: enabledValue === null ? true : enabledValue === 'true',
    tone: toneValue === 'silent' ? 'silent' : 'default',
  };
}

export async function updateNotificationSettings(
  input: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const current = await getNotificationSettings();
  const next: NotificationSettings = {
    enabled: input.enabled ?? current.enabled,
    tone: input.tone ?? current.tone,
  };

  await Promise.all([
    setMetaValue(NOTIFICATIONS_ENABLED_KEY, next.enabled ? 'true' : 'false'),
    setMetaValue(NOTIFICATION_TONE_KEY, next.tone),
  ]);

  return next;
}
