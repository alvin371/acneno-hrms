import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { cn } from '@/utils/cn';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  labelClassName?: string;
};

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  className,
  labelClassName,
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center rounded-xl px-4 py-3',
        variant === 'primary' && 'bg-brand-600',
        variant === 'secondary' && 'bg-white border border-brand-600',
        variant === 'ghost' && 'bg-transparent',
        isDisabled && 'opacity-50',
        className
      )}
    >
      <View className="flex-row items-center gap-2">
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? '#fff' : '#2454db'}
          />
        ) : null}
        <Text
          className={cn(
            'text-base font-semibold',
            variant === 'primary' && 'text-white',
            variant !== 'primary' && 'text-brand-600',
            labelClassName
          )}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};
