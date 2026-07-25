import { cancelAllScheduledNotificationsAsync } from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';

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

setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

async function configureNotificationChannelAsync(): Promise<void> {
  return;
}

export async function initializeNotificationsAsync(): Promise<boolean> {
  await configureNotificationChannelAsync();

  const permissions = await getPermissionsAsync();
  let finalStatus = permissions.status;

  if (finalStatus !== 'granted') {
    const request = await requestPermissionsAsync();
    finalStatus = request.status;
  }

  return finalStatus === 'granted';
}

async function scheduleTaskNotification(task: Task): Promise<void> {
  if (!task.hora_inicio || task.estado === 'completada' || task.deleted_at) {
    return;
  }

  const triggerDate = buildTaskTriggerDate(task.hora_inicio);

  if (!triggerDate) {
    return;
  }

  const settings = await getNotificationSettings();

  await scheduleNotificationAsync({
    content: {
      title: 'Recordatorio de tarea',
      body: task.titulo,
      sound: settings.tone === 'silent' ? null : 'default',
      data: {
        url: '/home',
        type: 'task',
        localId: task.local_id,
      },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

async function scheduleRoutineHabitNotification(
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

  for (const day of routineDays) {
    await scheduleNotificationAsync({
      content: {
        title: 'Recordatorio de habito',
        body: relatedHabit.nombre,
        sound: settings.tone === 'silent' ? null : 'default',
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
      },
    });
  }
}

export async function clearScheduledNotificationsAsync(): Promise<void> {
  await cancelAllScheduledNotificationsAsync();
}

export async function syncScheduledNotificationsAsync(): Promise<void> {
  const settings = await getNotificationSettings();

  if (!settings.enabled) {
    await clearScheduledNotificationsAsync();
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

  await clearScheduledNotificationsAsync();

  for (const task of tasks) {
    await scheduleTaskNotification(task);
  }

  for (const link of activeLinks) {
    await scheduleRoutineHabitNotification(link, routineDays, habitsById);
  }
}
