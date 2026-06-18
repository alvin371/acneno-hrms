import { useState } from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Modal, Pressable, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { tokens } from '@/config/tokens';
import { cn } from '@/utils/cn';

type FormDatePickerProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  minimumDate?: string;
  maximumDate?: string;
  holidayDates?: string[];
  onMonthChange?: (dateString: string) => void;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
};

export const FormDatePicker = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'YYYY-MM-DD',
  minimumDate,
  maximumDate,
  holidayDates,
  onMonthChange,
  containerClassName,
  labelClassName,
  inputClassName,
  errorClassName,
}: FormDatePickerProps<T>) => {
  const [open, setOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const displayValue = value ? String(value) : '';

        const markedDates = (() => {
          if (!displayValue && (!holidayDates || holidayDates.length === 0)) {
            return undefined;
          }

          const marks: Record<string, any> = {};
          if (holidayDates && holidayDates.length > 0) {
            holidayDates.forEach((date) => {
              marks[date] = {
                disabled: true,
                disableTouchEvent: true,
                customStyles: {
                  container: {
                    backgroundColor: '#fee2e2',
                    borderRadius: 8,
                  },
                  text: {
                    color: '#b91c1c',
                    fontWeight: '600',
                  },
                },
              };
            });
          }

          if (displayValue) {
            const existing = marks[displayValue];
            marks[displayValue] = {
              ...existing,
              disabled: false,
              disableTouchEvent: false,
              customStyles: {
                container: {
                  backgroundColor: tokens.colors.maroon,
                  borderRadius: 8,
                },
                text: {
                  color: '#ffffff',
                  fontWeight: '600',
                },
              },
            };
          }

          return marks;
        })();

        const openPicker = () => {
          setOpen(true);
        };

        const closePicker = () => setOpen(false);

        return (
          <View className={cn('gap-2', containerClassName)}>
            <Text className={cn('text-sm font-medium text-ink-600', labelClassName)}>
              {label}
            </Text>
            <Pressable onPress={openPicker}>
              <View
                className={cn(
                  'rounded-xl border bg-white px-3 py-3',
                  inputClassName
                )}
                style={{ borderColor: tokens.colors.borderWarm }}
              >
                <Text
                  className={cn('text-base')}
                  style={{
                    color: displayValue ? tokens.colors.ink : tokens.colors.textMuted,
                  }}
                >
                  {displayValue || placeholder}
                </Text>
              </View>
            </Pressable>
            {error ? (
              <Text className={cn('text-xs text-red-600', errorClassName)}>
                {error.message}
              </Text>
            ) : null}
            <Modal
              transparent
              visible={open}
              animationType="fade"
              onRequestClose={closePicker}
            >
              <Pressable
                className="flex-1 bg-black/30"
                onPress={closePicker}
              />
              <View className="rounded-t-3xl bg-white px-6 pb-6 pt-4">
                <View className="flex-row justify-between pb-2">
                  <Text className="text-base font-semibold text-ink-700">
                    Pilih tanggal
                  </Text>
                  <Pressable onPress={closePicker}>
                    <Text className="text-base font-semibold text-ink-500">
                      Tutup
                    </Text>
                  </Pressable>
                </View>
                <Calendar
                  current={displayValue || undefined}
                  minDate={minimumDate}
                  maxDate={maximumDate}
                  markedDates={markedDates}
                  markingType="custom"
                  onMonthChange={(month) => {
                    if (onMonthChange) {
                      onMonthChange(month.dateString);
                    }
                  }}
                  onDayPress={(day) => {
                    onChange(day.dateString);
                    closePicker();
                  }}
                  theme={{
                    todayTextColor: tokens.colors.maroon,
                    arrowColor: tokens.colors.maroon,
                    selectedDayBackgroundColor: tokens.colors.maroon,
                    selectedDayTextColor: '#ffffff',
                  }}
                />
              </View>
            </Modal>
          </View>
        );
      }}
    />
  );
};
