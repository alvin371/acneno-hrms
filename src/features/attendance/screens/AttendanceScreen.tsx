import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import {
  openSettings,
  RESULTS,
} from 'react-native-permissions';
import { launchCamera, type Asset } from 'react-native-image-picker';
import { uploadFile } from '@/api/upload';
import { Screen } from '@/ui/Screen';
import { env } from '@/config/env';
import { tokens } from '@/config/tokens';
import { haversineDistanceMeters } from '@/utils/distance';
import { getErrorMessage } from '@/api/error';
import { showToast } from '@/utils/toast';
import { getConfig } from '@/features/config/api';
import {
  getConfigRadiusMeters,
  getConfigWifiAllowlist,
  getResolvedConfigOffices,
  type ResolvedConfigOffice,
} from '@/features/config/selectors';
import {
  checkIn,
  checkOut,
  getAttendanceHistory,
  outOfTownCheckIn,
  outOfTownCheckOut,
  requestOfficeProof,
  submitAttendanceReason,
  type AttendancePayload,
} from '@/features/attendance/api';
import {
  getCheckInActionState,
  getCheckOutActionState,
} from '@/features/attendance/screens/attendanceActionState';
import type { AttendanceRecord } from '@/api/types';
import { isSameDay, parseServerDateTime } from '@/features/attendance/utils';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AttendanceStackParamList } from '@/navigation/types';
import type { WifiErrorCode } from '@/hooks/useWifiValidation';
import { useAuthStore } from '@/store/authStore';
import { formatScheduleRange } from '@/utils/schedule';
import {
  getFriendlyAttendanceErrorMessage,
  getFriendlyUploadErrorMessage,
} from '@/utils/uploadError';
import {
  hasSeenAttendanceReminderPrompt,
  markAttendanceReminderPromptSeen,
  syncStoredAttendanceReminders,
} from '@/features/notifications/bootstrap';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from '@/features/notifications/utils';
import {
  isPlaceholderBssid,
  isUnknownSsid,
  normalizeBssid,
  normalizeSsid,
  readCurrentWifiSnapshot,
  requestLocationPermission,
  requestWifiPermission,
} from '@/utils/wifi';

const MAROON = tokens.colors.maroon;
const INK = tokens.colors.ink;
const TEXT_SUB = tokens.colors.textSub;
const TEXT_MUTED = tokens.colors.textMuted;
const WARM_SURFACE = tokens.colors.warmSurface;
const BORDER_WARM = tokens.colors.borderWarm;
const SURFACE = '#FFFFFF';
const SUCCESS = '#047857';
const SUCCESS_BG = '#D1FAE5';
const WARNING = '#B45309';
const WARNING_BG = '#FEF3C7';
const DANGER = '#BE123C';
const AMBER = '#D97706';

// ─── Late Reason constants ────────────────────────────────────────────────────
const LATE_WINDOW_OPEN_HOUR = 9;
const EARLY_WINDOW_CLOSE_HOUR = 16;
const MIN_REASON_CHARS = 30;
const REASON_COOLDOWN_MS = 5 * 60 * 1000;

// ─── Permission helpers (unchanged) ──────────────────────────────────────────
const SETTINGS_ERROR_CODES: WifiErrorCode[] = [
  'permission_location',
  'permission_wifi',
  'ssid_unreadable',
  'bssid_unreadable',
];

const WIFI_ERROR_HINTS: Record<WifiErrorCode, string> = {
  permission_location: 'Enable location access in your device settings to verify Wi-Fi.',
  permission_wifi: 'Enable Wi-Fi access in your device settings.',
  not_connected: 'Connect to your office Wi-Fi network and try again.',
  outside_radius: 'Move closer to the office location and try again.',
  ssid_unreadable: 'Turn on Wi-Fi and location services, then try again.',
  bssid_unreadable: 'Turn on Wi-Fi and location services, then try again.',
  ssid_mismatch: 'Connect to your office Wi-Fi network and try again.',
  bssid_mismatch: "Make sure you're connected to the correct office Wi-Fi.",
  not_configured: 'Contact your administrator to configure office Wi-Fi.',
  proof_failed: 'Try again or contact your administrator.',
  api_error: 'Check your internet connection and try again.',
  timeout: 'Check your connection and try again.',
};

type DeviceLocation = {
  coords: { latitude: number; longitude: number; accuracy?: number | null };
};

type PickerAsset = Pick<Asset, 'uri' | 'fileName' | 'type'>;

const getCurrentLocation = (): Promise<DeviceLocation> =>
  new Promise((resolve, reject) => {
    if (!Geolocation || typeof Geolocation.getCurrentPosition !== 'function') {
      reject(new Error('Geolocation service not available. Please rebuild the app.'));
      return;
    }
    Geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        let message = 'Failed to get location';
        switch (error.code) {
          case 1: message = 'Location permission denied. Please enable location access in settings.'; break;
          case 2: message = 'Location unavailable. Please ensure GPS is enabled and try again.'; break;
          case 3: message = 'Location request timed out. Please try again.'; break;
          case 4: message = 'Google Play Services not available. Please update Google Play Services.'; break;
          case 5: message = 'Location settings not satisfied. Please enable high accuracy location mode.'; break;
          default: message = error.message || 'Failed to get location';
        }
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  });

const coerceStringList = (value: unknown) => {
  if (Array.isArray(value)) return value.filter((i) => typeof i === 'string') as string[];
  if (typeof value === 'string') return value.split(',').map((i) => i.trim()).filter(Boolean);
  return [];
};

const hasCoordinates = (
  office: ResolvedConfigOffice
): office is ResolvedConfigOffice & { lat: number; lng: number } =>
  office.lat != null && office.lng != null;

// ─── Sub-components ───────────────────────────────────────────────────────────

type AttendanceMode = 'office' | 'trip';

