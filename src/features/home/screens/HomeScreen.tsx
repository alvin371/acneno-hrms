import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/ui/Screen';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabsParamList } from '@/navigation/types';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTodayAttendance } from '@/features/attendance/hooks/useTodayAttendance';
import { computeAttendanceBadge } from '@/features/attendance/utils';
import { formatScheduleRange } from '@/utils/schedule';
import { tokens } from '@/config/tokens';
import { MiniboxDropdown } from '@/features/notifications/components/MiniboxDropdown';
import { useNotifFeedStore } from '@/features/notifications/notifFeedStore';

const WINE = tokens.colors.maroon;
const WINE_ACTIVE = tokens.colors.maroonActive;
const INK = tokens.colors.ink;
const TEXT_SUB = tokens.colors.textSub;
const SURFACE = '#FFFFFF';
const SURFACE_TINT = '#FCFBFA';
const MAROON_TINT = '#F0E8EA';

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi,';
  if (hour < 15) return 'Selamat Siang,';
  if (hour < 18) return 'Selamat Sore,';
  return 'Selamat Malam,';
};

const formatDateUppercase = (date: Date): string => {
  const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const getCurrentTime = (date: Date): string => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const QUICK_ACTIONS = [
  { id: 'absensi', label: 'Absensi', subtitle: 'Check in dan riwayat', iconName: 'calendar-outline', route: 'Attendance' as const },
  { id: 'cuti', label: 'Cuti', subtitle: 'Ajukan atau cek status', iconName: 'clipboard-outline', route: 'Leave' as const },
  { id: 'lembur', label: 'Lembur', subtitle: 'Pengajuan hari kerja', iconName: 'time-outline', route: 'Overtime' as const },
  { id: 'approvals', label: 'Approval', subtitle: 'Tindak lanjuti permintaan', iconName: 'shield-checkmark-outline', route: 'Approvals' as const },
];

type Props = BottomTabScreenProps<MainTabsParamList, 'Home'>;

const formatHHMM = (date: Date): string => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const getAttendanceSummary = (
  checkInTime: Date | null,
  checkOutTime: Date | null,
): string => {
  if (checkOutTime) {
    return `Absensi hari ini selesai pada ${formatHHMM(checkOutTime)}.`;
  }
  if (checkInTime) {
    return `Masuk tercatat pada ${formatHHMM(checkInTime)}. Lanjutkan untuk pulang nanti.`;
  }
  return 'Belum ada absensi hari ini. Buka halaman absensi untuk check in.';
};

export const HomeScreen = ({ navigation }: Props) => {
  const user = useAuthStore(s => s.user);
  const [now, setNow] = useState(() => new Date());
  const [miniboxVisible, setMiniboxVisible] = useState(false);
  const greeting = useMemo(() => getGreeting(), []);
  const formattedDate = useMemo(() => formatDateUppercase(now), [now]);
  const currentTime = useMemo(() => getCurrentTime(now), [now]);
  const initials = useMemo(() => getInitials(user?.name ?? 'U'), [user?.name]);
  const scheduleLabel = useMemo(
    () => formatScheduleRange(user?.schedule),
    [user?.schedule]
  );

  const { notifs, markRead, markAll } = useNotifFeedStore();
  const unreadCount = notifs.filter(n => !n.read).length;

  const { checkInTime, checkOutTime } = useTodayAttendance();
  const badge = useMemo(() => computeAttendanceBadge(checkInTime, checkOutTime), [checkInTime, checkOutTime]);
  const attendanceSummary = useMemo(
    () => getAttendanceSummary(checkInTime, checkOutTime),
    [checkInTime, checkOutTime]
  );
  const primaryAttendanceLabel = checkInTime ? 'Lihat Absensi' : 'Buka Absensi';
  const secondaryAttendanceLabel = checkOutTime ? 'Riwayat Hari Ini' : 'Detail Jadwal';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Screen
      scroll
      style={{ backgroundColor: tokens.colors.warmSurface }}
      safeAreaStyle={{ backgroundColor: WINE }}
      contentContainerStyle={{ paddingTop: 0, paddingHorizontal: 0, padding: 0 }}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerContent}>
          <View style={s.headerRow}>
            <View style={s.headerLeft}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <View>
                <Text style={s.greetingText}>{greeting}</Text>
                <Text style={s.nameText}>{user?.name ?? 'User'}</Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [s.bellCircle, pressed && { opacity: 0.75 }]}
              onPress={() => setMiniboxVisible(true)}
              hitSlop={6}
            >
              <Ionicons name="notifications-outline" size={20} color={INK} />
              {unreadCount > 0 && (
                <View style={s.bellBadge}>
                  <Text style={s.bellBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
        {/* Rounded bottom curve */}
        <View style={s.headerCurve} />
      </View>

      {/* Attendance Card */}
      <View style={s.attendanceCard}>
        <View style={s.attendanceTopRow}>
          <Text style={s.dateText}>{formattedDate}</Text>
          {badge && (
            <View style={[s.statusBadge, { backgroundColor: badge.bgColor }]}>
              <Text style={[s.statusBadgeText, { color: badge.textColor }]}>{badge.label}</Text>
            </View>
          )}
        </View>
        <Text style={s.attendanceEyebrow}>Status absensi hari ini</Text>
        <Text style={s.timeText}>{currentTime}</Text>
        <Text style={s.scheduleText}>Jadwal kerja {scheduleLabel}</Text>
        <Text style={s.summaryText}>{attendanceSummary}</Text>
        <View style={s.statusRow}>
          <View style={s.statusPill}>
            <Text style={s.statusPillLabel}>Masuk</Text>
            <Text style={s.statusPillValue}>{checkInTime ? formatHHMM(checkInTime) : '--:--'}</Text>
          </View>
          <View style={s.statusPill}>
            <Text style={s.statusPillLabel}>Pulang</Text>
            <Text style={s.statusPillValue}>{checkOutTime ? formatHHMM(checkOutTime) : '--:--'}</Text>
          </View>
        </View>
        <View style={s.btnRow}>
          <Pressable style={s.masukBtn} onPress={() => navigation.navigate('Attendance')}>
            <View style={s.masukBtnInner}>
              <View style={s.masukIconCircle}>
                <Ionicons name={checkInTime ? 'list-outline' : 'arrow-forward'} size={14} color="#fff" />
              </View>
              <View>
                <Text style={s.masukBtnText}>{primaryAttendanceLabel}</Text>
                <Text style={s.btnTimeText}>Check in dan check out</Text>
              </View>
            </View>
          </Pressable>
          <Pressable style={s.pulangBtn} onPress={() => navigation.navigate('Attendance')}>
            <View style={s.pulangBtnInner}>
              <View style={s.pulangIconCircle}>
                <Ionicons name="time-outline" size={14} color={WINE} />
              </View>
              <View>
                <Text style={s.pulangBtnText}>{secondaryAttendanceLabel}</Text>
                <Text style={s.btnTimeTextOutline}>Jadwal dan detail hari ini</Text>
              </View>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Akses Cepat */}
      <View style={s.menuSection}>
        <View style={s.menuSectionHeader}>
          <Text style={s.sectionTitle}>Akses Cepat</Text>
          <Text style={s.sectionCaption}>Empat hal yang paling sering dibuka.</Text>
        </View>
        <View style={s.menuGrid}>
          {QUICK_ACTIONS.map(item => (
            <Pressable key={item.id} style={s.menuItem} onPress={() => navigation.navigate(item.route)}>
              <View style={s.menuCircle}>
                <Ionicons name={item.iconName} size={22} color={WINE_ACTIVE} />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Text style={s.menuSubtitle}>{item.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <MiniboxDropdown
        visible={miniboxVisible}
        notifs={notifs}
        onClose={() => setMiniboxVisible(false)}
        onViewAll={() => {
          setMiniboxVisible(false);
          navigation.navigate('Notifications');
        }}
        onMarkAll={() => markAll()}
        onTapItem={(n) => {
          markRead(n.id);
          setMiniboxVisible(false);
          navigation.navigate('Notifications');
        }}
      />
    </Screen>
  );
};

const s = StyleSheet.create({
  // Header
  header: {
    backgroundColor: WINE,
    paddingBottom: 28,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: WINE,
  },
  greetingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: SURFACE,
  },
  bellCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#FCD34D',
    borderWidth: 2,
    borderColor: WINE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: WINE,
    lineHeight: 13,
  },
  headerCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: tokens.colors.warmSurface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  // Attendance Card
  attendanceCard: {
    marginTop: -56,
    marginHorizontal: 16,
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: tokens.colors.borderWarm,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  attendanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_SUB,
  },
  statusBadge: {
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceEyebrow: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: INK,
    textAlign: 'center',
  },
  timeText: {
    fontSize: 40,
    fontWeight: '700',
    color: INK,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  scheduleText: {
    fontSize: 13,
    color: TEXT_SUB,
    textAlign: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 18,
    color: INK,
    textAlign: 'center',
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statusPill: {
    flex: 1,
    backgroundColor: SURFACE_TINT,
    borderWidth: 1,
    borderColor: tokens.colors.borderWarm,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  statusPillLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_SUB,
  },
  statusPillValue: {
    fontSize: 16,
    fontWeight: '700',
    color: INK,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  masukBtn: {
    flex: 1,
    backgroundColor: WINE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masukBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  masukIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masukBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  pulangBtn: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: WINE,
  },
  pulangBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulangIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: MAROON_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulangBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: WINE,
  },
  btnTimeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  btnTimeTextOutline: {
    fontSize: 11,
    color: WINE,
    opacity: 0.7,
  },

  // Akses Cepat
  menuSection: {
    marginTop: 28,
    marginHorizontal: 16,
    gap: 12,
  },
  menuSectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: INK,
  },
  sectionCaption: {
    fontSize: 13,
    color: TEXT_SUB,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuItem: {
    width: '48%',
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: tokens.colors.borderWarm,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 10,
  },
  menuCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: MAROON_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: INK,
  },
  menuSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_SUB,
  },
});
