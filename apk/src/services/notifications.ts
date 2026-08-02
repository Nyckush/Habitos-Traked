import Constants from 'expo-constants';
import { Platform } from 'react-native';

import {
  getNotificationSettings,
  listHabits,
  listPendingTasks,
  listRoutineDays,
  listRoutineHabitLinks,
  listRoutines,
  type Habit,
  type RoutineDay,
  type RoutineHabitLink,
  type Task,
} from '@/database';

const WEEKDAY_MAP: Record<RoutineDay['dia_semana'], number> = {
  domingo: 1,
  lunes: 2,
  martes: 3,
  miercoles: 4,
  jueves: 5,
  viernes: 6,
  sabado: 7,
};

const SchedulableTriggerInputTypes = {
  DATE: 'date',
  WEEKLY: 'weekly',
} as const;

const NOTIFICATION_CHANNELS = {
  default: {
    channelId: 'reminders-default',
    sound: 'default' as const,
  },
  silent: {
    channelId: 'reminders-silent',
    sound: null,
  },
  notificacion1: {
    channelId: 'reminders-notificacion1',
    sound: 'notificacion1.mp3',
  },
  notificacion2: {
    channelId: 'reminders-notificacion2',
    sound: 'notificacion2.mp3',
  },
  notificacion3: {
    channelId: 'reminders-notificacion3',
    sound: 'notificacion3.mp3',
  },
} as const;

type ExpoNotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<ExpoNotificationsModule | null> | null = null;
let handlerConfigured = false;

function isExpoGoAndroid(): boolean {
  return Platform.OS === 'android' && Constants.appOwnership === 'expo';
}

async function getNotificationsModule(): Promise<ExpoNotificationsModule | null> {
  if (isExpoGoAndroid()) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications')
      .then((module) => {
        if (!handlerConfigured) {
          module.setNotificationHandler({
            handleNotification: async () => ({
              shouldPlaySound: true,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });

          handlerConfigured = true;
        }

        return module;
      })
      .catch((error) => {
        console.warn('No se pudo cargar expo-notifications.', error);
        return null;
      });
  }

  return notificationsModulePromise;
}

function parseHour(value: string): { hour: number; minute: number } | null {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const [hour, minute] = value.split(':').map(Number);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

function buildTaskTriggerDate(horaInicio: string): Date | null {
  const parsed = parseHour(horaInicio);

  if (!parsed) {
    return null;
  }

  const now = new Date();
  const triggerDate = new Date();
  triggerDate.setHours(parsed.hour, parsed.minute, 0, 0);

  if (triggerDate <= now) {
    return null;
  }

  return triggerDate;
}

async function configureNotificationChannelAsync(
  notifications: ExpoNotificationsModule,
): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    for (const config of Object.values(NOTIFICATION_CHANNELS)) {
      await notifications.setNotificationChannelAsync(config.channelId, {
        name: 'Recordatorios',
        description: 'Avisos de tareas y habitos programados.',
        importance: notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        sound: config.sound,
      });
    }
  } catch (error) {
    console.warn('No se pudo configurar el canal de notificaciones de Android.', error);
  }
}

function resolveNotificationSound(
  tone: Awaited<ReturnType<typeof getNotificationSettings>>['tone'],
): {
  sound: string | null;
  channelId: string;
} {
  return NOTIFICATION_CHANNELS[tone] ?? NOTIFICATION_CHANNELS.default;
}

export async function initializeNotificationsAsync(): Promise<boolean> {
  const notifications = await getNotificationsModule();

  if (!notifications) {
    return false;
  }

  await configureNotificationChannelAsync(notifications);

  const permissions = await notifications.getPermissionsAsync();
  let finalStatus = permissions.status;

  if (finalStatus !== 'granted') {
    const request = await notifications.requestPermissionsAsync();
    finalStatus = request.status;
  }

  return finalStatus === 'granted';
}

async function scheduleTaskNotification(
  notifications: ExpoNotificationsModule,
  task: Task,
): Promise<void> {
  if (!task.hora_inicio || task.estado === 'completada' || task.deleted_at) {
    return;
  }

  const triggerDate = buildTaskTriggerDate(task.hora_inicio);

  if (!triggerDate) {
    return;
  }

  const settings = await getNotificationSettings();
  const notificationSound = resolveNotificationSound(settings.tone);

  await notifications.scheduleNotificationAsync({
    content: {
      title: 'Recordatorio de tarea',
      body: task.titulo,
      sound: notificationSound.sound,
      data: {
        url: '/home',
        type: 'task',
        localId: task.local_id,
      },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      ...(Platform.OS === 'android' ? { channelId: notificationSound.channelId } : {}),
    },
  });
}

async function scheduleRoutineHabitNotification(
  notifications: ExpoNotificationsModule,
  link: RoutineHabitLink,
  days: RoutineDay[],
  habitsById: Map<string, Habit>,
): Promise<void> {
  if (!link.hora_inicio) {
    return;
  }

  const parsed = parseHour(link.hora_inicio);

  if (!parsed) {
    return;
  }

  const relatedHabit = habitsById.get(link.habito_local_id);

  if (!relatedHabit) {
    return;
  }

  const routineDays = days.filter((day) => day.rutina_local_id === link.rutina_local_id);

  const settings = await getNotificationSettings();
  const notificationSound = resolveNotificationSound(settings.tone);

  for (const day of routineDays) {
    await notifications.scheduleNotificationAsync({
      content: {
        title: 'Recordatorio de habito',
        body: relatedHabit.nombre,
        sound: notificationSound.sound,
        data: {
          url: '/home',
          type: 'routine-habit',
          localId: link.local_id,
        },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.WEEKLY,
        weekday: WEEKDAY_MAP[day.dia_semana],
        hour: parsed.hour,
        minute: parsed.minute,
        ...(Platform.OS === 'android' ? { channelId: notificationSound.channelId } : {}),
      },
    });
  }
}

export async function clearScheduledNotificationsAsync(): Promise<void> {
  const notifications = await getNotificationsModule();

  if (!notifications) {
    return;
  }

  await notifications.cancelAllScheduledNotificationsAsync();
}

export async function syncScheduledNotificationsAsync(): Promise<void> {
  const settings = await getNotificationSettings();

  if (!settings.enabled) {
    await clearScheduledNotificationsAsync();
    return;
  }

  const notifications = await getNotificationsModule();

  if (!notifications) {
    return;
  }

  const hasPermission = await initializeNotificationsAsync();

  if (!hasPermission) {
    return;
  }

  const [tasks, routines, routineDays, routineHabitLinks, habits] = await Promise.all([
    listPendingTasks(),
    listRoutines(),
    listRoutineDays(),
    listRoutineHabitLinks(),
    listHabits(),
  ]);

  const activeRoutineIds = new Set(routines.map((routine) => routine.local_id));
  const activeLinks = routineHabitLinks.filter((link) => activeRoutineIds.has(link.rutina_local_id));
  const habitsById = new Map(habits.map((habit) => [habit.local_id, habit]));

  await notifications.cancelAllScheduledNotificationsAsync();

  for (const task of tasks) {
    await scheduleTaskNotification(notifications, task);
  }

  for (const link of activeLinks) {
    await scheduleRoutineHabitNotification(notifications, link, routineDays, habitsById);
  }
}