function ModeToggle({
  mode,
  onChange,
}: {
  mode: AttendanceMode;
  onChange: (m: AttendanceMode) => void;
}) {
  return (
    <View
      className="mx-4 mt-4 flex-row rounded-2xl p-1"
      style={{ backgroundColor: '#F2F0ED' }}
    >
      {(['office', 'trip'] as AttendanceMode[]).map((id) => {
        const active = mode === id;
        const label = id === 'office' ? 'Kantor' : 'Dinas luar';
        return (
          <TouchableOpacity
            key={id}
            onPress={() => onChange(id)}
            className="flex-1 items-center rounded-xl py-2.5"
            style={active ? { backgroundColor: SURFACE } : undefined}
          >
            <Text
              className="text-[13px] font-semibold"
              style={{ color: active ? MAROON : TEXT_SUB }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TimeInfoCard({
  checkInTime,
  checkOutTime,
  scheduleLabel,
}: {
  checkInTime: string | null;
  checkOutTime: string | null;
  scheduleLabel: string;
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <View
      className="mx-4 mt-3 rounded-2xl p-4"
      style={{ backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER_WARM }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xs font-semibold" style={{ color: TEXT_SUB }}>
            Jadwal kerja
          </Text>
          <Text className="mt-1 text-sm font-semibold" style={{ color: INK }}>
            {scheduleLabel}
          </Text>
        </View>
        <Text className="text-base font-bold tabular-nums" style={{ color: INK }}>
          {now.toLocaleTimeString()}
        </Text>
      </View>
      <View className="mt-4 flex-row gap-3">
        <View
          className="flex-1 rounded-xl px-3 py-3"
          style={{ backgroundColor: WARM_SURFACE }}
        >
          <Text className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SUB }}>
            Masuk
          </Text>
          <Text
            className="mt-1 text-base font-semibold"
            style={{ color: checkInTime ? INK : TEXT_MUTED }}
          >
            {checkInTime ?? '—'}
          </Text>
        </View>
        <View
          className="flex-1 rounded-xl px-3 py-3"
          style={{ backgroundColor: WARM_SURFACE }}
        >
          <Text className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SUB }}>
            Pulang
          </Text>
          <Text
            className="mt-1 text-base font-semibold"
            style={{ color: checkOutTime ? INK : TEXT_MUTED }}
          >
            {checkOutTime ?? '—'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function OfficeValidationCard({
  wifiProofOk,
  wifiErrorCode,
  netInfoType,
  freshWifiSsid,
  wifiSsid,
  distanceMeters,
  locationError,
  isWithinRadius,
  isRefreshing,
  onRefresh,
}: {
  wifiProofOk: boolean | null;
  wifiErrorCode: WifiErrorCode | null;
  netInfoType: string;
  freshWifiSsid: string | null;
  wifiSsid: string | null;
  distanceMeters: number | null;
  locationError: string | null;
  isWithinRadius: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const wifiReady = wifiProofOk === true;
  const radiusLabel = locationError
    ? 'Lokasi belum tersedia'
    : distanceMeters === null
    ? 'Mengecek lokasi'
    : isWithinRadius
    ? `Dalam radius ${Math.round(distanceMeters)} m`
    : `Di luar radius ${Math.round(distanceMeters)} m`;
  const wifiLabel =
    netInfoType === 'wifi'
      ? freshWifiSsid ?? wifiSsid ?? 'Wi-Fi tidak terbaca'
      : 'Belum terhubung';

  return (
    <View
      className="mx-4 mt-3 rounded-2xl p-4"
      style={{
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER_WARM,
      }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[13px] font-bold" style={{ color: INK }}>
            Siap absensi kantor
          </Text>
          <Text className="mt-1 text-xs" style={{ color: TEXT_SUB }}>
            Pastikan Wi-Fi kantor dan GPS sudah cocok sebelum tap tombol utama.
          </Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          className="rounded-lg px-3 py-2"
          style={{ backgroundColor: WARM_SURFACE }}
        >
          <Text className="text-[11px] font-semibold" style={{ color: TEXT_SUB }}>
            {isRefreshing ? 'Memuat...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>
      <View className="mt-4 gap-3">
        <View
          className="flex-row items-center justify-between rounded-xl px-3 py-3"
          style={{ backgroundColor: WARM_SURFACE }}
        >
          <View className="flex-1 pr-3">
            <Text className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SUB }}>
              Wi-Fi
            </Text>
            <Text className="mt-1 text-sm font-semibold" style={{ color: INK }}>
              {wifiLabel}
            </Text>
          </View>
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: wifiReady ? SUCCESS_BG : WARNING_BG }}
          >
            <Text
              className="text-[11px] font-semibold"
              style={{ color: wifiReady ? SUCCESS : WARNING }}
            >
              {wifiReady ? 'Siap' : 'Perlu cek'}
            </Text>
          </View>
        </View>
        <View
          className="flex-row items-center justify-between rounded-xl px-3 py-3"
          style={{ backgroundColor: WARM_SURFACE }}
        >
          <View className="flex-1 pr-3">
            <Text className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SUB }}>
              Lokasi
            </Text>
            <Text className="mt-1 text-sm font-semibold" style={{ color: INK }}>
              {radiusLabel}
            </Text>
          </View>
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: isWithinRadius ? SUCCESS_BG : WARNING_BG }}
          >
            <Text
              className="text-[11px] font-semibold"
              style={{ color: isWithinRadius ? SUCCESS : WARNING }}
            >
              {isWithinRadius ? 'Cocok' : 'Perlu cek'}
            </Text>
          </View>
        </View>
      </View>
      {(wifiProofOk === false || !isWithinRadius || locationError) && (
        <Text className="mt-3 text-[11px] leading-5" style={{ color: DANGER }}>
          {wifiProofOk === false && wifiErrorCode && WIFI_ERROR_HINTS[wifiErrorCode]
            ? WIFI_ERROR_HINTS[wifiErrorCode]
            : 'Aktifkan Wi-Fi kantor dan pastikan lokasi GPS aktif untuk melanjutkan.'}
        </Text>
      )}
      {wifiProofOk === false && wifiErrorCode && SETTINGS_ERROR_CODES.includes(wifiErrorCode) && (
        <TouchableOpacity
          onPress={() => openSettings()}
          className="mt-3 items-center rounded-xl py-3"
          style={{ backgroundColor: WARM_SURFACE }}
        >
          <Text className="text-xs font-semibold" style={{ color: MAROON }}>
            Buka Pengaturan
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function TripValidationCard({
  photoTaken,
  photoUri,
  tripLocation,
  onSetTripLocation,
  onOpenCamera,
}: {
  photoTaken: boolean;
  photoUri: string | null;
  tripLocation: string;
  onSetTripLocation: (v: string) => void;
  onOpenCamera: () => void;
}) {
  return (
    <View
      className="mx-4 mt-3 rounded-2xl p-4"
      style={{
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER_WARM,
      }}
    >
      <View>
        <Text className="text-[13px] font-bold" style={{ color: INK }}>
          Siap absensi dinas luar
        </Text>
        <Text className="mt-1 text-xs" style={{ color: TEXT_SUB }}>
          Lengkapi foto selfie dan lokasi penugasan.
        </Text>
      </View>
      <View
        className="mt-4 rounded-xl p-3"
        style={{
          backgroundColor: WARM_SURFACE,
        }}
      >
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SUB }}>
              Foto selfie
            </Text>
            <Text className="mt-1 text-sm font-semibold" style={{ color: INK }}>
              {photoTaken ? 'Foto sudah siap' : 'Belum ada foto'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onOpenCamera}
            className="rounded-lg px-3 py-2"
            style={{ backgroundColor: photoTaken ? SURFACE : MAROON }}
          >
            <Text
              className="text-[11px] font-semibold"
              style={{ color: photoTaken ? MAROON : SURFACE }}
            >
              {photoTaken ? 'Ulangi' : 'Ambil'}
            </Text>
          </TouchableOpacity>
        </View>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            className="mt-3 h-40 rounded-xl"
            resizeMode="cover"
          />
        ) : null}
      </View>
      <View
        className="mt-3 rounded-xl p-3"
        style={{
          backgroundColor: WARM_SURFACE,
        }}
      >
        <Text className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SUB }}>
          Lokasi dinas
        </Text>
        <TextInput
          value={tripLocation}
          onChangeText={onSetTripLocation}
          placeholder="Contoh: Kantor Klien, Jakarta Selatan"
          placeholderTextColor={TEXT_MUTED}
          className="mt-2 text-sm"
          style={{
            color: INK,
            borderBottomWidth: 1,
            borderBottomColor: BORDER_WARM,
            paddingBottom: 10,
          }}
        />
      </View>
      <Text className="mt-3 text-[11px] leading-5" style={{ color: TEXT_SUB }}>
        Data kehadiran dinas luar akan diverifikasi oleh HR. Pastikan foto wajah jelas dan lokasi sesuai penugasan.
      </Text>
    </View>
  );
}

