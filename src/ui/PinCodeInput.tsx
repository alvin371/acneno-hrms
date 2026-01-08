import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { cn } from '@/utils/cn';

type PinCodeInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  containerClassName?: string;
  labelClassName?: string;
};

export const PinCodeInput = ({
  label,
  value,
  onChangeText,
  length = 6,
  autoFocus,
  containerClassName,
  labelClassName,
}: PinCodeInputProps) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const digits = useMemo(
    () => Array.from({ length }, (_, index) => value[index] ?? ''),
    [length, value]
  );
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View className={cn('gap-3', containerClassName)}>
      <Text className={cn('text-xs uppercase tracking-widest text-zinc-500', labelClassName)}>
        {label}
      </Text>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        className="relative"
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View className="flex-row justify-between gap-2">
          {digits.map((digit, index) => {
            const isFilled = digit !== '';
            const isActive = isFocused && index === activeIndex;

            return (
              <View
                key={`${label}-${index}`}
                className={cn(
                  'h-12 w-11 items-center justify-center rounded-xl border bg-slate-50',
                  isActive && 'border-brand-500 bg-brand-50 shadow-sm',
                  !isActive && isFilled && 'border-ink-700/20 bg-white',
                  !isActive && !isFilled && 'border-slate-200'
                )}
              >
                {isFilled ? (
                  <View className="h-2 w-2 rounded-full bg-ink-700" />
                ) : null}
              </View>
            );
          })}
        </View>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={(text) =>
            onChangeText(text.replace(/\D/g, '').slice(0, length))
          }
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={length}
          secureTextEntry
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute inset-0 opacity-0"
          caretHidden
          contextMenuHidden
          autoFocus={autoFocus}
          pointerEvents="none"
        />
      </Pressable>
    </View>
  );
};
