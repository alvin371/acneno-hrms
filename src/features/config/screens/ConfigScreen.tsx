import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { tokens } from '@/config/tokens';
import { getConfig } from '@/features/config/api';
import { getConfigWifiAllowlist } from '@/features/config/selectors';
import { showToast } from '@/utils/toast';
import {
  normalizeBssid,
  normalizeSsid,
  readCurrentWifiSnapshot,
  type WifiReadStatus,
  type WifiSnapshot,
} from '@/utils/wifi';

const MAROON = tokens.colors.maroon;
const INK = tokens.colors.ink;
const TEXT_SUB = tokens.colors.textSub;
const TEXT_MUTED = tokens.colors.textMuted;
const WARM_SURFACE = tokens.colors.warmSurface;
const BORDER_WARM = tokens.colors.borderWarm;
const SURFACE = '#FFFFFF';
const SAND = '#F2F0ED';
const MAROON_TINT = '#F0E8EA';
const SUCCESS = '#047857';
const SUCCESS_BG = '#D1FAE5';
const WARNING = '#B45309';
const WARNING_BG = '#FEF3C7';

const SIDE_PADDING = 16;

const EMPTY_SNAPSHOT: WifiSnapshot = {
  ssid: null,
  bssid: null,
  ip: null,
  subnet: null,
  strength: null,
  frequency: null,
  isWifiConnected: false,
};

const READ_STATUS_MESSAGE: Record<WifiReadStatus, string> = {
  ok: '',
  permission_location: 'Izin lokasi diperlukan agar nama Wi-Fi (SSID/BSSID) bisa dibaca.',
  permission_wifi: 'Izin Wi-Fi diperlukan agar data jaringan bisa dibaca di perangkat ini.',
  not_connected: 'Perangkat belum terhubung ke Wi-Fi.',
  ssid_unreadable: 'Wi-Fi terhubung, tetapi nama jaringan belum bisa dibaca.',
  bssid_unreadable: 'Wi-Fi terhubung, tetapi BSSID router belum bisa dibaca.',
};

const strengthBars = (strength: number | null) => {
  if (strength == null) return 0;
  if (strength >= 80) return 4;
  if (strength >= 60) return 3;
  if (strength >= 40) return 2;
  if (strength >= 20) return 1;
  return 0;
};

const bandLabel = (freq: number | null) => {
  if (freq == null) return null;
  if (freq >= 5925) return '6 GHz';
  if (freq >= 4900) return '5 GHz';
  if (freq >= 2400) return '2.4 GHz';
  return null;
};

function CopyRow({
  label,
  value,
  mono,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <View style={s.copyRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.copyLabel}>{label}</Text>
        <Text style={[s.copyValue, mono && s.monoText]} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <Pressable
        onPress={onCopy}
        style={[s.copyBtn, copied && s.copyBtnDone]}
        disabled={value === '—'}
      >
        <Text style={[s.copyBtnText, copied && s.copyBtnTextDone]}>
          {copied ? '✓ Disalin' : '📋 Salin'}
        </Text>
      </Pressable>
    </View>
  );
}