// ─── Late Reason Modal ────────────────────────────────────────────────────────

type ReasonType = 'late' | 'early';

function LateReasonModal({
  type,
  existing,
  logId,
  onSubmit,
  onClose,
}: Readonly<{
  type: ReasonType;
  existing: string | null;
  logId: number | null;
  onSubmit: (text: string) => void;
  onClose: () => void;
}>) {
  const [text, setText] = useState(existing ?? '');
  const isLate = type === 'late';
  const color = isLate ? AMBER : MAROON;
  const title = isLate ? 'Alasan Terlambat' : 'Alasan Pulang Awal';
  const hint = isLate
    ? 'Jelaskan alasan keterlambatan Anda hari ini.'
    : 'Jelaskan alasan meninggalkan kantor lebih awal.';
  const isEdit = existing != null;
  const trimmed = text.trim();
  const canSubmit = trimmed.length >= MIN_REASON_CHARS;
  const remaining = Math.max(0, MIN_REASON_CHARS - trimmed.length);
  const progress = Math.min(1, trimmed.length / MIN_REASON_CHARS);

  const mutation = useMutation({
    mutationFn: () => {
      if (logId == null) return Promise.reject(new Error('Attendance record ID not available.'));
      return submitAttendanceReason(logId, { reason: trimmed });
    },
    onSuccess: () => {
      onSubmit(trimmed);
    },
    onError: (error) => {
      showToast('error', getErrorMessage(error));
    },
  });

  const bannerBg = isLate ? 'rgba(217,119,6,0.07)' : 'rgba(139,31,47,0.06)';
  const bannerBorder = isLate ? 'rgba(217,119,6,0.2)' : 'rgba(139,31,47,0.15)';
  const iconBg = isLate ? 'rgba(217,119,6,0.12)' : 'rgba(139,31,47,0.1)';

  return (
    <Modal
      transparent
      animationType="slide"
      visible
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-end"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="bg-white rounded-t-3xl"
          style={{ paddingBottom: 34, maxHeight: '85%' }}
        >
          {/* Handle bar */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-slate-200" />
          </View>

          {/* Header */}
          <View
            className="flex-row items-center justify-between px-5 py-3"
            style={{ borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}
          >
            <View className="flex-row items-center gap-2.5">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: iconBg }}
              >
                <Text style={{ fontSize: 18, color }}>{isLate ? '⏰' : '🚪'}</Text>
              </View>
              <View>
                <Text className="text-base font-black text-ink-700">{title}</Text>
                <Text className="text-[11px] text-ink-400 mt-0.5">
                  {isEdit ? 'Edit keterangan sebelumnya' : 'Isi keterangan dengan jelas'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <Text className="text-sm text-ink-500">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Info banner */}
          <View
            className="mx-5 mt-3.5 p-3 rounded-xl flex-row gap-2"
            style={{
              backgroundColor: bannerBg,
              borderWidth: 1,
              borderColor: bannerBorder,
            }}
          >
            <Text style={{ color, fontSize: 14 }}>ℹ</Text>
            <Text className="text-[11.5px] text-ink-500 leading-5 flex-1">
              {hint} Keterangan akan dikirim ke HR untuk diverifikasi.
              {isEdit && (
                <Text style={{ color, fontWeight: '700' }}>
                  {' '}Anda sedang mengedit keterangan sebelumnya.
                </Text>
              )}
            </Text>
          </View>

          {/* Textarea */}
          <View className="px-5 pt-3.5">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs font-semibold text-ink-700">Keterangan</Text>
              <Text
                className="text-[11px] font-semibold"
                style={{
                  color: canSubmit ? '#16A34A' : trimmed.length > 0 ? AMBER : '#bbb',
                }}
              >
                {canSubmit
                  ? `✓ Cukup (${trimmed.length} karakter)`
                  : `min. ${remaining} karakter lagi`}
              </Text>
            </View>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              placeholder={
                isLate
                  ? 'Contoh: Saya terlambat karena terjebak kemacetan di jalan Sudirman...'
                  : 'Contoh: Saya perlu meninggalkan kantor lebih awal karena keperluan keluarga...'
              }
              placeholderTextColor="#aaa"
              style={{
                minHeight: 120,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: canSubmit ? 'rgba(22,163,74,0.4)' : '#e8e8e8',
                backgroundColor: canSubmit ? 'rgba(22,163,74,0.03)' : '#fafafa',
                fontSize: 13,
                lineHeight: 20,
                color: '#1a1a1a',
                textAlignVertical: 'top',
              }}
            />
          </View>

          {/* Progress bar */}
          <View className="px-5 pt-2">
            <View className="h-[3px] bg-slate-100 rounded-full overflow-hidden">
              <View
                style={{
                  height: '100%',
                  width: `${Math.round(progress * 100)}%`,
                  backgroundColor: canSubmit ? '#16A34A' : trimmed.length > 0 ? AMBER : '#e0e0e0',
                  borderRadius: 2,
                }}
              />
            </View>
          </View>

          {/* Submit */}
          <View className="px-5 pt-4">
            <TouchableOpacity
              onPress={() => mutation.mutate()}
              disabled={!canSubmit || mutation.isPending}
              className="w-full py-4 rounded-xl items-center justify-center flex-row gap-2"
              style={{
                backgroundColor: canSubmit ? color : '#e8e8e8',
                opacity: mutation.isPending ? 0.7 : 1,
              }}
            >
              <Text
                className="text-sm font-bold"
                style={{ color: canSubmit ? '#fff' : '#bbb' }}
              >
                {mutation.isPending
                  ? '⟳ Mengirim...'
                  : isEdit
                  ? '✎ Perbarui Keterangan'
                  : '➤ Kirim Keterangan'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-center text-[10.5px] text-slate-300 mt-3 px-5 leading-5">
            Pengisian ulang tersedia setelah cooldown 5 menit · Min. {MIN_REASON_CHARS} karakter
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const formatCountdown = (ms: number) => {
  const seconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0
    ? `${minutes}m ${String(remainingSeconds).padStart(2, '0')}s`
    : `${remainingSeconds}s`;
};

function ReasonButton({
  type,
  lateAvail,
  earlyAvail,
  lateSubmittedAt,
  earlySubmittedAt,
  lateReason,
  earlyReason,
  onOpenModal,
}: Readonly<{
  type: ReasonType;
  lateAvail: boolean;
  earlyAvail: boolean;
  lateSubmittedAt: number | null;
  earlySubmittedAt: number | null;
  lateReason: string | null;
  earlyReason: string | null;
  onOpenModal: (type: ReasonType) => void;
}>) {
  const isLate = type === 'late';
  const avail = isLate ? lateAvail : earlyAvail;
  const submittedAt = isLate ? lateSubmittedAt : earlySubmittedAt;
  const reason = isLate ? lateReason : earlyReason;
  const color = isLate ? AMBER : MAROON;
  const label = isLate ? 'Alasan Terlambat' : 'Alasan Pulang Awal';
  const window = isLate ? '09:00 – 16:00' : '08:00 – 16:00';
  const emoji = isLate ? '⏰' : '🚪';

  const coolRemain = submittedAt
    ? Math.max(0, REASON_COOLDOWN_MS - (Date.now() - submittedAt))
    : 0;

  let state: 'locked_time' | 'idle' | 'cooling' | 'done';
  if (!avail) state = 'locked_time';
  else if (coolRemain > 0) state = 'cooling';
  else if (reason) state = 'done';
  else state = 'idle';

  const clickable = state === 'idle' || state === 'done';
  const btnBg =
    state === 'idle'
      ? color
      : state === 'done'
      ? `rgba(${isLate ? '217,119,6' : '139,31,47'},0.12)`
      : '#f0f0f0';
  const btnTextColor = state === 'idle' ? '#fff' : state === 'done' ? color : '#bbb';
  const btnLabel =
    state === 'locked_time'
      ? `🔒 Tersedia ${window}`
      : state === 'cooling'
      ? `⟳ ${formatCountdown(coolRemain)}`
      : state === 'done'
      ? '✎ Edit Keterangan'
      : 'Isi Keterangan';
  const rowBg =
    state === 'done'
      ? isLate
        ? 'rgba(217,119,6,0.05)'
        : 'rgba(139,31,47,0.04)'
      : '#fff';
  const rowBorder =
    state === 'done'
      ? isLate
        ? 'rgba(217,119,6,0.25)'
        : 'rgba(139,31,47,0.2)'
      : state === 'idle'
      ? `rgba(${isLate ? '217,119,6' : '139,31,47'},0.2)`
      : '#ebebeb';

  return (
    <View
      className="p-3 rounded-xl"
      style={{
        backgroundColor: rowBg,
        borderWidth: 1.5,
        borderColor: rowBorder,
      }}
    >
      <View className="flex-row items-center gap-2.5">
        <View
          className="w-[34px] h-[34px] rounded-[10px] items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: state === 'idle'
              ? color
              : `rgba(${isLate ? '217,119,6' : '139,31,47'},0.15)`,
          }}
        >
          <Text style={{ fontSize: 16, color: state === 'idle' ? '#fff' : color }}>
            {emoji}
          </Text>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-xs font-bold text-ink-700">{label}</Text>
            {state === 'done' && (
              <View
                className="px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: `rgba(${isLate ? '217,119,6' : '139,31,47'},0.15)` }}
              >
                <Text className="text-[9px] font-bold" style={{ color }}>TERISI</Text>
              </View>
            )}
            {state === 'cooling' && (
              <View className="px-1.5 py-0.5 rounded-md bg-slate-100">
                <Text className="text-[9px] font-bold text-slate-500">COOLDOWN</Text>
              </View>
            )}
          </View>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            {state === 'cooling'
              ? `Tersedia lagi dalam ${formatCountdown(coolRemain)}`
              : state === 'done'
              ? 'Keterangan telah dikirim ke HR'
              : `Window: ${window}`}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => clickable && onOpenModal(type)}
          disabled={!clickable}
          className="px-3 py-1.5 rounded-[9px] flex-shrink-0"
          style={{ backgroundColor: btnBg }}
        >
          <Text className="text-[11px] font-bold" style={{ color: btnTextColor }}>
            {btnLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {reason && (
        <View
          className="mt-2 px-2.5 py-2 rounded-lg"
          style={{
            backgroundColor: `rgba(${isLate ? '217,119,6' : '139,31,47'},0.06)`,
            borderWidth: 1,
            borderColor: `rgba(${isLate ? '217,119,6' : '139,31,47'},0.12)`,
          }}
        >
          <Text className="text-[11px] text-ink-500 leading-5">"{reason}"</Text>
        </View>
      )}
    </View>
  );
}

// ─── Late Reason Card ─────────────────────────────────────────────────────────

function LateReasonCard({
  now,
  scheduleLabel,
  lateReason,
  earlyReason,
  lateSubmittedAt,
  earlySubmittedAt,
  onOpenModal,
}: Readonly<{
  now: Date;
  scheduleLabel: string;
  lateReason: string | null;
  earlyReason: string | null;
  lateSubmittedAt: number | null;
  earlySubmittedAt: number | null;
  onOpenModal: (type: ReasonType) => void;
}>) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const lateAvail = nowMin >= LATE_WINDOW_OPEN_HOUR * 60 && nowMin < EARLY_WINDOW_CLOSE_HOUR * 60;
  const earlyAvail = nowMin >= 8 * 60 && nowMin < EARLY_WINDOW_CLOSE_HOUR * 60;

  if (!lateAvail && !earlyAvail) return null;

  return (
    <View className="mx-4 mt-3 rounded-2xl bg-white shadow-sm overflow-hidden">
      <View
        className="flex-row items-center gap-2 px-4 py-3"
        style={{ borderBottomWidth: 1, borderBottomColor: '#f5f5f5' }}
      >
        <View className="w-7 h-7 rounded-lg bg-slate-100 items-center justify-center">
          <Text style={{ fontSize: 14 }}>⚠️</Text>
        </View>
        <View>
          <Text className="text-[13px] font-bold text-ink-700">Keterangan Kehadiran</Text>
          <Text className="text-[10px] text-slate-400">
            Tersedia berdasarkan jadwal kerja {scheduleLabel}
          </Text>
        </View>
      </View>

      <View className="p-3 gap-2">
        <ReasonButton
          type="late"
          lateAvail={lateAvail}
          earlyAvail={earlyAvail}
          lateSubmittedAt={lateSubmittedAt}
          earlySubmittedAt={earlySubmittedAt}
          lateReason={lateReason}
          earlyReason={earlyReason}
          onOpenModal={onOpenModal}
        />
        <ReasonButton
          type="early"
          lateAvail={lateAvail}
          earlyAvail={earlyAvail}
          lateSubmittedAt={lateSubmittedAt}
          earlySubmittedAt={earlySubmittedAt}
          lateReason={lateReason}
          earlyReason={earlyReason}
          onOpenModal={onOpenModal}
        />
      </View>
    </View>
  );
}

