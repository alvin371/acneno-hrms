import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { cn } from '@/utils/cn';

type WifiValidationCardProps = {
  isValidating: boolean;
  wifiProofOk: boolean | null;
  wifiProofError: string | null;
  wifiSsid: string | null;
  onRefresh: () => void;
  variant?: 'default' | 'compact';
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
}: WifiValidationCardProps) => {
  const isChecking = isValidating || wifiProofOk === null;
  const isVerified = !isChecking && wifiProofOk === true;
  const isFailed = !isChecking && wifiProofOk === false;

  const containerClass = cn(
    'rounded-2xl border',
    variant === 'compact' ? 'p-3' : 'p-4',
    isChecking && 'border-slate-200 bg-slate-100',
    isVerified && 'border-emerald-200 bg-emerald-100',
    isFailed && 'border-rose-200 bg-rose-100'
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
    ? 'Verifying Wi-Fi...'
    : isVerified
      ? 'Wi-Fi verified'
      : 'Wi-Fi required';

  const iconColor = isVerified ? '#16a34a' : isFailed ? '#dc2626' : '#64748b';

  return (
    <View className={containerClass}>
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
              Wi-Fi: {wifiSsid ?? 'Unknown'}
            </Text>
            {isFailed && wifiProofError ? (
              <Text className={cn(subtitleClass, 'mt-1')}>
                {wifiProofError}
              </Text>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={onRefresh}
          disabled={isChecking}
          className={cn(
            'rounded-lg border px-3 py-1',
            isChecking ? 'border-slate-200' : 'border-slate-300',
            isChecking ? 'opacity-60' : 'opacity-100'
          )}
        >
          <Text
            className={cn(
              'text-xs font-semibold',
              isChecking ? 'text-slate-500' : 'text-slate-700'
            )}
          >
            Refresh
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
