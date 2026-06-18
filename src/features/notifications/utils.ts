import notifeeModule, {
  TriggerType,
  RepeatFrequency,
  AuthorizationStatus,
} from '@notifee/react-native';
import type { TimestampTrigger } from '@notifee/react-native';
import {
  REMINDER_DAYS,
  type NotifPrefs,
  type NotifOffset,
  type ReminderDay,
} from './store';
import type { UserSchedule } from '@/api/types';

const CLOCK_IN_NOTIF_ID = 'hrms.clock-in-reminder';
const CLOCK_OUT_NOTIF_ID = 'hrms.clock-out-reminder';
const CHANNEL_ID = 'hrms-attendance-reminders';
const DAY_TO_WEEKDAY: Record<ReminderDay, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 0,
};
const notifee = (notifeeModule ?? {
  createChannel: async () => undefined,
  requestPermission: async () => ({ authorizationStatus: 0 }),
  getNotificationSettings: async () => ({ authorizationStatus: 0 }),
  cancelTriggerNotification: async () => undefined,
  cancelTriggerNotifications: async () => undefined,
  createTriggerNotification: async () => undefined,
}) as typeof notifeeModule;

export const OFFSET_LABELS: Record<NotifOffset, string> = {
  on_time: 'Tepat waktu',
  '5_before': '5 menit sebelum',
  '10_before': '10 menit sebelum',
  '15_before': '15 menit sebelum',
  '30_before': '30 menit sebelum',
  '45_before': '45 menit sebelum',
  '60_before': '1 jam sebelum',
};

export const REMINDER_DAY_LABELS: Record<ReminderDay, string> = {
  mon: 'Sen',
  tue: 'Sel',
  wed: 'Rab',
  thu: 'Kam',
  fri: 'Jum',
  sat: 'Sab',
  sun: 'Min',
};

const OFFSET_MINUTES: Record<NotifOffset, number> = {
  on_time: 0,
  '5_before': 5,
  '10_before': 10,
  '15_before': 15,
  '30_before': 30,
  '45_before': 45,
  '60_before': 60,
};

const parseHHMM = (time: string): { hours: number; minutes: number } => {
  const [h, m] = time.split(':').map(Number);
  return { hours: h ?? 9, minutes: m ?? 0 };
};

export const nextWeeklyTimestamp = (
  day: ReminderDay,
  hours: number,
  minutes: number,
  offsetMinutes: number,
  now = new Date(),
): number => {
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  const currentWeekday = now.getDay();
  const targetWeekday = DAY_TO_WEEKDAY[day];
  let dayDiff = targetWeekday - currentWeekday;
  if (dayDiff < 0 || (dayDiff === 0 && target <= now)) dayDiff += 7;
  target.setDate(target.getDate() + dayDiff);
  target.setMinutes(target.getMinutes() - offsetMinutes);
  return target.getTime();
};

const buildReminderTriggerId = (
  reminderType: 'clock-in' | 'clock-out',
  day: ReminderDay,
) => `hrms.${reminderType}-reminder.${day}`;

export const getAttendanceReminderTriggerIds = (): string[] => [
  CLOCK_IN_NOTIF_ID,
  CLOCK_OUT_NOTIF_ID,
  ...REMINDER_DAYS.flatMap((day) => [
    buildReminderTriggerId('clock-in', day),
    buildReminderTriggerId('clock-out', day),
  ]),
];

const cancelAllAttendanceReminderTriggers = async (): Promise<void> => {
  await notifee.cancelTriggerNotifications(getAttendanceReminderTriggerIds());
};

export const getHolidayExclusionAvailability = () => false;

const ensureChannel = async () => {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Attendance Reminders',
  });
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
};

export const getNotificationPermissionStatus = async (): Promise<boolean> => {
  const settings = await notifee.getNotificationSettings();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
};

export const scheduleAttendanceReminders = async (
  prefs: NotifPrefs,
  schedule: UserSchedule,
): Promise<void> => {
  await ensureChannel();
  await cancelAllAttendanceReminderTriggers();

  if (prefs.clockInEnabled) {
    const { hours, minutes } = parseHHMM(schedule.start_time);
    const offsetMins = OFFSET_MINUTES[prefs.clockInOffset];
    const body =
      offsetMins > 0
        ? `Shift starts at ${schedule.start_time}. Check in ${OFFSET_LABELS[prefs.clockInOffset]}.`
        : `Your shift starts now at ${schedule.start_time}.`;

    for (const day of prefs.activeDays) {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: nextWeeklyTimestamp(day, hours, minutes, offsetMins),
        repeatFrequency: RepeatFrequency.WEEKLY,
      };
      await notifee.createTriggerNotification(
        {
          id: buildReminderTriggerId('clock-in', day),
          title: 'Time to check in',
          body,
          android: { channelId: CHANNEL_ID },
        },
        trigger,
      );
    }
  }

  if (prefs.clockOutEnabled) {
    const { hours, minutes } = parseHHMM(schedule.end_time);
    const offsetMins = OFFSET_MINUTES[prefs.clockOutOffset];
    const body =
      offsetMins > 0
        ? `Shift ends at ${schedule.end_time}. Check out ${OFFSET_LABELS[prefs.clockOutOffset]}.`
        : `Your shift ends now at ${schedule.end_time}.`;

    for (const day of prefs.activeDays) {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: nextWeeklyTimestamp(day, hours, minutes, offsetMins),
        repeatFrequency: RepeatFrequency.WEEKLY,
      };
      await notifee.createTriggerNotification(
        {
          id: buildReminderTriggerId('clock-out', day),
          title: 'Time to check out',
          body,
          android: { channelId: CHANNEL_ID },
        },
        trigger,
      );
    }
  }
};

export const cancelAttendanceReminders = async (): Promise<void> => {
  await cancelAllAttendanceReminderTriggers();
};