// ─── Success Overlay ──────────────────────────────────────────────────────────

function SuccessOverlay({
  type,
  mode,
  onClose,
}: {
  type: 'in' | 'out';
  mode: AttendanceMode;
  onClose: () => void;
}) {
  const color = MAROON;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <TouchableOpacity
        className="flex-1 bg-black/50 items-center justify-center px-6"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="bg-white rounded-3xl p-8 w-full items-center"
          style={{ maxWidth: 320 }}
        >
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: color }}
          >
            <Text className="text-white text-2xl">✓</Text>
          </View>
          <Text className="text-lg font-bold text-ink-700 mb-1 text-center">
            {type === 'in' ? 'Absen Masuk Berhasil!' : 'Absen Pulang Berhasil!'}
          </Text>
          <Text className="text-xs text-ink-500 mb-3">
            {mode === 'trip' ? '✈️ Mode Dinas Luar' : '🏢 Mode Kantor'}
          </Text>
          <View className="bg-slate-50 rounded-xl px-4 py-3 w-full mb-6">
            <Text className="text-xs text-center text-ink-500 leading-5">
              {type === 'in' ? 'Waktu masuk telah tercatat' : 'Waktu pulang telah tercatat'}
              {'\n'}Data dikirim ke sistem HR
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="w-full py-3 rounded-xl items-center"
            style={{ backgroundColor: color }}
          >
            <Text className="text-white font-bold text-sm">OK</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<AttendanceStackParamList, 'AttendanceMain'>;

