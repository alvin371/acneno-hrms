import { Text, View } from 'react-native';
import { cn } from '@/utils/cn';

type StatusChipProps = {
  label: string;
  variant?: 'pending' | 'submitted' | 'approved' | 'rejected' | 'cancelled';
};

export const StatusChip = ({ label, variant = 'pending' }: StatusChipProps) => (
  <View
    className={cn(
      'self-start rounded-full px-3 py-1',
      variant === 'pending' && 'bg-amber-100',
      variant === 'submitted' && 'bg-blue-100',
      variant === 'approved' && 'bg-emerald-100',
      variant === 'rejected' && 'bg-rose-100',
      variant === 'cancelled' && 'bg-rose-100'
    )}
  >
    <Text
      className={cn(
        'text-xs font-semibold',
        variant === 'pending' && 'text-amber-700',
        variant === 'submitted' && 'text-blue-700',
        variant === 'approved' && 'text-emerald-700',
        variant === 'rejected' && 'text-rose-700',
        variant === 'cancelled' && 'text-rose-700'
      )}
    >
      {label}
    </Text>
  </View>
);
