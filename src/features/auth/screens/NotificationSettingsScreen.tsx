import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { openSettings } from 'react-native-permissions';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/utils/toast';
import { tokens } from '@/config/tokens';
import {
  useNotifStore,
  type NotifOffset,
  type ReminderDay,
  REMINDER_DAYS,
  WEEKDAY_REMINDER_DAYS,
  WEEKEND_REMINDER_DAYS,
} from '../../notifications/store';
import {
  scheduleAttendanceReminders,
  cancelAttendanceReminders,
  requestNotificationPermission,
  getNotificationPermissionStatus,
  OFFSET_LABELS,
  REMINDER_DAY_LABELS,
  getHolidayExclusionAvailability,
} from '../../notifications/utils';

const OFFSETS: NotifOffset[] = [
  'on_time',
  '5_before',
  '10_before',
  '15_before',
  '30_before',
  '45_before',
  '60_before',
];

const MAROON = tokens.colors.maroon;
const INK = tokens.colors.ink;
const TEXT_SUB = tokens.colors.textSub;
const BORDER_WARM = tokens.colors.borderWarm;
const WARM_SURFACE = tokens.colors.warmSurface;
const CHIP_BG = '#F5F5F5';
const DISABLED_OPTION = 'disabled';
const DAY_PRESET_WEEKDAY = 'weekday';
const DAY_PRESET_WEEKEND = 'weekend';
const DAY_PRESET_EVERYDAY = 'everyday';
const DAY_PRESETS = [DAY_PRESET_WEEKDAY, DAY_PRESET_WEEKEND, DAY_PRESET_EVERYDAY] as const;
type DayPreset = typeof DAY_PRESETS[number];

const getFallbackOffset = (offset: NotifOffset | undefined): NotifOffset =>
  offset ?? 'on_time';

const areSameDays = (left: ReminderDay[], right: ReminderDay[]) =>
  left.length === right.length && left.every((day, index) => day === right[index]);

const getDayPreset = (days: ReminderDay[]): DayPreset | null => {
  if (areSameDays(days, WEEKDAY_REMINDER_DAYS)) return DAY_PRESET_WEEKDAY;
  if (areSameDays(days, WEEKEND_REMINDER_DAYS)) return DAY_PRESET_WEEKEND;
  if (areSameDays(days, REMINDER_DAYS)) return DAY_PRESET_EVERYDAY;
  return null;
};

const getPresetDays = (preset: DayPreset): ReminderDay[] => {
  switch (preset) {
    case DAY_PRESET_WEEKEND:
      return WEEKEND_REMINDER_DAYS;
    case DAY_PRESET_EVERYDAY:
      return REMINDER_DAYS;
    case DAY_PRESET_WEEKDAY:
    default:
      return WEEKDAY_REMINDER_DAYS;
  }
};

