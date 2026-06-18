const mockCreateChannel = jest.fn();
const mockCancelTriggerNotifications = jest.fn();
const mockCreateTriggerNotification = jest.fn();

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: (...args: unknown[]) => mockCreateChannel(...args),
    requestPermission: jest.fn(),
    getNotificationSettings: jest.fn(),
    cancelTriggerNotification: jest.fn(),
    cancelTriggerNotifications: (...args: unknown[]) => mockCancelTriggerNotifications(...args),
    createTriggerNotification: (...args: unknown[]) => mockCreateTriggerNotification(...args),
  },
  TriggerType: { TIMESTAMP: 0 },
  RepeatFrequency: { DAILY: 1, WEEKLY: 2 },
  AuthorizationStatus: { AUTHORIZED: 1 },
}));

import {
  getAttendanceReminderTriggerIds,
  nextWeeklyTimestamp,
  scheduleAttendanceReminders,
} from '../utils';

describe('notification utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('computes the next weekly timestamp for later today by rolling a week ahead', () => {
    const now = new Date('2026-06-08T09:30:00');

    expect(nextWeeklyTimestamp('mon', 9, 0, 0, now)).toBe(
      new Date('2026-06-15T09:00:00').getTime(),
    );
  });

  it('computes offsets from the selected workday even when they cross midnight', () => {
    const now = new Date('2026-06-08T10:00:00');

    expect(nextWeeklyTimestamp('tue', 0, 15, 30, now)).toBe(
      new Date('2026-06-08T23:45:00').getTime(),
    );
  });

  it('returns both legacy and per-day trigger ids', () => {
    expect(getAttendanceReminderTriggerIds()).toEqual([
      'hrms.clock-in-reminder',
      'hrms.clock-out-reminder',
      'hrms.clock-in-reminder.mon',
      'hrms.clock-out-reminder.mon',
      'hrms.clock-in-reminder.tue',
      'hrms.clock-out-reminder.tue',
      'hrms.clock-in-reminder.wed',
      'hrms.clock-out-reminder.wed',
      'hrms.clock-in-reminder.thu',
      'hrms.clock-out-reminder.thu',
      'hrms.clock-in-reminder.fri',
      'hrms.clock-out-reminder.fri',
      'hrms.clock-in-reminder.sat',
      'hrms.clock-out-reminder.sat',
      'hrms.clock-in-reminder.sun',
      'hrms.clock-out-reminder.sun',
    ]);
  });

  it('schedules weekly triggers only for the selected days', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-08T08:00:00'));

    await scheduleAttendanceReminders(
      {
        clockInEnabled: true,
        clockInOffset: '10_before',
        clockOutEnabled: false,
        clockOutOffset: 'on_time',
        activeDays: ['mon', 'wed'],
      },
      {
        start_time: '09:00',
        end_time: '17:00',
        source: 'default',
        special_schedule: false,
      },
    );

    expect(mockCreateChannel).toHaveBeenCalledWith({
      id: 'hrms-attendance-reminders',
      name: 'Attendance Reminders',
    });
    expect(mockCancelTriggerNotifications).toHaveBeenCalledWith(
      getAttendanceReminderTriggerIds(),
    );
    expect(mockCreateTriggerNotification).toHaveBeenCalledTimes(2);
    expect(mockCreateTriggerNotification).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 'hrms.clock-in-reminder.mon' }),
      expect.objectContaining({
        type: 0,
        repeatFrequency: 2,
        timestamp: new Date('2026-06-08T08:50:00').getTime(),
      }),
    );
    expect(mockCreateTriggerNotification).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: 'hrms.clock-in-reminder.wed' }),
      expect.objectContaining({
        type: 0,
        repeatFrequency: 2,
        timestamp: new Date('2026-06-10T08:50:00').getTime(),
      }),
    );

    jest.useRealTimers();
  });
});
