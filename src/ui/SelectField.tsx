import { Modal, Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import { tokens } from '@/config/tokens';
import { cn } from '@/utils/cn';

export type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  label: string;
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
};

export const SelectField = ({
  label,
  value,
  placeholder = 'Select',
  options,
  onChange,
  error,
}: SelectFieldProps) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-ink-600">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className={cn(
          'rounded-xl border bg-white px-3 py-3',
          !value && 'text-slate-400'
        )}
        style={{ borderColor: tokens.colors.borderWarm }}
      >
        <Text
          className="text-base text-ink-700"
          style={{ color: value ? tokens.colors.ink : tokens.colors.textMuted }}
        >
          {selectedLabel ?? placeholder}
        </Text>
      </Pressable>
      {error ? <Text className="text-xs text-red-600">{error}</Text> : null}
      <Modal transparent visible={open} animationType="fade">
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setOpen(false)}
        >
          <View className="rounded-t-3xl bg-white p-6">
            <Text className="text-lg font-semibold text-ink-700">
              {label}
            </Text>
            <View className="mt-4 gap-2">
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'rounded-xl border px-3 py-3'
                  )}
                  style={{
                    backgroundColor:
                      option.value === value ? '#F0E8EA' : '#F5F5F5',
                    borderColor:
                      option.value === value
                        ? tokens.colors.maroon
                        : 'transparent',
                  }}
                >
                  <Text className="text-base text-ink-700">
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};
