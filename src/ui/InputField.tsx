import { Text, TextInput, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { cn } from '@/utils/cn';

type InputProps = {
  label: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  placeholderTextColor?: string;
  error?: string;
  multiline?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  inputStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
};

export const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  placeholderTextColor,
  error,
  multiline,
  containerClassName,
  labelClassName,
  inputClassName,
  errorClassName,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
}: InputProps) => (
  <View className={cn('gap-2', containerClassName)} style={containerStyle}>
    <Text
      className={cn('text-sm font-medium text-ink-600', labelClassName)}
      style={labelStyle}
    >
      {label}
    </Text>
    <TextInput
      className={cn(
        'rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-ink-700',
        multiline && 'min-h-[96px]',
        inputClassName
      )}
      style={inputStyle}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
    {error ? (
      <Text
        className={cn('text-xs text-red-600', errorClassName)}
        style={errorStyle}
      >
        {error}
      </Text>
    ) : null}
  </View>
);