export const ConfigScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [snapshot, setSnapshot] = useState<WifiSnapshot>(EMPTY_SNAPSHOT);
  const [scanning, setScanning] = useState(false);
  const [readStatus, setReadStatus] = useState<WifiReadStatus>('not_connected');
  const [copied, setCopied] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const configQuery = useQuery({ queryKey: ['config'], queryFn: getConfig });
  const allowlist = getConfigWifiAllowlist(configQuery.data);

  const refreshSnapshot = useCallback(async () => {
    setScanning(true);
    try {
      const result = await readCurrentWifiSnapshot();
      setSnapshot(result.snapshot);
      setReadStatus(result.status);
    } catch {
      setSnapshot(EMPTY_SNAPSHOT);
      setReadStatus('not_connected');
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    void refreshSnapshot();
  }, [refreshSnapshot]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const handleCopy = (key: string, value: string) => {
    Clipboard.setString(value);
    setCopied(key);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(null), 1500);
  };

  const handleRefresh = async () => {
    await Promise.all([refreshSnapshot(), configQuery.refetch()]);
    showToast('success', 'Wi-Fi disegarkan');
  };

  const ssidDisplay = snapshot.ssid ?? '—';
  const bssidDisplay = snapshot.bssid ?? '—';
  const ipDisplay = snapshot.ip ?? '—';
  const subnetDisplay = snapshot.subnet ?? '—';
  const statusMessage = READ_STATUS_MESSAGE[readStatus];

  const bssidNormalized = normalizeBssid(snapshot.bssid);
  const ssidNormalized = normalizeSsid(snapshot.ssid);
  const allowedBssidsLower = allowlist.allowedBssids.map((b) => normalizeBssid(b));
  const allowedSsidsLower = allowlist.allowedSsids.map((b) => b.toLowerCase());
  const isAuthorizedByBssid =
    !!bssidNormalized && allowedBssidsLower.includes(bssidNormalized);
  const isAuthorizedBySsid =
    !isAuthorizedByBssid &&
    !!ssidNormalized &&
    allowedSsidsLower.includes(ssidNormalized.toLowerCase());
  const isAuthorized = isAuthorizedByBssid || isAuthorizedBySsid;

  const bars = strengthBars(snapshot.strength);
  const signalLabel =
    bars >= 4 ? 'Sangat Kuat' : bars === 3 ? 'Kuat' : bars === 2 ? 'Sedang' : bars === 1 ? 'Lemah' : '—';
  const band = bandLabel(snapshot.frequency);

  const allowlistRows = (() => {
    const pairs: { key: string; ssid: string | null; bssid: string | null }[] = [];
    const maxLen = Math.max(
      allowlist.allowedBssids.length,
      allowlist.allowedSsids.length
    );
    for (let i = 0; i < maxLen; i++) {
      const bssid = allowlist.allowedBssids[i] ?? null;
      const ssid = allowlist.allowedSsids[i] ?? null;
      pairs.push({ key: `${bssid ?? ''}-${ssid ?? ''}-${i}`, ssid, bssid });
    }
    return pairs;
  })();

  return (
    <Screen
      style={s.root}
      safeAreaStyle={{ backgroundColor: WARM_SURFACE }}
      contentContainerStyle={{ flex: 1 }}
    >
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{
          paddingHorizontal: SIDE_PADDING,
          paddingTop: insets.top + 12,
          paddingBottom: tabBarHeight + insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backBtnText}>← Profil</Text>
          </Pressable>
          <Text style={s.headerTitle}>Konfigurasi Wi-Fi</Text>
          <Text style={s.headerSub}>
            Cek Wi-Fi yang sedang dipakai, lalu cocokkan dengan daftar kantor.
          </Text>
        </View>

        {/* Connected Wi-Fi card */}
        <View style={s.connectedCard}>
          <View style={s.connectedHeaderRow}>
            <View style={s.connectedHeaderLeft}>
              <View style={s.connectedIconWrap}>
                <Text style={{ fontSize: 16 }}>📶</Text>
              </View>
              <View>
                <Text style={s.connectedKicker}>Terhubung</Text>
                {band ? (
                  <Text style={s.connectedSub}>{band}</Text>
                ) : (
                  <Text style={s.connectedSub}>
                    {snapshot.isWifiConnected ? 'Wi-Fi' : 'Tidak terhubung'}
                  </Text>
                )}
              </View>
            </View>
            <Pressable
              onPress={handleRefresh}
              disabled={scanning}
              style={[s.refreshBtn, scanning && { opacity: 0.6 }]}
            >
              {scanning ? (
                <ActivityIndicator size="small" color={MAROON} />
              ) : (
                <Text style={s.refreshBtnText}>Refresh</Text>
              )}
            </Pressable>
          </View>

          <Text style={s.ssidBig} numberOfLines={2}>
            {ssidDisplay}
          </Text>

          <View
            style={[
              s.authPill,
              isAuthorized ? s.authPillOk : s.authPillWarn,
            ]}
          >
            <View
              style={[
                s.authDot,
                { backgroundColor: isAuthorized ? SUCCESS : WARNING },
              ]}
            />
            <Text
              style={[
                s.authText,
                { color: isAuthorized ? SUCCESS : WARNING },
              ]}
              >
              {!snapshot.isWifiConnected
                ? 'Tidak terhubung ke Wi-Fi'
                : readStatus === 'ssid_unreadable' || readStatus === 'bssid_unreadable'
                ? 'Wi-Fi terhubung, data belum lengkap'
                : isAuthorized
                ? 'Wi-Fi terdaftar, bisa dipakai untuk absensi'
                : 'Wi-Fi belum terdaftar'}
            </Text>
          </View>

          {statusMessage ? <Text style={s.permWarn}>{statusMessage}</Text> : null}

          <View style={s.copyGroup}>
            <CopyRow
              label="BSSID"
              value={bssidDisplay}
              mono
              copied={copied === 'bssid'}
              onCopy={() => handleCopy('bssid', bssidDisplay)}
            />
            <View style={s.copyDivider} />
            <CopyRow
              label="IP Address"
              value={ipDisplay}
              mono
              copied={copied === 'ip'}
              onCopy={() => handleCopy('ip', ipDisplay)}
            />
            <View style={s.copyDivider} />
            <CopyRow
              label="Subnet"
              value={subnetDisplay}
              mono
              copied={copied === 'subnet'}
              onCopy={() => handleCopy('subnet', subnetDisplay)}
            />
          </View>

          <View style={s.signalRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.copyLabel}>Kekuatan Sinyal</Text>
              <Text style={s.signalText}>
                {signalLabel}
                {snapshot.strength != null ? (
                  <Text style={s.signalMono}> · {snapshot.strength}%</Text>
                ) : null}
              </Text>
            </View>
            <View style={s.barsWrap}>
              {[1, 2, 3, 4].map((b) => (
                <View
                  key={b}
                  style={[
                    s.bar,
                    {
                      height: 5 + b * 3,
                      backgroundColor:
                        b <= bars ? MAROON : BORDER_WARM,
                    },
                  ]}
                />
              ))}
              {Platform.OS === 'ios' && snapshot.strength == null ? (
                <Text style={s.barsIosHint}>n/a</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Info banner */}
        <View style={s.infoBanner}>
          <Text style={s.infoText}>
            Wi-Fi terdaftar di bawah ini divalidasi saat absensi kantor.
            Pastikan BSSID cocok dengan router di lokasi kerja Anda.
          </Text>
        </View>

        {/* Registered list */}
        <View style={s.listCard}>
          <View style={s.listHeader}>
            <View>
              <Text style={s.listTitle}>Wi-Fi Terdaftar</Text>
              <Text style={s.listSub}>
                {configQuery.isLoading
                  ? 'Memuat…'
                  : `${allowlistRows.length} ${
                      allowlistRows.length === 1 ? 'entri' : 'entri'
                    }`}
              </Text>
            </View>
            <View style={s.hrPill}>
              <Text style={s.hrPillText}>Dikelola HR</Text>
            </View>
          </View>

          {configQuery.isLoading ? (
            <View style={s.emptyWrap}>
              <ActivityIndicator color={MAROON} />
            </View>
          ) : allowlistRows.length === 0 ? (
            <View style={s.emptyWrap}>
              <Text style={s.emptyEmoji}>📭</Text>
              <Text style={s.emptyTitle}>Belum ada Wi-Fi terdaftar</Text>
              <Text style={s.emptySub}>
                Hubungi HR untuk mendaftarkan Wi-Fi kantor Anda.
              </Text>
            </View>
          ) : (
            allowlistRows.map((row, i) => {
              const rowBssid = normalizeBssid(row.bssid);
              const rowSsid = (row.ssid ?? '').toLowerCase();
              const isCurrent =
                (!!rowBssid && rowBssid === bssidNormalized) ||
                (!!rowSsid && rowSsid === ssidNormalized.toLowerCase());
              return (
                <View
                  key={row.key}
                  style={[
                    s.listRow,
                    i === 0 && s.listRowFirst,
                    isCurrent && s.listRowCurrent,
                  ]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={s.listRowTitleWrap}>
                      <Text style={s.listRowSsid} numberOfLines={1}>
                        {row.ssid ?? 'SSID tidak tersedia'}
                      </Text>
                      {isCurrent ? (
                        <View style={s.connectedBadge}>
                          <Text style={s.connectedBadgeText}>● TERHUBUNG</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={s.listRowBssid} numberOfLines={1}>
                      {row.bssid ?? '—'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Help row */}
        <Pressable
          style={({ pressed }) => [s.helpRow, pressed && { opacity: 0.7 }]}
          onPress={() => showToast('info', 'Hubungi HR untuk verifikasi BSSID baru')}
        >
          <View style={{ flex: 1 }}>
            <Text style={s.helpTitle}>Tidak bisa absen?</Text>
            <Text style={s.helpSub}>Hubungi HR untuk verifikasi BSSID baru</Text>
          </View>
          <Text style={s.helpChevron}>›</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: WARM_SURFACE },
  // Header
  header: {
    paddingBottom: 16,
  },
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: SURFACE,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER_WARM,
  },
  backBtnText: { color: TEXT_SUB, fontSize: 12, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: INK, letterSpacing: 0.1 },
  headerSub: { fontSize: 13, color: TEXT_SUB, marginTop: 4, lineHeight: 19 },
  scroll: { flex: 1 },
  // Connected card
  connectedCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER_WARM,
  },
  connectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  connectedHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  connectedIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: MAROON_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedKicker: {
    fontSize: 10,
    color: TEXT_SUB,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  connectedSub: { fontSize: 10, color: TEXT_MUTED, marginTop: 1 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: WARM_SURFACE,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BORDER_WARM,
  },
  refreshBtnText: { fontSize: 11, color: MAROON, fontWeight: '600' },
  ssidBig: {
    fontSize: 24,
    fontWeight: '800',
    color: INK,
    lineHeight: 30,
    marginBottom: 10,
  },
  authPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  authPillOk: {
    backgroundColor: SUCCESS_BG,
    borderColor: 'rgba(4,120,87,0.12)',
  },
  authPillWarn: {
    backgroundColor: WARNING_BG,
    borderColor: 'rgba(180,83,9,0.12)',
  },
  authDot: { width: 6, height: 6, borderRadius: 3 },
  authText: { fontSize: 10.5, fontWeight: '700' },
  permWarn: {
    fontSize: 11,
    color: WARNING,
    backgroundColor: WARNING_BG,
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  copyGroup: {
    backgroundColor: WARM_SURFACE,
    borderRadius: 12,
    paddingVertical: 4,
  },
  copyDivider: { height: 1, backgroundColor: BORDER_WARM },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  copyLabel: {
    fontSize: 9.5,
    color: TEXT_SUB,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  copyValue: { fontSize: 13, color: INK, fontWeight: '700', marginTop: 1 },
  monoText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
    }),
    letterSpacing: 0.4,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: SURFACE,
    borderColor: BORDER_WARM,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  copyBtnDone: {
    backgroundColor: SUCCESS_BG,
    borderColor: 'rgba(4,120,87,0.12)',
  },
  copyBtnText: { fontSize: 10, color: MAROON, fontWeight: '700' },
  copyBtnTextDone: { color: SUCCESS },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    padding: 10,
    backgroundColor: WARM_SURFACE,
    borderRadius: 12,
  },
  signalText: { fontSize: 12, color: INK, fontWeight: '700', marginTop: 1 },
  signalMono: {
    color: TEXT_SUB,
    fontWeight: '500',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  barsWrap: { flexDirection: 'row', gap: 2, alignItems: 'flex-end' },
  bar: { width: 4, borderRadius: 1 },
  barsIosHint: {
    fontSize: 9,
    color: TEXT_MUTED,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  // Info banner
  infoBanner: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: SAND,
    borderWidth: 1,
    borderColor: BORDER_WARM,
    marginBottom: 14,
  },
  infoText: { fontSize: 11.5, color: TEXT_SUB, lineHeight: 17 },
  // List
  listCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 6,
    borderWidth: 1,
    borderColor: BORDER_WARM,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  listTitle: { fontSize: 13, fontWeight: '800', color: INK },
  listSub: { fontSize: 10.5, color: TEXT_MUTED, marginTop: 1 },
  hrPill: {
    backgroundColor: WARM_SURFACE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hrPillText: { fontSize: 10, color: TEXT_SUB, fontWeight: '700' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER_WARM,
  },
  listRowFirst: { borderTopColor: BORDER_WARM },
  listRowCurrent: { backgroundColor: MAROON_TINT },
  listRowTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  listRowSsid: { fontSize: 13, fontWeight: '700', color: INK },
  listRowBssid: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    marginTop: 2,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  connectedBadge: {
    backgroundColor: SUCCESS_BG,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  connectedBadgeText: { fontSize: 9, fontWeight: '800', color: SUCCESS },
  emptyWrap: { paddingHorizontal: 16, paddingVertical: 20, alignItems: 'center' },
  emptyEmoji: { fontSize: 28, marginBottom: 6 },
  emptyTitle: { fontSize: 13, fontWeight: '700', color: INK },
  emptySub: {
    fontSize: 11,
    color: TEXT_SUB,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
  // Help
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER_WARM,
  },
  helpTitle: { fontSize: 12.5, fontWeight: '700', color: INK },
  helpSub: { fontSize: 10.5, color: TEXT_SUB, marginTop: 1 },
  helpChevron: { fontSize: 22, color: TEXT_MUTED, marginRight: 4 },
});
