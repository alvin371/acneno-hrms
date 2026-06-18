import { useEffect } from 'react';
import * as Keychain from 'react-native-keychain';
import type { UserSchedule } from '@/api/types';
import { useAuthStore } from '@/store/authStore';
import { loadNotifPrefs } from './store';
import {
  cancelAttendanceReminders,
  getNotificationPermissionStatus,
  scheduleAttendanceReminders,
} from './utils';

const PROMPT_SEEN_KEY = 'hrms.attendanceReminderPromptSeen';

const savePromptSeenFlag = async () => {
  await Keychain.setGenericPassword('attendance-reminder', '1', {
    service: PROMPT_SEEN_KEY,
  });
};

export const hasSeenAttendanceReminderPrompt = async (): Promise<boolean> => {
  try {
    const result = await Keychain.getGenericPassword({ service: PROMPT_SEEN_KEY });
    return !!result && result.password === '1';
  } catch {
    return false;
  }
};

export const markAttendanceReminderPromptSeen = async (): Promise<void> => {
  await savePromptSeenFlag();
};

export const syncStoredAttendanceReminders = async (
  schedule?: UserSchedule | null,
): Promise<void> => {
  if (!schedule) return;

  const prefs = await loadNotifPrefs();
  const permissionGranted = await getNotificationPermissionStatus();
  if (!permissionGranted) return;

  if (prefs.clockInEnabled || prefs.clockOutEnabled) {
    await scheduleAttendanceReminders(prefs, schedule);
    return;
  }

  await cancelAttendanceReminders();
};

export const AttendanceReminderBootstrap = () => {
  const user = useAuthStore((state) => state.user);
  const schedule = user?.schedule;

  useEffect(() => {
    syncStoredAttendanceReminders(schedule).catch(() => {});
  }, [schedule?.start_time, schedule?.end_time, schedule?.source, schedule?.special_schedule]);

  return null;
};
