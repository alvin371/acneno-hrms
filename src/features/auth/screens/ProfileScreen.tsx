import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { useAuthStore } from '@/store/authStore';
import { queryClient } from '@/lib/queryClient';
import type { ProfileStackParamList } from '@/navigation/types';
import { useProfileCity } from '@/features/auth/hooks/useProfileCity';
import { resolveMediaUrl } from '@/utils/media';

const WINE = '#8B1F2F';
const WINE_DARK = '#5A0F1A';
const WINE_DARKER = '#3D0A12';
const GOLD = '#FFD700';
const ONLINE = '#4ADE80';

const SIDE_PADDING = 16;
const GRID_GAP = 10;
const MAX_CONTENT_WIDTH = 600;

const STATS = [
  { label: 'Kehadiran', value: '-', icon: '📊' },
  { label: 'Sisa Cuti', value: '-', icon: '🏖️' },
  { label: 'Lembur/bln', value: '-', icon: '⏰' },
];

const ACTION_COLORS = {
  editProfile: { icon: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  password:    { icon: WINE,       bg: 'rgba(139,31,47,0.1)' },
  config:      { icon: '#0E7490',  bg: 'rgba(14,116,144,0.1)' },
  notif:       { icon: '#0369A1',  bg: 'rgba(3,105,161,0.1)' },
  help:        { icon: '#D97706',  bg: 'rgba(217,119,6,0.1)' },
};

function HeroGradient() {
  return (
    <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
      <Defs>
        <SvgLinearGradient id="heroGrad" x1="0%" y1="0%" x2="60%" y2="100%">
          <Stop offset="0%" stopColor={WINE_DARKER} />
          <Stop offset="40%" stopColor={WINE_DARK} />
          <Stop offset="100%" stopColor={WINE} />
        </SvgLinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#heroGrad)" />
    </Svg>
  );
}

function OnlinePill() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <View style={s.onlinePill}>
      <Animated.View style={[s.onlineDot, { opacity }]} />
      <Text style={s.onlineText}>Online</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  highlight,
  loading,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
  loading?: boolean;
}) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoIconWrap}>
        <Text style={s.infoIconEmoji}>{icon}</Text>
      </View>
      <View style={s.infoRowContent}>
        <Text style={s.infoRowLabel}>{label}</Text>
        {loading ? (
          <Text style={[s.infoRowValue, { color: '#aaa' }]}>Memuat…</Text>
        ) : (
          <Text style={[s.infoRowValue, highlight && { color: WINE, fontWeight: '700' }]}>
            {value}
          </Text>
        )}
      </View>
    </View>
  );
}

