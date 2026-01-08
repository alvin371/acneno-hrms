import { Modal, Pressable, Text, View } from 'react-native';
import { useState } from 'react';
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
          'rounded-xl border border-slate-200 bg-white px-3 py-3',
          !value && 'text-slate-400'
        )}
      >
        <Text className={cn('text-base text-ink-700', !value && 'text-slate-400')}>
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
                    'rounded-xl px-3 py-3',
                    option.value === value
                      ? 'bg-brand-50 border border-brand-200'
                      : 'bg-slate-50'
                  )}
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
