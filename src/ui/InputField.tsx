import { Text, TextInput, View } from 'react-native';
import { cn } from '@/utils/cn';

type InputProps = {
  label: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  error?: string;
  multiline?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
};

export const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  error,
  multiline,
  containerClassName,
  labelClassName,
  inputClassName,
  errorClassName,
}: InputProps) => (
  <View className={cn('gap-2', containerClassName)}>
    <Text className={cn('text-sm font-medium text-ink-600', labelClassName)}>
      {label}
    </Text>
    <TextInput
      className={cn(
        'rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-ink-700',
        multiline && 'min-h-[96px]',
        inputClassName
      )}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
    {error ? (
      <Text className={cn('text-xs text-red-600', errorClassName)}>
        {error}
      </Text>
    ) : null}
  </View>
);
