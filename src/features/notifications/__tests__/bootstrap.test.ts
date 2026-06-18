const mockLoadNotifPrefs = jest.fn();
const mockGetNotificationPermissionStatus = jest.fn();
const mockScheduleAttendanceReminders = jest.fn();
const mockCancelAttendanceReminders = jest.fn();

jest.mock('../store', () => ({
  __esModule: true,
  loadNotifPrefs: (...args: unknown[]) => mockLoadNotifPrefs(...args),
}));

jest.mock('../utils', () => ({
  __esModule: true,
  getNotificationPermissionStatus: (...args: unknown[]) =>
    mockGetNotificationPermissionStatus(...args),
  scheduleAttendanceReminders: (...args: unknown[]) =>
    mockScheduleAttendanceReminders(...args),
  cancelAttendanceReminders: (...args: unknown[]) =>
    mockCancelAttendanceReminders(...args),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

import { syncStoredAttendanceReminders } from '../bootstrap';

describe('syncStoredAttendanceReminders', () => {
  const schedule = {
    start_time: '09:00',
    end_time: '17:00',
    source: 'default',
    special_schedule: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when notifications are not granted', async () => {
    mockLoadNotifPrefs.mockResolvedValue({
      clockInEnabled: true,
      clockInOffset: 'on_time',
      clockOutEnabled: true,
      clockOutOffset: 'on_time',
      activeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    });
    mockGetNotificationPermissionStatus.mockResolvedValue(false);

    await syncStoredAttendanceReminders(schedule);

    expect(mockScheduleAttendanceReminders).not.toHaveBeenCalled();
    expect(mockCancelAttendanceReminders).not.toHaveBeenCalled();
  });

  it('schedules reminders when at least one section is enabled', async () => {
    const prefs = {
      clockInEnabled: true,
      clockInOffset: '10_before',
      clockOutEnabled: false,
      clockOutOffset: 'on_time',
      activeDays: ['sat', 'sun'],
    };
    mockLoadNotifPrefs.mockResolvedValue(prefs);
    mockGetNotificationPermissionStatus.mockResolvedValue(true);

    await syncStoredAttendanceReminders(schedule);

    expect(mockScheduleAttendanceReminders).toHaveBeenCalledWith(prefs, schedule);
    expect(mockCancelAttendanceReminders).not.toHaveBeenCalled();
  });

  it('cancels stored reminders when both sections are disabled', async () => {
    mockLoadNotifPrefs.mockResolvedValue({
      clockInEnabled: false,
      clockInOffset: 'on_time',
      clockOutEnabled: false,
      clockOutOffset: 'on_time',
      activeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    });
    mockGetNotificationPermissionStatus.mockResolvedValue(true);

    await syncStoredAttendanceReminders(schedule);

    expect(mockCancelAttendanceReminders).toHaveBeenCalled();
    expect(mockScheduleAttendanceReminders).not.toHaveBeenCalled();
  });
});