export const AttendanceScreen = ({ navigation }: Props) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const schedule = user?.schedule;
  const [now, setNow] = useState(new Date());

  // Mode
  const [mode, setMode] = useState<AttendanceMode>('office');

  // Office validation state
  const [location, setLocation] = useState<DeviceLocation | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [nearestRadiusMeters, setNearestRadiusMeters] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [wifiProofOk, setWifiProofOk] = useState<boolean | null>(null);
  const [, setWifiProofError] = useState<string | null>(null);
  const [wifiErrorCode, setWifiErrorCode] = useState<WifiErrorCode | null>(null);
  const [freshWifiSsid, setFreshWifiSsid] = useState<string | null>(null);
  const [freshWifiBssid, setFreshWifiBssid] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setIsValidating] = useState(false);

  // Business trip state
  const [photoTaken, setPhotoTaken] = useState(false);
  const [tripPhoto, setTripPhoto] = useState<PickerAsset | null>(null);
  const [tripLocation, setTripLocation] = useState('');

  // Today check-in/out times (for display)
  const [checkInDisplayTime, setCheckInDisplayTime] = useState<string | null>(null);
  const [checkOutDisplayTime, setCheckOutDisplayTime] = useState<string | null>(null);

  // Success overlay
  const [successType, setSuccessType] = useState<'in' | 'out' | null>(null);

  // Late / early reason
  const [lateReason, setLateReason] = useState<string | null>(null);
  const [earlyReason, setEarlyReason] = useState<string | null>(null);
  const [lateSubmittedAt, setLateSubmittedAt] = useState<number | null>(null);
  const [earlySubmittedAt, setEarlySubmittedAt] = useState<number | null>(null);
  const [reasonModalType, setReasonModalType] = useState<ReasonType | null>(null);

  const configQuery = useQuery({ queryKey: ['config'], queryFn: getConfig });
  const refetchConfig = configQuery.refetch;

  const attendanceHistoryQuery = useQuery({
    queryKey: ['attendance-history'],
    queryFn: getAttendanceHistory,
  });

  const netInfo = useNetInfo();
  const wifiDetails =
    netInfo.type === 'wifi' ? (netInfo.details as { ssid?: string; bssid?: string }) : null;
  const rawWifiSsid = wifiDetails?.ssid ?? null;
  const rawWifiBssid = wifiDetails?.bssid ?? null;
  const wifiSsid = isUnknownSsid(rawWifiSsid) ? null : rawWifiSsid;
  const wifiBssid = isPlaceholderBssid(rawWifiBssid) ? null : rawWifiBssid;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (attendanceHistoryQuery.error) {
      showToast('error', getErrorMessage(attendanceHistoryQuery.error));
    }
  }, [attendanceHistoryQuery.error]);

  useEffect(() => {
    let cancelled = false;

    const maybePromptAttendanceReminder = async () => {
      if (!schedule) return;

      const seen = await hasSeenAttendanceReminderPrompt();
      if (seen || cancelled) return;

      const permissionGranted = await getNotificationPermissionStatus();
      if (cancelled) return;

      if (permissionGranted) {
        await markAttendanceReminderPromptSeen();
        await syncStoredAttendanceReminders(schedule);
        return;
      }

      const granted = await requestNotificationPermission();
      if (cancelled) return;

      await markAttendanceReminderPromptSeen();
      if (granted) {
        await syncStoredAttendanceReminders(schedule);
      }
    };

    maybePromptAttendanceReminder().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [schedule?.end_time, schedule?.source, schedule?.special_schedule, schedule?.start_time]);

  const scheduleLabel = useMemo(
    () => formatScheduleRange(schedule),
    [schedule]
  );

  const isWithinRadius = useMemo(() => {
    if (distanceMeters === null) return false;
    const configuredRadius =
      nearestRadiusMeters ?? getConfigRadiusMeters(configQuery.data) ?? env.OFFICE_RADIUS_M;
    if (!configuredRadius) return false;
    return distanceMeters <= configuredRadius;
  }, [distanceMeters, nearestRadiusMeters, configQuery.data]);

  const canCheck =
    mode === 'office'
      ? wifiProofOk === true
      : photoTaken && tripLocation.trim().length > 0;

  const refreshStatus = useCallback(async () => {
    setIsRefreshing(true);
    setIsValidating(true);
    setLocationError(null);
    setWifiProofError(null);
    setWifiErrorCode(null);
    try {
      const { data: freshConfig } = await refetchConfig();
      const validationTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Validation timeout')), 10000)
      );
      await Promise.race([
        (async () => {
          const status = await requestLocationPermission();
          const wifiStatus = await requestWifiPermission();
          if (wifiStatus !== RESULTS.GRANTED) {
            setWifiProofOk(false);
            setWifiErrorCode('permission_wifi');
            setWifiProofError('Wi-Fi permission is blocked.');
          }
          let current: DeviceLocation | null = null;
          if (status === RESULTS.GRANTED) {
            try {
              current = await getCurrentLocation();
              setLocation(current);
              setLocationError(null);
            } catch (error) {
              setLocation(null);
              setDistanceMeters(null);
              setNearestRadiusMeters(null);
              setLocationError(getErrorMessage(error));
            }
          } else {
            setLocation(null);
            setDistanceMeters(null);
            setNearestRadiusMeters(null);
            setLocationError('Location permission not granted.');
          }
          if (current) {
            const fallbackRadius =
              getConfigRadiusMeters(freshConfig) ?? env.OFFICE_RADIUS_M ?? null;
            const officeCoordinates = getResolvedConfigOffices(freshConfig)
              .filter(hasCoordinates)
              .map((o) => ({ lat: o.lat, lng: o.lng, radius: o.radiusM ?? fallbackRadius }));
            const fallbackCoordinates =
              env.OFFICE_LAT != null && env.OFFICE_LNG != null
                ? [{ lat: env.OFFICE_LAT, lng: env.OFFICE_LNG, radius: fallbackRadius }]
                : [];
            const targets = officeCoordinates.length > 0 ? officeCoordinates : fallbackCoordinates;
            if (targets.length > 0) {
              try {
                const nearest = targets.reduce(
                  (closest, o) => {
                    const d = haversineDistanceMeters(
                      current.coords.latitude,
                      current.coords.longitude,
                      o.lat,
                      o.lng
                    );
                    if (!Number.isFinite(d)) return closest;
                    if (!closest || d < closest.distance) return { distance: d, radius: o.radius };
                    return closest;
                  },
                  null as { distance: number; radius: number | null } | null
                );
                if (nearest && Number.isFinite(nearest.distance)) {
                  setDistanceMeters(nearest.distance);
                  setNearestRadiusMeters(nearest.radius ?? fallbackRadius);
                } else {
                  setDistanceMeters(null);
                  setNearestRadiusMeters(null);
                  setLocationError('Unable to calculate distance to office.');
                }
              } catch {
                setDistanceMeters(null);
                setNearestRadiusMeters(null);
                setLocationError('Unable to calculate distance to office.');
              }
            }
          }
          const wifiRead = await readCurrentWifiSnapshot();
          const freshSsid = wifiRead.snapshot.ssid;
          const freshBssid = wifiRead.snapshot.bssid;
          setFreshWifiSsid(freshSsid);
          setFreshWifiBssid(freshBssid);
          if (wifiRead.status === 'permission_wifi') {
            setWifiProofOk(false);
            setWifiErrorCode('permission_wifi');
            setWifiProofError('Wi-Fi permission is blocked.');
            return;
          }
          if (wifiRead.status === 'not_connected') {
            setWifiProofOk(false);
            setWifiErrorCode('not_connected');
            setWifiProofError('Not connected to Wi-Fi.');
            return;
          }
          const configWifi = getConfigWifiAllowlist(freshConfig);
          const allowedSsids = configWifi.allowedSsids.map(normalizeSsid).filter(Boolean);
          const allowedBssids = configWifi.allowedBssids.map(normalizeBssid).filter(Boolean);
          if (allowedSsids.length === 0) {
            allowedSsids.push(...coerceStringList(env.OFFICE_WIFI_SSID).map(normalizeSsid).filter(Boolean));
          }
          if (allowedBssids.length === 0) {
            allowedBssids.push(...coerceStringList(env.OFFICE_WIFI_BSSID).map(normalizeBssid).filter(Boolean));
          }
          if (allowedSsids.length === 0 && allowedBssids.length === 0) {
            try {
              const proof = await requestOfficeProof({ bssid: freshBssid ?? undefined, ssid: freshSsid ?? undefined });
              if (proof.ok) { setWifiProofOk(true); setWifiProofError(null); setWifiErrorCode(null); }
              else { setWifiProofOk(false); setWifiErrorCode('proof_failed'); setWifiProofError('Server could not verify your Wi-Fi.'); }
            } catch (error) { setWifiProofOk(false); setWifiErrorCode('api_error'); setWifiProofError(getErrorMessage(error)); }
            return;
          }
          if (allowedSsids.length > 0 && !freshSsid) { setWifiProofOk(false); setWifiErrorCode('ssid_unreadable'); setWifiProofError('Unable to read Wi-Fi name.'); return; }
          if (allowedBssids.length > 0 && !freshBssid) { setWifiProofOk(false); setWifiErrorCode('bssid_unreadable'); setWifiProofError('Unable to read Wi-Fi info.'); return; }
          if (allowedSsids.length > 0 && !allowedSsids.includes(normalizeSsid(freshSsid))) { setWifiProofOk(false); setWifiErrorCode('ssid_mismatch'); setWifiProofError(`Wrong Wi-Fi network: "${freshSsid}".`); return; }
          if (allowedBssids.length > 0 && !allowedBssids.includes(normalizeBssid(freshBssid))) { setWifiProofOk(false); setWifiErrorCode('bssid_mismatch'); setWifiProofError("Wi-Fi access point doesn't match office network."); return; }
          try {
            const proof = await requestOfficeProof({ bssid: freshBssid ?? undefined, ssid: freshSsid ?? undefined });
            if (proof.ok) { setWifiProofOk(true); setWifiProofError(null); setWifiErrorCode(null); }
            else { setWifiProofOk(false); setWifiErrorCode('proof_failed'); setWifiProofError('Server could not verify your Wi-Fi.'); }
          } catch (error) { setWifiProofOk(false); setWifiErrorCode('api_error'); setWifiProofError(getErrorMessage(error)); }
        })(),
        validationTimeout,
      ]);
    } catch (error) {
      if (getErrorMessage(error).includes('timeout')) {
        setWifiProofOk(false); setWifiErrorCode('timeout'); setWifiProofError('Verification timed out.');
      } else {
        setWifiProofOk(false); setWifiErrorCode('api_error'); setWifiProofError(getErrorMessage(error));
      }
    } finally {
      setIsRefreshing(false);
      setIsValidating(false);
    }
  }, [refetchConfig]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleModeChange = useCallback(
    (m: AttendanceMode) => {
      setMode(m);
      setPhotoTaken(false);
      setTripPhoto(null);
      setTripLocation('');
    },
    []
  );

  const handleOpenCamera = useCallback(async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'front',
      saveToPhotos: false,
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      const message =
        result.errorMessage ||
        (result.errorCode === 'camera_unavailable'
          ? 'Kamera tidak tersedia di perangkat ini.'
          : result.errorCode === 'permission'
          ? 'Izin kamera dibutuhkan untuk foto dinas luar.'
          : 'Gagal mengambil foto.');
      if (result.errorCode === 'permission') {
        Alert.alert('Izin Kamera', message, [
          { text: 'Batal', style: 'cancel' },
          { text: 'Buka Pengaturan', onPress: () => openSettings() },
        ]);
      } else {
        showToast('error', message);
      }
      return;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri) {
      showToast('error', 'Foto tidak tersedia. Coba lagi.');
      return;
    }
    setTripPhoto({
      uri: asset.uri,
      fileName: asset.fileName ?? 'trip-photo.jpg',
      type: asset.type ?? 'image/jpeg',
    });
    setPhotoTaken(true);
  }, []);

  const handleReasonSubmit = useCallback((type: ReasonType, text: string) => {
    if (type === 'late') {
      setLateReason(text);
      setLateSubmittedAt(Date.now());
    } else {
      setEarlyReason(text);
      setEarlySubmittedAt(Date.now());
    }
    setReasonModalType(null);
  }, []);

  const createOfficePayload = (): AttendancePayload | null => {
    const payloadSsid = freshWifiSsid ?? wifiSsid;
    const payloadBssid = freshWifiBssid ?? wifiBssid;
    if (location) {
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        gpsAccuracy: location.coords.accuracy ?? 0,
        distanceMeters: distanceMeters ?? 0,
        method: 'office',
        wifiProof: { bssid: payloadBssid ?? undefined, ssid: payloadSsid ?? undefined },
      };
    }
    if (wifiProofOk === true) {
      return {
        lat: 0,
        lng: 0,
        gpsAccuracy: 0,
        distanceMeters: 0,
        method: 'office',
        wifiProof: { bssid: payloadBssid ?? undefined, ssid: payloadSsid ?? undefined },
      };
    }
    return null;
  };

  const createTripPayload = async () => {
    if (!tripLocation.trim()) {
      throw new Error('Lokasi dinas luar wajib diisi.');
    }
    if (!tripPhoto?.uri) {
      throw new Error('Foto selfie belum diambil.');
    }
    let uploaded;
    try {
      uploaded = await uploadFile({
        uri: tripPhoto.uri,
        name: tripPhoto.fileName ?? 'trip-photo.jpg',
        type: tripPhoto.type ?? 'image/jpeg',
        uploadType: 'attendance',
      });
    } catch (error) {
      throw new Error(getFriendlyUploadErrorMessage(error, 'attendanceSelfie'));
    }
    return {
      dinasLocation: tripLocation.trim(),
      attachmentPath: uploaded.path,
      photoPath: uploaded.path,
    };
  };

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeNow = () => {
    const t = new Date();
    return `${pad(t.getHours())}:${pad(t.getMinutes())}`;
  };

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'trip') {
        const payload = await createTripPayload();
        return outOfTownCheckIn(payload);
      }
      const payload = createOfficePayload();
      if (!payload) throw new Error('Validation not available yet.');
      return checkIn(payload);
    },
    onSuccess: () => {
      setCheckInDisplayTime(timeNow());
      setSuccessType('in');
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-report'] });
    },
    onError: (error) => {
      showToast('error', getFriendlyAttendanceErrorMessage(error));
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'trip') {
        const payload = await createTripPayload();
        return outOfTownCheckOut(payload);
      }
      const payload = createOfficePayload();
      if (!payload) throw new Error('Validation not available yet.');
      return checkOut(payload);
    },
    onSuccess: () => {
      setCheckOutDisplayTime(timeNow());
      setSuccessType('out');
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-report'] });
    },
    onError: (error) => {
      showToast('error', getFriendlyAttendanceErrorMessage(error));
    },
  });

  const weeklyRecords = useMemo(() => {
    if (!attendanceHistoryQuery.data) return [];
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    return attendanceHistoryQuery.data
      .map((record) => ({ record, parsedDate: parseServerDateTime(record.created_at) }))
      .filter((e): e is { record: AttendanceRecord; parsedDate: Date } => !!e.parsedDate && e.parsedDate >= weekStart)
      .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime())
      .map((e) => e.record);
  }, [attendanceHistoryQuery.data, now]);

  const todaySummary = useMemo(() => {
    if (!attendanceHistoryQuery.data) return { hasCheckIn: false, hasCheckOut: false, checkInLogId: null as number | null, checkOutLogId: null as number | null };
    const today = new Date();
    return attendanceHistoryQuery.data.reduce(
      (acc, record) => {
        const parsed = parseServerDateTime(record.created_at);
        if (parsed && isSameDay(parsed, today)) {
          if (record.type === 'IN') { acc.hasCheckIn = true; acc.checkInLogId = record.id; }
          if (record.type === 'OUT') { acc.hasCheckOut = true; acc.checkOutLogId = record.id; }
        }
        return acc;
      },
      { hasCheckIn: false, hasCheckOut: false, checkInLogId: null as number | null, checkOutLogId: null as number | null }
    );
  }, [attendanceHistoryQuery.data]);

  const checkInActionState = getCheckInActionState({
    canCheck,
    hasCheckIn: todaySummary.hasCheckIn,
    hasCheckOut: todaySummary.hasCheckOut,
    isPending: checkInMutation.isPending,
  });

  const checkOutActionState = getCheckOutActionState({
    canCheck,
    hasCheckIn: todaySummary.hasCheckIn,
    hasCheckOut: todaySummary.hasCheckOut,
    isPending: checkOutMutation.isPending,
  });

  return (
    <Screen scroll style={{ backgroundColor: WARM_SURFACE }}>
      {/* Header */}
      <View
        className="px-4 pb-4 pt-6"
        style={{ backgroundColor: WARM_SURFACE }}
      >
        <Text className="text-[22px] font-black tracking-tight" style={{ color: INK }}>
          Absensi
        </Text>
        <Text className="mt-1 text-xs" style={{ color: TEXT_SUB }}>
          {mode === 'trip'
            ? 'Lengkapi foto dan lokasi, lalu kirim absensi.'
            : 'Pastikan Wi-Fi kantor dan GPS sudah siap.'}
        </Text>
      </View>

      <View className="gap-0">
        {/* Mode Toggle */}
        <ModeToggle mode={mode} onChange={handleModeChange} />

        {/* Time Card */}
        <TimeInfoCard
          checkInTime={checkInDisplayTime}
          checkOutTime={checkOutDisplayTime}
          scheduleLabel={scheduleLabel}
        />

        {/* Validation Card */}
        {mode === 'office' ? (
          <OfficeValidationCard
            wifiProofOk={wifiProofOk}
            wifiErrorCode={wifiErrorCode}
            netInfoType={netInfo.type}
            freshWifiSsid={freshWifiSsid}
            wifiSsid={wifiSsid}
            distanceMeters={distanceMeters}
            locationError={locationError}
            isWithinRadius={isWithinRadius}
            isRefreshing={isRefreshing}
            onRefresh={refreshStatus}
          />
        ) : (
          <TripValidationCard
            photoTaken={photoTaken}
            photoUri={tripPhoto?.uri ?? null}
            tripLocation={tripLocation}
            onSetTripLocation={setTripLocation}
            onOpenCamera={handleOpenCamera}
          />
        )}

        {/* Late / Early Reason Card — office mode only */}
        {mode === 'office' && (
          <LateReasonCard
            now={now}
            scheduleLabel={scheduleLabel}
            lateReason={lateReason}
            earlyReason={earlyReason}
            lateSubmittedAt={lateSubmittedAt}
            earlySubmittedAt={earlySubmittedAt}
            onOpenModal={setReasonModalType}
          />
        )}

        {/* Action Buttons */}
        <View className="mx-4 mt-3 gap-2.5">
          <TouchableOpacity
            onPress={() => checkInMutation.mutate()}
            disabled={checkInActionState.disabled}
            className="w-full py-4 rounded-2xl items-center justify-center flex-row gap-2"
            style={{
              backgroundColor: checkInActionState.disabled ? '#E0E0E0' : MAROON,
            }}
          >
            <Text
              className="text-[15px] font-bold tracking-wide"
              style={{ color: checkInActionState.disabled ? '#999' : '#fff' }}
            >
              {checkInActionState.label}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => checkOutMutation.mutate()}
            disabled={checkOutActionState.disabled}
            className="w-full py-4 rounded-2xl items-center justify-center flex-row gap-2"
            style={{
              borderWidth: 1.5,
              borderColor: checkOutActionState.disabled ? '#E0E0E0' : MAROON,
              backgroundColor: SURFACE,
            }}
          >
            <Text
              className="text-[15px] font-bold tracking-wide"
              style={{
                color: checkOutActionState.disabled ? '#bbb' : MAROON,
              }}
            >
              {checkOutActionState.label}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weekly History */}
        <View className="mt-4">
          <View className="flex-row justify-between items-center px-4 mb-2">
            <Text className="text-sm font-bold text-ink-700">Minggu Ini</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AttendanceMonthlyDetail')}>
              <Text className="text-[11px] font-semibold" style={{ color: MAROON }}>
                Lihat Semua →
              </Text>
            </TouchableOpacity>
          </View>
          <View className="mx-4 rounded-2xl bg-white overflow-hidden shadow-sm">
            {attendanceHistoryQuery.isLoading ? (
              <View className="p-4">
                <Text className="text-sm text-ink-500">Memuat riwayat absensi...</Text>
              </View>
            ) : weeklyRecords.length > 0 ? (
              weeklyRecords.map((record) => {
                const parsed = parseServerDateTime(record.created_at);
                const isTrip = record.method === 'trip';
                return (
                  <View
                    key={record.id}
                    className="flex-row items-center px-4 py-2.5 border-b border-slate-50"
                  >
                    <View
                      className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                      style={{
                        backgroundColor: isTrip ? WARM_SURFACE : '#F0E8EA',
                        borderWidth: 1,
                        borderColor: BORDER_WARM,
                      }}
                    >
                      <Text style={{ color: isTrip ? TEXT_SUB : MAROON }}>
                        {isTrip ? '✈️' : '🕐'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-ink-700">
                        {record.type === 'IN' ? 'Masuk' : 'Pulang'}
                        {isTrip && (
                          <Text className="text-[10px] font-normal" style={{ color: TEXT_SUB }}>
                            {' '}· Dinas Luar
                          </Text>
                        )}
                      </Text>
                      <Text className="text-[10px] text-ink-500">
                        {parsed
                          ? parsed.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                          : record.created_at}
                      </Text>
                    </View>
                    <Text className="text-[10px] text-ink-500">{record.office_name}</Text>
                  </View>
                );
              })
            ) : (
              <View className="p-4">
                <Text className="text-sm text-ink-500">Belum ada catatan absensi minggu ini.</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Success Overlay */}
      {successType && (
        <SuccessOverlay
          type={successType}
          mode={mode}
          onClose={() => setSuccessType(null)}
        />
      )}

      {/* Late / Early Reason Modal */}
      {reasonModalType && (
        <LateReasonModal
          type={reasonModalType}
          existing={reasonModalType === 'late' ? lateReason : earlyReason}
          logId={reasonModalType === 'late' ? todaySummary.checkInLogId : todaySummary.checkOutLogId}
          onSubmit={(text) => handleReasonSubmit(reasonModalType, text)}
          onClose={() => setReasonModalType(null)}
        />
      )}
    </Screen>
  );
};
