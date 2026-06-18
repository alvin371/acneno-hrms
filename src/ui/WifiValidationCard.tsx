import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '@/config/tokens';
import { cn } from '@/utils/cn';
import type { WifiErrorCode } from '@/hooks/useWifiValidation';

const SETTINGS_ERROR_CODES: WifiErrorCode[] = [
  'permission_location',
  'permission_wifi',
  'ssid_unreadable',
  'bssid_unreadable',
];

const ERROR_HINTS: Record<WifiErrorCode, string> = {
  permission_location:
    'Aktifkan akses lokasi di pengaturan perangkat untuk verifikasi Wi-Fi.',
  permission_wifi: 'Aktifkan akses Wi-Fi di pengaturan perangkat.',
  not_connected: 'Hubungkan ke jaringan Wi-Fi kantor lalu coba lagi.',
  outside_radius: 'Mendekatlah ke lokasi kantor lalu coba lagi.',
  ssid_unreadable:
    'Nyalakan Wi-Fi dan layanan lokasi, lalu coba lagi.',
  bssid_unreadable:
    'Nyalakan Wi-Fi dan layanan lokasi, lalu coba lagi.',
  ssid_mismatch: 'Hubungkan ke jaringan Wi-Fi kantor lalu coba lagi.',
  bssid_mismatch:
    'Pastikan perangkat tersambung ke Wi-Fi kantor yang benar.',
  not_configured:
    'Hubungi administrator untuk mengatur Wi-Fi kantor.',
  proof_failed: 'Coba lagi atau hubungi administrator.',
  api_error: 'Periksa koneksi internet lalu coba lagi.',
  timeout: 'Periksa koneksi Anda lalu coba lagi.',
};

type WifiValidationCardProps = {
  isValidating: boolean;
  wifiProofOk: boolean | null;
  wifiProofError: string | null;
  wifiSsid: string | null;
  onRefresh: () => void;
  variant?: 'default' | 'compact';
  errorCode?: WifiErrorCode | null;
  onOpenSettings?: () => void;
};

const CheckIcon = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 13l4 4L19 7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const XIcon = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 6l12 12M18 6l-12 12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const WifiValidationCard = ({
  isValidating,
  wifiProofOk,
  wifiProofError,
  wifiSsid,
  onRefresh,
  variant = 'default',
  errorCode,
  onOpenSettings,
}: WifiValidationCardProps) => {
  const isChecking = isValidating || wifiProofOk === null;
  const isVerified = !isChecking && wifiProofOk === true;
  const isFailed = !isChecking && wifiProofOk === false;

  const containerClass = cn(
    'rounded-2xl border',
    variant === 'compact' ? 'p-3' : 'p-4',
    isChecking && 'bg-white',
    isVerified && 'bg-emerald-100',
    isFailed && 'bg-rose-50'
  );

  const titleClass = cn(
    'font-semibold',
    variant === 'compact' ? 'text-sm' : 'text-base',
    isChecking && 'text-slate-700',
    isVerified && 'text-emerald-700',
    isFailed && 'text-rose-700'
  );

  const subtitleClass = cn(
    variant === 'compact' ? 'text-xs' : 'text-sm',
    isChecking && 'text-slate-600',
    isVerified && 'text-emerald-700',
    isFailed && 'text-rose-700',
    (isVerified || isFailed) && 'opacity-80'
  );

  const statusLabel = isChecking
    ? 'Memeriksa Wi-Fi...'
    : isVerified
      ? 'Wi-Fi terverifikasi'
      : 'Wi-Fi kantor dibutuhkan';

  const iconColor = isVerified ? '#047857' : isFailed ? '#BE123C' : tokens.colors.textSub;

  return (
    <View
      className={containerClass}
      style={{
        borderColor: isVerified
          ? '#A7F3D0'
          : isFailed
            ? '#FDA4AF'
            : tokens.colors.borderWarm,
      }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-start gap-3 flex-1">
          <View className="mt-0.5">
            {isChecking ? (
              <ActivityIndicator color={iconColor} size="small" />
            ) : isVerified ? (
              <CheckIcon color={iconColor} />
            ) : (
              <XIcon color={iconColor} />
            )}
          </View>
          <View className="flex-1">
            <Text className={titleClass}>{statusLabel}</Text>
            <Text className={subtitleClass} numberOfLines={1}>
              Wi-Fi: {wifiSsid ?? 'Tidak terbaca'}
            </Text>
            {isFailed && wifiProofError ? (
              <Text className={cn(subtitleClass, 'mt-1')}>
                {wifiProofError}
              </Text>
            ) : null}
            {isFailed && errorCode && ERROR_HINTS[errorCode] ? (
              <Text
                className={cn(
                  variant === 'compact' ? 'text-xs' : 'text-sm',
                  'text-rose-600 opacity-70 mt-0.5'
                )}
              >
                {ERROR_HINTS[errorCode]}
              </Text>
            ) : null}
          </View>
        </View>
        <View className="flex-col gap-1.5">
          {isFailed &&
          errorCode &&
          SETTINGS_ERROR_CODES.includes(errorCode) &&
          onOpenSettings ? (
            <Pressable
              onPress={onOpenSettings}
              className="rounded-lg border px-3 py-1"
              style={{ borderColor: '#FDA4AF' }}
            >
              <Text className="text-xs font-semibold text-rose-700">
                Buka pengaturan
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onRefresh}
            disabled={isChecking}
            className={cn(
              'rounded-lg border px-3 py-1',
              isChecking ? 'opacity-60' : 'opacity-100'
            )}
            style={{ borderColor: tokens.colors.borderWarm }}
          >
            <Text
              className={cn(
                'text-xs font-semibold',
                isChecking ? 'text-ink-400' : 'text-ink-600'
              )}
            >
              Periksa lagi
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