export const ProfileScreen = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const isTablet = width >= 768;
  const { user, clearSession } = useAuthStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { cityLabel, status: cityStatus } = useProfileCity();

  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const name = user?.name ?? 'Pengguna';
  const role = user?.role_name ?? user?.role ?? 'Karyawan';
  const department = user?.position_name ?? user?.role_name ?? '—';
  const profilePhotoUrl = resolveMediaUrl(user?.profilePicture);
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();

  const locationValue =
    cityStatus === 'success' && cityLabel
      ? cityLabel
      : cityStatus === 'loading'
      ? null
      : cityStatus === 'permission_denied'
      ? 'Izin lokasi diperlukan'
      : cityStatus === 'error'
      ? 'Tidak tersedia'
      : '—';

  const handleLogout = async () => {
    setLoggingOut(true);
    await clearSession();
    queryClient.clear();
  };

  const quickActions = [
    {
      emoji: '✏️',
      label: 'Edit Profil',
      ...ACTION_COLORS.editProfile,
      onPress: () => navigation.navigate('ProfileEdit'),
    },
    {
      emoji: '🛡️',
      label: 'Ubah Password',
      ...ACTION_COLORS.password,
      onPress: () => navigation.navigate('EditPassword'),
    },
    {
      emoji: '📶',
      label: 'Konfigurasi',
      ...ACTION_COLORS.config,
      onPress: () => navigation.navigate('Config'),
    },
    {
      emoji: '🔔',
      label: 'Pengingat Absensi',
      ...ACTION_COLORS.notif,
      onPress: () => navigation.navigate('NotificationSettings'),
    },
    { emoji: '❓', label: 'Bantuan', ...ACTION_COLORS.help, onPress: undefined },
  ];

  const actionAnims = useRef(quickActions.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(
      70,
      actionAnims.map((v) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      )
    ).start();
  }, [actionAnims]);

  const contentWidth = isTablet ? Math.min(width, MAX_CONTENT_WIDTH) : width;
  const contentInnerWidth = contentWidth - SIDE_PADDING * 2;
  const cardWidth = (contentInnerWidth - GRID_GAP) / 2;

  return (
    <View style={[s.root, isTablet && { alignItems: 'center' }]}>
      {/* Logout confirm overlay */}
      {logoutConfirm ? (
        <View style={s.overlay}>
          <View style={s.logoutDialog}>
            <Text style={s.logoutEmoji}>👋</Text>
            <Text style={s.logoutTitle}>Keluar dari Akun?</Text>
            <Text style={s.logoutSub}>Anda akan keluar dari sesi ini. Masuk kembali kapan saja.</Text>
            <View style={s.logoutActions}>
              <Pressable
                onPress={() => setLogoutConfirm(false)}
                style={s.logoutCancel}
              >
                <Text style={s.logoutCancelText}>Batal</Text>
              </Pressable>
              <Pressable
                onPress={() => { void handleLogout(); }}
                style={s.logoutConfirmBtn}
                disabled={loggingOut}
              >
                <Text style={s.logoutConfirmText}>
                  {loggingOut ? 'Keluar…' : '🚪 Keluar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      <ScrollView
        style={isTablet ? { width: '100%', maxWidth: MAX_CONTENT_WIDTH } : { width: '100%' }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: tabBarHeight + insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={s.hero}>
          <HeroGradient />
          {/* Decorative blobs */}
          <View style={s.blob1} />
          <View style={s.blob2} />
          <View style={s.blob3} />

          {/* Top bar */}
          <View style={[s.topBar, { marginTop: insets.top + 16 }]}>
            <Text style={s.topBarTitle}>Profil Saya</Text>
            <OnlinePill />
          </View>

          {/* Centered content */}
          <View style={s.heroCenter}>
            <View style={s.avatarWrap}>
              <View style={s.avatarCircle}>
                {profilePhotoUrl ? (
                  <Image source={{ uri: profilePhotoUrl }} style={s.avatarImage} />
                ) : (
                  <Text style={s.avatarInitials}>{initials}</Text>
                )}
              </View>
              <View style={s.companyBadge}>
                <Text style={s.companyBadgeEmoji}>🏢</Text>
              </View>
            </View>

            <Text style={s.heroName}>{name}</Text>
            <Text style={s.heroDept}>{department}</Text>
            <View style={s.rolePill}>
              <Text style={s.roleStar}>★</Text>
              <Text style={s.roleText}>{role}</Text>
            </View>
          </View>

          {/* Stats strip — glass morphism, edge-to-edge */}
          <View style={s.statsStrip}>
            {STATS.map((st, i) => (
              <View
                key={i}
                style={[s.statCell, i < STATS.length - 1 && s.statCellBorder]}
              >
                <Text style={s.statValue}>{st.value}</Text>
                <Text style={s.statLabel}>
                  {st.icon} {st.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick actions */}
        <View style={s.gridWrap}>
          {quickActions.map((a, i) => {
            const anim = actionAnims[i];
            const translateY = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 0],
            });
            const isLastOdd =
              quickActions.length % 2 === 1 && i === quickActions.length - 1;
            const itemWidth = isLastOdd ? contentInnerWidth : cardWidth;
            return (
              <Animated.View
                key={i}
                style={{ width: itemWidth, opacity: anim, transform: [{ translateY }] }}
              >
                <Pressable
                  onPress={a.onPress}
                  style={({ pressed }) => [s.gridCard, pressed && { opacity: 0.75 }]}
                >
                  <View style={[s.gridIconBadge, { backgroundColor: a.bg }]}>
                    <Text style={{ fontSize: 18 }}>{a.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.gridLabel} numberOfLines={1}>{a.label}</Text>
                    <Text style={s.gridSub}>Ketuk →</Text>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Bio card */}
        {user?.keterangan ? (
          <View style={[s.card, s.cardMargin, s.bioCard]}>
            <Text style={s.sectionLabel}>Keterangan</Text>
            <Text style={s.bioText}>{user.keterangan}</Text>
          </View>
        ) : null}

        {/* Info card */}
        <View style={[s.card, s.cardMargin, { overflow: 'hidden' }]}>
          <View style={s.infoCardHeader}>
            <Text style={s.sectionLabel}>Kontak & Informasi</Text>
          </View>
          <InfoRow icon="📧" label="Email" value={user?.email ?? '—'} />
          <View style={s.rowDivider} />
          <InfoRow icon="📱" label="Nomor HP" value={user?.phone_number ?? '—'} />
          <View style={s.rowDivider} />
          <InfoRow icon="🏢" label="Departemen" value={department} />
          <View style={s.rowDivider} />
          <InfoRow
            icon="📍"
            label="Lokasi"
            value={locationValue ?? ''}
            loading={cityStatus === 'loading'}
          />
          <View style={s.rowDivider} />
          <InfoRow icon="⭐" label="Role" value={role} highlight />
        </View>

        {/* Logout */}
        <View style={s.cardMargin}>
          <Pressable
            onPress={() => setLogoutConfirm(true)}
            style={({ pressed }) => [s.logoutBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={s.logoutBtnText}>🚪 Keluar dari Akun</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoutDialog: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
  },
  logoutEmoji: { fontSize: 32, marginBottom: 12 },
  logoutTitle: { fontSize: 17, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  logoutSub: { fontSize: 13, color: '#888', lineHeight: 20, textAlign: 'center', marginBottom: 22 },
  logoutActions: { flexDirection: 'row', gap: 10, width: '100%' },
  logoutCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  logoutCancelText: { fontSize: 13, fontWeight: '700', color: '#666' },
  logoutConfirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: WINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutConfirmText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  // Hero
  hero: {
    width: '100%',
    paddingBottom: 0,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  blob2: {
    position: 'absolute',
    top: 20,
    right: 60,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  blob3: {
    position: 'absolute',
    bottom: 30,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIDE_PADDING,
    marginBottom: 16,
  },
  topBarTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ONLINE },
  onlineText: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  heroCenter: {
    alignItems: 'center',
    paddingHorizontal: SIDE_PADDING,
    paddingBottom: 20,
  },
  avatarWrap: { marginBottom: 10, position: 'relative' },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  companyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  companyBadgeEmoji: { fontSize: 12 },
  heroName: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  heroDept: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 7,
  },
  roleStar: { fontSize: 11, color: GOLD },
  roleText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.95)' },
  statsStrip: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 14,
    paddingHorizontal: 0,
  },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 2, paddingHorizontal: 4 },
  statCellBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.12)' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2, textAlign: 'center' },
  // Grid
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginHorizontal: SIDE_PADDING,
    marginTop: 14,
  },
  gridCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    height: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  gridIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: { fontSize: 12, fontWeight: '700', color: '#1a1a1a' },
  gridSub: { fontSize: 10, color: '#bbb', marginTop: 1 },
  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardMargin: { marginHorizontal: SIDE_PADDING, marginTop: 12 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  bioCard: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14 },
  bioText: { fontSize: 13, color: '#444', lineHeight: 20, marginTop: 8 },
  infoCardHeader: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, gap: 12 },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconEmoji: { fontSize: 14 },
  infoRowContent: { flex: 1 },
  infoRowLabel: { fontSize: 10.5, color: '#aaa', marginBottom: 1 },
  infoRowValue: { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  rowDivider: { height: 1, backgroundColor: '#f8f8f8', marginLeft: 58 },
  // Logout
  logoutBtn: {
    height: 47,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: { fontSize: 13, fontWeight: '700', color: '#B91C1C' },
});
