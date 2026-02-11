import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/ui/Screen';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabsParamList } from '@/navigation/types';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTodayAttendance } from '@/features/attendance/hooks/useTodayAttendance';
import { computeAttendanceBadge } from '@/features/attendance/utils';

const WINE = '#a3253b';

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

const MENU_ITEMS = [
  { id: 'absensi', label: 'Absensi', subtitle: 'Log harian', color: '#8bbfda', iconName: 'calendar-outline', route: 'Attendance' as const },
  { id: 'cuti', label: 'Cuti', subtitle: 'Pengajuan', color: '#86efac', iconName: 'clipboard-outline', route: 'Leave' as const },
  { id: 'slip', label: 'Slip Gaji', subtitle: 'Detail', color: '#fda4af', iconName: 'document-text-outline', route: null },
  { id: 'performance', label: 'Performance', subtitle: 'Penilaian', color: '#fbbf24', iconName: 'trending-up-outline', route: 'Performance' as const },
  { id: 'lembur', label: 'Lembur', subtitle: 'Pengajuan', color: '#a78bfa', iconName: 'time-outline', route: 'Overtime' as const },
  { id: 'karyawan', label: 'Karyawan', subtitle: 'Direktori', color: '#fb923c', iconName: 'people-outline', route: null },
];

const NEWS_ITEMS = [
  {
    id: '1',
    badge: 'Internal' as const,
    title: 'Company Townhall Meeting Q1 2026',
    desc: 'Pembahasan strategi tahunan dan...',
    date: '10 Feb 2026',
    imageBg: '#e8e0d8',
  },
  {
    id: '2',
    badge: 'Event' as const,
    title: 'Workshop: Digital Wellbeing',
    desc: 'Meningkatkan produktivitas tanpa...',
    date: '08 Feb 2026',
    imageBg: '#d1e8d5',
  },
];

const BADGE_STYLES = {
  Internal: { bg: '#fee2e2', text: '#ef4444' },
  Event: { bg: '#d1fae5', text: '#10b981' },
};

type Props = BottomTabScreenProps<MainTabsParamList, 'Home'>;

const formatHHMM = (date: Date): string => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

export const HomeScreen = ({ navigation }: Props) => {
  const user = useAuthStore(s => s.user);
  const [now, setNow] = useState(() => new Date());
  const greeting = useMemo(() => getGreeting(), []);
  const formattedDate = useMemo(() => formatDateUppercase(now), [now]);
  const currentTime = useMemo(() => getCurrentTime(now), [now]);
  const initials = useMemo(() => getInitials(user?.name ?? 'U'), [user?.name]);

  const { checkInTime, checkOutTime } = useTodayAttendance();
  const badge = useMemo(() => computeAttendanceBadge(checkInTime, checkOutTime), [checkInTime, checkOutTime]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Screen
      scroll
      style={{ backgroundColor: '#f5f5f5' }}
      safeAreaStyle={{ backgroundColor: WINE }}
      contentContainerStyle={{ paddingTop: 0, paddingHorizontal: 0, padding: 0, paddingBottom: 100 }}
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
            <View style={s.bellCircle}>
              <Ionicons name="notifications-outline" size={20} color="#1a1a1a" />
            </View>
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
        <Text style={s.timeText}>{currentTime}</Text>
        <Text style={s.scheduleText}>Jadwal Kerja: 08:00 - 17:00</Text>
        <View style={s.btnRow}>
          <Pressable
            style={[s.masukBtn, checkInTime && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('Attendance')}
          >
            <View style={s.masukBtnInner}>
              <View style={s.masukIconCircle}>
                <Ionicons name={checkInTime ? 'checkmark' : 'arrow-forward'} size={14} color="#fff" />
              </View>
              <View>
                <Text style={s.masukBtnText}>Masuk</Text>
                {checkInTime && <Text style={s.btnTimeText}>{formatHHMM(checkInTime)}</Text>}
              </View>
            </View>
          </Pressable>
          <Pressable
            style={[s.pulangBtn, checkOutTime && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('Attendance')}
          >
            <View style={s.pulangBtnInner}>
              <View style={s.pulangIconCircle}>
                <Ionicons name={checkOutTime ? 'checkmark' : 'arrow-forward'} size={14} color={WINE} />
              </View>
              <View>
                <Text style={s.pulangBtnText}>Pulang</Text>
                {checkOutTime && <Text style={s.btnTimeTextOutline}>{formatHHMM(checkOutTime)}</Text>}
              </View>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Menu Utama */}
      <View style={s.menuSection}>
        <Text style={s.sectionTitle}>Menu Utama</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.menuScroll}
        >
          {MENU_ITEMS.map(item => (
            <Pressable
              key={item.id}
              style={s.menuItem}
              onPress={() => {
                if (item.route) navigation.navigate(item.route);
              }}
            >
              <View style={[s.menuCircle, { backgroundColor: item.color }]}>
                <Ionicons name={item.iconName} size={26} color="#fff" />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Text style={s.menuSubtitle}>{item.subtitle}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* News & Updates */}
      <View style={s.newsSection}>
        <View style={s.newsTitleRow}>
          <Text style={s.newsSectionTitle}>News & Updates</Text>
          <Pressable>
            <Text style={s.lihatSemua}>Lihat Semua</Text>
          </Pressable>
        </View>
        <View style={s.newsCards}>
          {NEWS_ITEMS.map(item => {
            const badge = BADGE_STYLES[item.badge];
            return (
              <View key={item.id} style={s.newsCard}>
                <View style={[s.newsImage, { backgroundColor: item.imageBg }]} />
                <View style={s.newsContent}>
                  <View style={[s.newsBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[s.newsBadgeText, { color: badge.text }]}>{item.badge}</Text>
                  </View>
                  <Text style={s.newsTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={s.newsDesc} numberOfLines={1}>{item.desc}</Text>
                  <Text style={s.newsDate}>{item.date}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
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
    backgroundColor: '#fff',
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
    color: '#fff',
  },
  bellCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  // Attendance Card
  attendanceCard: {
    marginTop: -56,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
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
    color: '#6b7280',
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
  timeText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginVertical: 4,
  },
  scheduleText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
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
    backgroundColor: '#fff',
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
    backgroundColor: 'rgba(163,37,59,0.1)',
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
    textAlign: 'center',
  },
  btnTimeTextOutline: {
    fontSize: 11,
    color: WINE,
    opacity: 0.7,
    textAlign: 'center',
  },

  // Menu Utama
  menuSection: {
    marginTop: 28,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 16,
  },
  menuScroll: {
    paddingHorizontal: 16,
    gap: 20,
  },
  menuItem: {
    width: 80,
    alignItems: 'center',
    gap: 4,
  },
  menuCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },

  // News & Updates
  newsSection: {
    marginTop: 28,
    paddingHorizontal: 16,
    gap: 14,
  },
  newsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  lihatSemua: {
    fontSize: 13,
    fontWeight: '600',
    color: WINE,
  },
  newsCards: {
    gap: 12,
  },
  newsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  newsImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  newsContent: {
    flex: 1,
    gap: 3,
  },
  newsBadge: {
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newsBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  newsDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  newsDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
});
