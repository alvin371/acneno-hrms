import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';

export type NotifOffset =
  | 'on_time'
  | '5_before'
  | '10_before'
  | '15_before'
  | '30_before'
  | '45_before'
  | '60_before';

export type ReminderDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type NotifPrefs = {
  clockInEnabled: boolean;
  clockInOffset: NotifOffset;
  clockOutEnabled: boolean;
  clockOutOffset: NotifOffset;
  activeDays: ReminderDay[];
};

export const REMINDER_DAYS: ReminderDay[] = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
];

export const WEEKDAY_REMINDER_DAYS: ReminderDay[] = REMINDER_DAYS.slice(0, 5);
export const WEEKEND_REMINDER_DAYS: ReminderDay[] = REMINDER_DAYS.slice(5);

const DEFAULT_PREFS: NotifPrefs = {
  clockInEnabled: true,
  clockInOffset: 'on_time',
  clockOutEnabled: true,
  clockOutOffset: 'on_time',
  activeDays: WEEKDAY_REMINDER_DAYS,
};

const PREFS_KEY = 'hrms.notifPrefs';
const VALID_OFFSETS: NotifOffset[] = [
  'on_time',
  '5_before',
  '10_before',
  '15_before',
  '30_before',
  '45_before',
  '60_before',
];

const normalizeActiveDays = (value: unknown): ReminderDay[] => {
  if (!Array.isArray(value)) return DEFAULT_PREFS.activeDays;

  const uniqueDays = REMINDER_DAYS.filter((day) => value.includes(day));
  return uniqueDays.length > 0 ? uniqueDays : DEFAULT_PREFS.activeDays;
};

const savePrefs = async (prefs: NotifPrefs) => {
  await Keychain.setGenericPassword('prefs', JSON.stringify(prefs), {
    service: PREFS_KEY,
  });
};

const normalizeOffset = (value: unknown): NotifOffset =>
  typeof value === 'string' && VALID_OFFSETS.includes(value as NotifOffset)
    ? (value as NotifOffset)
    : 'on_time';

export const normalizeNotifPrefs = (value: unknown): NotifPrefs => {
  const raw = (value && typeof value === 'object' ? value : {}) as Partial<NotifPrefs>;
  return {
    clockInEnabled:
      typeof raw.clockInEnabled === 'boolean'
        ? raw.clockInEnabled
        : DEFAULT_PREFS.clockInEnabled,
    clockInOffset: normalizeOffset(raw.clockInOffset),
    clockOutEnabled:
      typeof raw.clockOutEnabled === 'boolean'
        ? raw.clockOutEnabled
        : DEFAULT_PREFS.clockOutEnabled,
    clockOutOffset: normalizeOffset(raw.clockOutOffset),
    activeDays: normalizeActiveDays(raw.activeDays),
  };
};

export const loadNotifPrefs = async (): Promise<NotifPrefs> => {
  try {
    const result = await Keychain.getGenericPassword({ service: PREFS_KEY });
    if (result) {
      return normalizeNotifPrefs(JSON.parse(result.password));
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_PREFS;
};

type NotifStore = {
  prefs: NotifPrefs;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  save: (updates: Partial<NotifPrefs>) => Promise<void>;
};

export const useNotifStore = create<NotifStore>((set, get) => ({
  prefs: DEFAULT_PREFS,
  isHydrated: false,
  hydrate: async () => {
    const prefs = await loadNotifPrefs();
    set({ prefs, isHydrated: true });
  },
  save: async (updates) => {
    const next = { ...get().prefs, ...updates };
    set({ prefs: next });
    await savePrefs(next);
  },
}));
