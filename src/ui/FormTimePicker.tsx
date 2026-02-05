import { useState } from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path as SvgPath } from 'react-native-svg';
import { cn } from '@/utils/cn';

let DateTimePicker: React.ComponentType<any> | null = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch {
  DateTimePicker = null;
}

type FormTimePickerProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
};

const ClockIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
    <SvgPath
      d="M12 7v5l3 3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const parseTimeString = (timeString: string): Date => {
  const date = new Date();
  if (timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
  }
  return date;
};

const formatTimeDisplay = (timeString: string): string => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

const formatTime24 = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

const FallbackTimePicker = ({
  visible,
  onClose,
  onConfirm,
  initialHour,
  initialMinute,
  label,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (hour: number, minute: number) => void;
  initialHour: number;
  initialMinute: number;
  label: string;
}) => {
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);

  const handleConfirm = () => {
    onConfirm(selectedHour, selectedMinute);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/30" onPress={onClose} />
      <View className="rounded-t-3xl bg-white px-6 pb-6 pt-4">
        <View className="flex-row justify-between pb-4">
          <Text className="text-base font-semibold text-ink-700">{label}</Text>
          <Pressable onPress={handleConfirm}>
            <Text className="text-base font-semibold text-blue-600">Done</Text>
          </Pressable>
        </View>
        <View className="flex-row justify-center gap-4">
          <View className="flex-1">
            <Text className="mb-2 text-center text-sm font-medium text-ink-500">
              Hour
            </Text>
            <View
              className="rounded-xl border border-slate-200 bg-slate-50"
              style={{ height: 200 }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {hours.map((h) => (
                  <Pressable
                    key={h}
                    onPress={() => setSelectedHour(h)}
                    className="items-center py-3"
                    style={{
                      backgroundColor:
                        selectedHour === h ? '#1E88E5' : 'transparent',
                    }}
                  >
                    <Text
                      className="text-lg font-semibold"
                      style={{
                        color: selectedHour === h ? '#ffffff' : '#1a1a1a',
                      }}
                    >
                      {String(h).padStart(2, '0')}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
          <View className="flex-1">
            <Text className="mb-2 text-center text-sm font-medium text-ink-500">
              Minute
            </Text>
            <View
              className="rounded-xl border border-slate-200 bg-slate-50"
              style={{ height: 200 }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {minutes.map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setSelectedMinute(m)}
                    className="items-center py-3"
                    style={{
                      backgroundColor:
                        selectedMinute === m ? '#1E88E5' : 'transparent',
                    }}
                  >
                    <Text
                      className="text-lg font-semibold"
                      style={{
                        color: selectedMinute === m ? '#ffffff' : '#1a1a1a',
                      }}
                    >
                      {String(m).padStart(2, '0')}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
        <View className="mt-4 items-center rounded-xl bg-slate-100 py-3">
          <Text className="text-2xl font-bold text-ink-700">
            {String(selectedHour).padStart(2, '0')}:
            {String(selectedMinute).padStart(2, '0')}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

export const FormTimePicker = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Select time',
  containerClassName,
  labelClassName,
  inputClassName,
  errorClassName,
}: FormTimePickerProps<T>) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const displayValue = value ? formatTimeDisplay(String(value)) : '';
        const dateValue = parseTimeString(value ? String(value) : '');

        const handleTimeChange = (_event: any, selectedDate?: Date) => {
          if (Platform.OS === 'android') {
            setShowPicker(false);
          }
          if (selectedDate) {
            onChange(formatTime24(selectedDate));
          }
        };

        const handleFallbackConfirm = (hour: number, minute: number) => {
          const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          onChange(timeString);
        };

        const handleConfirm = () => {
          setShowPicker(false);
        };

        return (
          <View className={cn('gap-2', containerClassName)}>
            <Text
              className={cn('text-sm font-medium text-ink-600', labelClassName)}
            >
              {label}
            </Text>
            <Pressable onPress={() => setShowPicker(true)}>
              <View
                className={cn(
                  'flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3',
                  error && 'border-red-300',
                  inputClassName
                )}
              >
                <Text
                  className={cn(
                    'text-base',
                    displayValue ? 'text-ink-700' : 'text-slate-400'
                  )}
                >
                  {displayValue || placeholder}
                </Text>
                <ClockIcon color="#94a3b8" />
              </View>
            </Pressable>
            {error ? (
              <Text className={cn('text-xs text-red-600', errorClassName)}>
                {error.message}
              </Text>
            ) : null}

            {DateTimePicker ? (
              Platform.OS === 'ios' ? (
                <Modal
                  transparent
                  visible={showPicker}
                  animationType="fade"
                  onRequestClose={() => setShowPicker(false)}
                >
                  <Pressable
                    className="flex-1 bg-black/30"
                    onPress={() => setShowPicker(false)}
                  />
                  <View className="rounded-t-3xl bg-white px-6 pb-6 pt-4">
                    <View className="flex-row justify-between pb-2">
                      <Text className="text-base font-semibold text-ink-700">
                        {label}
                      </Text>
                      <Pressable onPress={handleConfirm}>
                        <Text className="text-base font-semibold text-blue-600">
                          Done
                        </Text>
                      </Pressable>
                    </View>
                    <DateTimePicker
                      value={dateValue}
                      mode="time"
                      display="spinner"
                      onChange={handleTimeChange}
                    />
                  </View>
                </Modal>
              ) : showPicker ? (
                <DateTimePicker
                  value={dateValue}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              ) : null
            ) : (
              <FallbackTimePicker
                visible={showPicker}
                onClose={() => setShowPicker(false)}
                onConfirm={handleFallbackConfirm}
                initialHour={dateValue.getHours()}
                initialMinute={dateValue.getMinutes()}
                label={label}
              />
            )}
          </View>
        );
      }}
    />
  );
};