export const NotificationSettingsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const user = useAuthStore((s) => s.user);
  const { prefs, isHydrated, hydrate, save } = useNotifStore();
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const holidayExclusionAvailable = getHolidayExclusionAvailability();

  useEffect(() => {
    hydrate();
    getNotificationPermissionStatus().then(setPermissionGranted);
  }, [hydrate]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        getNotificationPermissionStatus().then(setPermissionGranted);
      }
    });

    return () => subscription.remove();
  }, []);

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (granted && user?.schedule && (prefs.clockInEnabled || prefs.clockOutEnabled)) {
      await scheduleAttendanceReminders(prefs, user.schedule);
    }
    if (!granted) {
      showToast('error', 'Aktifkan notifikasi di pengaturan perangkat.');
    }
  }, [prefs, user?.schedule]);

  const handleOpenNotificationSettings = useCallback(async () => {
    try {
      await openSettings('notifications');
    } catch {
      try {
        await openSettings();
      } catch {
        showToast('error', 'Pengaturan perangkat tidak dapat dibuka.');
      }
    }
  }, []);

  const applyChanges = useCallback(
    async (updates: Partial<typeof prefs>) => {
      if (isSaving) return;
      setIsSaving(true);
      try {
        await save(updates);
        const next = { ...prefs, ...updates };
        const schedule = user?.schedule;
        if (!schedule) return;
        const anyEnabled = next.clockInEnabled || next.clockOutEnabled;
        if (anyEnabled) {
          await scheduleAttendanceReminders(next, schedule);
        } else {
          await cancelAttendanceReminders();
        }
      } catch {
        showToast('error', 'Pengingat tidak dapat diperbarui. Coba lagi.');
      } finally {
        setIsSaving(false);
      }
    },
    [prefs, save, user, isSaving],
  );

  const handleClockInToggle = useCallback(
    (enabled: boolean) =>
      applyChanges({
        clockInEnabled: enabled,
        clockInOffset: getFallbackOffset(prefs.clockInOffset),
      }),
    [applyChanges, prefs.clockInOffset],
  );

  const handleClockOutToggle = useCallback(
    (enabled: boolean) =>
      applyChanges({
        clockOutEnabled: enabled,
        clockOutOffset: getFallbackOffset(prefs.clockOutOffset),
      }),
    [applyChanges, prefs.clockOutOffset],
  );

  const handleClockInOption = useCallback(
    (option: NotifOffset | typeof DISABLED_OPTION) => {
      if (option === DISABLED_OPTION) {
        return applyChanges({ clockInEnabled: false });
      }
      return applyChanges({ clockInEnabled: true, clockInOffset: option });
    },
    [applyChanges],
  );

  const handleClockOutOption = useCallback(
    (option: NotifOffset | typeof DISABLED_OPTION) => {
      if (option === DISABLED_OPTION) {
        return applyChanges({ clockOutEnabled: false });
      }
      return applyChanges({ clockOutEnabled: true, clockOutOffset: option });
    },
    [applyChanges],
  );

  const handleDayPreset = useCallback(
    (preset: DayPreset) => applyChanges({ activeDays: getPresetDays(preset) }),
    [applyChanges],
  );

  const handleToggleDay = useCallback(
    (day: ReminderDay) => {
      const nextDays = prefs.activeDays.includes(day)
        ? prefs.activeDays.filter((item) => item !== day)
        : REMINDER_DAYS.filter((item) => item === day || prefs.activeDays.includes(item));

      if (nextDays.length === 0) return;
      return applyChanges({ activeDays: nextDays });
    },
    [applyChanges, prefs.activeDays],
  );

  const hasSchedule = !!user?.schedule;
  const selectedDayPreset = getDayPreset(prefs.activeDays);

  return (
    <View style={[s.root, { backgroundColor: WARM_SURFACE }]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 12,
          paddingBottom: tabBarHeight + insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={[s.backBtnText, { color: MAROON }]}>← Profil</Text>
          </Pressable>
          <Text style={[s.title, { color: INK }]}>Pengingat Absensi</Text>
          <Text style={[s.subtitle, { color: TEXT_SUB }]}>
            Atur pengingat masuk dan pulang kerja sesuai jadwal Anda.
          </Text>
        </View>

        {/* Permission banner */}
        {!permissionGranted && (
          <View
            style={[s.permBanner, { borderColor: '#FEF3C7', backgroundColor: '#FFFBEB' }]}
          >
            <Text style={[s.permBannerText, { color: '#92400E' }]}>
              Notifikasi belum aktif. Izinkan notifikasi lalu buka pengaturan perangkat bila
              diperlukan.
            </Text>
            <View style={s.permBannerActions}>
              <Pressable onPress={handleRequestPermission} style={s.permActionBtn}>
                <Text style={[s.permActionText, { color: MAROON }]}>Izinkan Notifikasi</Text>
              </Pressable>
              <Pressable onPress={handleOpenNotificationSettings} style={s.permActionBtn}>
                <Text style={[s.permActionText, { color: MAROON }]}>Buka Pengaturan</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* No schedule */}
        {!hasSchedule && (
          <View style={[s.noScheduleCard, { borderColor: BORDER_WARM }]}>
            <Text style={[s.noScheduleText, { color: TEXT_SUB }]}>
              Jadwal kerja belum tersedia. Hubungi HR agar pengingat bisa dipakai.
            </Text>
          </View>
        )}

        {/* Clock-in section */}
        {isHydrated && (
          <>
            <View style={[s.section, { borderColor: BORDER_WARM }]}>
              <View style={s.sectionIntro}>
                <Text style={[s.sectionTitle, { color: INK }]}>Hari pengingat</Text>
                <Text style={[s.sectionSub, { color: TEXT_SUB }]}>
                  Default pengingat aktif di hari kerja. Pilih preset atau atur hari satu per satu.
                </Text>
              </View>

              <View style={s.offsetGrid}>
                {DAY_PRESETS.map((preset) => {
                  const active = selectedDayPreset === preset;
                  const label =
                    preset === DAY_PRESET_WEEKDAY
                      ? 'Hari kerja'
                      : preset === DAY_PRESET_WEEKEND
                        ? 'Akhir pekan'
                        : 'Setiap hari';

                  return (
                    <Pressable
                      key={preset}
                      onPress={() => handleDayPreset(preset)}
                      disabled={!permissionGranted || !hasSchedule || isSaving}
                      style={[
                        s.offsetPill,
                        {
                          backgroundColor: active ? MAROON : CHIP_BG,
                          borderColor: active ? MAROON : BORDER_WARM,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.offsetPillText,
                          { color: active ? '#fff' : TEXT_SUB },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={s.offsetGrid}>
                {REMINDER_DAYS.map((day) => {
                  const active = prefs.activeDays.includes(day);
                  return (
                    <Pressable
                      key={day}
                      onPress={() => handleToggleDay(day)}
                      disabled={!permissionGranted || !hasSchedule || isSaving}
                      style={[
                        s.dayPill,
                        {
                          backgroundColor: active ? '#FDECEC' : '#fff',
                          borderColor: active ? MAROON : BORDER_WARM,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.dayPillText,
                          { color: active ? MAROON : TEXT_SUB },
                        ]}
                      >
                        {REMINDER_DAY_LABELS[day]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View
                style={[
                  s.placeholderCard,
                  {
                    borderColor: BORDER_WARM,
                    backgroundColor: holidayExclusionAvailable ? '#ECFDF5' : '#FAF7F2',
                  },
                ]}
              >
                <Text style={[s.placeholderTitle, { color: INK }]}>
                  Lewati hari libur nasional
                </Text>
                <Text style={[s.placeholderText, { color: TEXT_SUB }]}>
                  Segera tersedia setelah data hari libur nasional dikirim dari backend.
                </Text>
              </View>
            </View>

            <View style={[s.section, { borderColor: BORDER_WARM }]}>
              <View style={s.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.sectionTitle, { color: INK }]}>Pengingat clock in</Text>
                  {user?.schedule && (
                    <Text style={[s.sectionSub, { color: TEXT_SUB }]}>
                      Mulai kerja {user.schedule.start_time}
                    </Text>
                  )}
                </View>
                <Switch
                  value={prefs.clockInEnabled}
                  onValueChange={handleClockInToggle}
                  trackColor={{ false: BORDER_WARM, true: MAROON }}
                  thumbColor="#fff"
                  disabled={!permissionGranted || !hasSchedule || isSaving}
                />
              </View>

              <View style={s.offsetGrid}>
                {OFFSETS.map((offset) => {
                  const active = prefs.clockInEnabled && prefs.clockInOffset === offset;
                  return (
                    <Pressable
                      key={offset}
                      onPress={() => handleClockInOption(offset)}
                      disabled={!permissionGranted || !hasSchedule || isSaving}
                      style={[
                        s.offsetPill,
                        {
                          backgroundColor: active ? MAROON : CHIP_BG,
                          borderColor: active ? MAROON : BORDER_WARM,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.offsetPillText,
                          { color: active ? '#fff' : TEXT_SUB },
                        ]}
                      >
                        {OFFSET_LABELS[offset]}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => handleClockInOption(DISABLED_OPTION)}
                  disabled={!permissionGranted || !hasSchedule || isSaving}
                  style={[
                    s.offsetPill,
                    {
                      backgroundColor: !prefs.clockInEnabled ? MAROON : CHIP_BG,
                      borderColor: !prefs.clockInEnabled ? MAROON : BORDER_WARM,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.offsetPillText,
                      { color: !prefs.clockInEnabled ? '#fff' : TEXT_SUB },
                    ]}
                  >
                    Tidak diingatkan
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Clock-out section */}
            <View style={[s.section, { borderColor: BORDER_WARM }]}>
              <View style={s.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.sectionTitle, { color: INK }]}>Pengingat clock out</Text>
                  {user?.schedule && (
                    <Text style={[s.sectionSub, { color: TEXT_SUB }]}>
                      Selesai kerja {user.schedule.end_time}
                    </Text>
                  )}
                </View>
                <Switch
                  value={prefs.clockOutEnabled}
                  onValueChange={handleClockOutToggle}
                  trackColor={{ false: BORDER_WARM, true: MAROON }}
                  thumbColor="#fff"
                  disabled={!permissionGranted || !hasSchedule || isSaving}
                />
              </View>

              <View style={s.offsetGrid}>
                {OFFSETS.map((offset) => {
                  const active = prefs.clockOutEnabled && prefs.clockOutOffset === offset;
                  return (
                    <Pressable
                      key={offset}
                      onPress={() => handleClockOutOption(offset)}
                      disabled={!permissionGranted || !hasSchedule || isSaving}
                      style={[
                        s.offsetPill,
                        {
                          backgroundColor: active ? MAROON : CHIP_BG,
                          borderColor: active ? MAROON : BORDER_WARM,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.offsetPillText,
                          { color: active ? '#fff' : TEXT_SUB },
                        ]}
                      >
                        {OFFSET_LABELS[offset]}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => handleClockOutOption(DISABLED_OPTION)}
                  disabled={!permissionGranted || !hasSchedule || isSaving}
                  style={[
                    s.offsetPill,
                    {
                      backgroundColor: !prefs.clockOutEnabled ? MAROON : CHIP_BG,
                      borderColor: !prefs.clockOutEnabled ? MAROON : BORDER_WARM,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.offsetPillText,
                      { color: !prefs.clockOutEnabled ? '#fff' : TEXT_SUB },
                    ]}
                  >
                    Tidak diingatkan
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Footer note */}
            <Text style={[s.footerNote, { color: TEXT_SUB }]}>
              Pengingat mengikuti jadwal kerja Anda pada hari yang dipilih. Perubahan berlaku
              langsung.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    gap: 6,
    marginBottom: 24,
  },
  backBtn: {
    paddingVertical: 4,
    marginBottom: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  permBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  permBannerText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  permBannerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  permActionBtn: {
    borderWidth: 1,
    borderColor: BORDER_WARM,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  permActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noScheduleCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  noScheduleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionIntro: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  sectionSub: {
    fontSize: 13,
    marginTop: 2,
  },
  offsetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  offsetPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  offsetPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayPill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 52,
    alignItems: 'center',
  },
  dayPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  placeholderCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 12,
    lineHeight: 18,
  },
  footerNote: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
});
