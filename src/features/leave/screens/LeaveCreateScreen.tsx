import { Modal, Pressable, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Calendar, type DateData } from 'react-native-calendars';
import DocumentPicker from '@react-native-documents/picker';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { FormInput } from '@/ui/FormInput';
import { FormSelect } from '@/ui/FormSelect';
import { createLeave, getHolidays, getLeaveQuota } from '@/features/leave/api';
import { showToast } from '@/utils/toast';
import { getErrorMessage } from '@/api/error';
import { queryClient } from '@/lib/queryClient';
import { cn } from '@/utils/cn';
import type { Holiday } from '@/api/types';
import type { LeaveStackParamList } from '@/navigation/types';

const schema = z
  .object({
    leaveTypeId: z.string().min(1, 'Select a leave type'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z.string().min(1, 'Reason is required'),
  })
  .refine(
    (values) => {
      const start = new Date(values.startDate).getTime();
      const end = new Date(values.endDate).getTime();
      if (Number.isNaN(start) || Number.isNaN(end)) {
        return false;
      }
      return start <= end;
    },
    {
      message: 'Start date must be before end date',
      path: ['endDate'],
    }
  );

type FormValues = z.infer<typeof schema>;

type Props = NativeStackScreenProps<LeaveStackParamList, 'LeaveCreate'>;

const leaveTypeOptions = [
  { label: 'Annual Leave', value: '1' },
  { label: 'Sick Leave', value: '2' },
  { label: 'Unpaid Leave', value: '3' },
];

const JAKARTA_TIMEZONE = 'Asia/Jakarta';

const formatMonthKey = (dateString: string) => dateString.slice(0, 7);

const getMonthRange = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return {
    start: formatDateUTC(start),
    end: formatDateUTC(end),
  };
};

const formatDateUTC = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysUTC = (dateString: string, days: number) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateUTC(date);
};

const getTodayInJakarta = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: JAKARTA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch (error) {
    return formatDateUTC(new Date());
  }
};

const formatDayName = (dateString: string) => {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      timeZone: JAKARTA_TIMEZONE,
    }).format(date);
  } catch (error) {
    return '';
  }
};

type DateFieldProps = {
  label: string;
  value?: string;
  placeholder?: string;
  error?: string;
  onPress: () => void;
};

type LeaveAttachment = {
  uri: string;
  name: string;
  type: string;
};

const DateField = ({
  label,
  value,
  placeholder,
  error,
  onPress,
}: DateFieldProps) => (
  <View className="gap-2">
    <Text className="text-sm font-medium text-ink-600">{label}</Text>
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-xl border border-slate-200 bg-white px-3 py-3',
        error && 'border-red-300'
      )}
    >
      <Text className={cn('text-base', value ? 'text-ink-700' : 'text-slate-400')}>
        {value || placeholder}
      </Text>
    </Pressable>
    {error ? <Text className="text-xs text-red-600">{error}</Text> : null}
  </View>
);

export const LeaveCreateScreen = ({ navigation }: Props) => {
  const {
    control,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      reason: '',
    },
  });
  const [attachment, setAttachment] = useState<LeaveAttachment | null>(null);
  const [isPickerOpen, setPickerOpen] = useState(false);
  const todayInJakarta = useMemo(() => getTodayInJakarta(), []);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });
  const initialHolidayRange = useMemo(
    () => getMonthRange(formatMonthKey(todayInJakarta)),
    [todayInJakarta]
  );

  const quotaQuery = useQuery({
    queryKey: ['leave-quota'],
    queryFn: getLeaveQuota,
  });

  const mutation = useMutation({
    mutationFn: createLeave,
    onSuccess: () => {
      showToast('success', 'Leave submitted successfully.');
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      navigation.goBack();
    },
    onError: (error) => showToast('error', getErrorMessage(error)),
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      ...values,
      leaveTypeId: Number(values.leaveTypeId),
      attachment: attachment ?? undefined,
    });
  };

  const holidayMap = useMemo(() => {
    const map: Record<string, { name?: string }> = {};
    holidays.forEach((day) => {
      if (day.isHoliday) {
        map[day.date] = { name: day.name };
      }
    });
    return map;
  }, [holidays]);

  const markedDates = useMemo(() => {
    const markings: Record<string, any> = {};

    if (startDate) {
      if (endDate) {
        let cursor = startDate;
        while (cursor <= endDate) {
          const isStart = cursor === startDate;
          const isEnd = cursor === endDate;
          markings[cursor] = {
            startingDay: isStart,
            endingDay: isEnd,
            color: isStart || isEnd ? '#b4d2ff' : '#eef6ff',
          };
          cursor = addDaysUTC(cursor, 1);
        }
      } else {
        markings[startDate] = {
          startingDay: true,
          endingDay: true,
          color: '#b4d2ff',
        };
      }
    }

    Object.keys(holidayMap).forEach((date) => {
      markings[date] = {
        ...(markings[date] ?? {}),
        disabled: true,
        disableTouchEvent: true,
      };
    });

    return markings;
  }, [startDate, endDate, holidayMap]);

  const fetchHolidays = async (start: string, end: string) => {
    try {
      const data = await getHolidays(start, end);
      setHolidays(data);
      return data;
    } catch (error) {
      showToast('error', getErrorMessage(error));
      return [];
    }
  };

  useEffect(() => {
    void fetchHolidays(initialHolidayRange.start, initialHolidayRange.end);
  }, [initialHolidayRange.start, initialHolidayRange.end]);

  const handleDayPress = async (day: DateData) => {
    const selected = day.dateString;

    if (selected < todayInJakarta || holidayMap[selected]) {
      return;
    }

    if (!startDate || endDate) {
      setValue('startDate', selected, { shouldValidate: true });
      setValue('endDate', '', { shouldValidate: true });
      clearErrors(['startDate', 'endDate']);
      const range = getMonthRange(formatMonthKey(selected));
      void fetchHolidays(range.start, range.end);
      return;
    }

    if (selected < startDate) {
      setValue('startDate', selected, { shouldValidate: true });
      setValue('endDate', '', { shouldValidate: true });
      clearErrors(['startDate', 'endDate']);
      const range = getMonthRange(formatMonthKey(selected));
      void fetchHolidays(range.start, range.end);
      return;
    }

    const holidaysInRange = await fetchHolidays(startDate, selected);

    if (holidaysInRange.length > 0) {
      showToast('error', 'Selected range includes a holiday.');
      return;
    }

    setValue('endDate', selected, { shouldValidate: true });
    clearErrors(['startDate', 'endDate']);
    setPickerOpen(false);
  };

  const handleMonthChange = (month: DateData) => {
    const range = getMonthRange(formatMonthKey(month.dateString));
    if (startDate && !endDate) {
      const rangeStart = startDate < range.start ? startDate : range.start;
      const rangeEnd = startDate > range.end ? startDate : range.end;
      void fetchHolidays(rangeStart, rangeEnd);
      return;
    }
    void fetchHolidays(range.start, range.end);
  };

  const handleClearDates = () => {
    setValue('startDate', '', { shouldValidate: true });
    setValue('endDate', '', { shouldValidate: true });
    clearErrors(['startDate', 'endDate']);
    const range = getMonthRange(formatMonthKey(todayInJakarta));
    void fetchHolidays(range.start, range.end);
  };

  const handlePickAttachment = async () => {
    try {
      const file = await DocumentPicker.pickSingle({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.images,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
        ],
        copyTo: 'cachesDirectory',
      });
      const uri = file.fileCopyUri ?? file.uri;
      if (!uri) {
        showToast('error', 'Unable to read the selected file.');
        return;
      }
      const name = file.name ?? 'attachment';
      const type = file.type ?? 'application/octet-stream';
      setAttachment({ uri, name, type });
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return;
      }
      showToast('error', getErrorMessage(error));
    }
  };

  const handleClearAttachment = () => {
    setAttachment(null);
  };

  return (
    <Screen scroll>
      <View className="gap-6">
        <View>
          <Text className="text-2xl font-bold text-ink-700">New Leave</Text>
          <Text className="text-base text-ink-500">
            Provide details for your leave request.
          </Text>
        </View>
        {quotaQuery.data ? (
          <View className="rounded-2xl bg-brand-50 p-4">
            <Text className="text-sm text-ink-600">
              Leave quota: {quotaQuery.data.remaining} remaining of{' '}
              {quotaQuery.data.total}
            </Text>
          </View>
        ) : null}
        <View className="gap-4">
          <FormSelect
            control={control}
            name="leaveTypeId"
            label="Leave type"
            placeholder="Choose a leave type"
            options={leaveTypeOptions}
          />
          <DateField
            label="Start date"
            value={startDate}
            placeholder="Select start date"
            error={errors.startDate?.message}
            onPress={() => setPickerOpen(true)}
          />
          <DateField
            label="End date"
            value={endDate}
            placeholder="Select end date"
            error={errors.endDate?.message}
            onPress={() => setPickerOpen(true)}
          />
          <FormInput
            control={control}
            name="reason"
            label="Reason"
            placeholder="Why do you need leave?"
            multiline
          />
          <View className="gap-2">
            <Text className="text-sm font-medium text-ink-600">
              Attachment (optional)
            </Text>
            <Button
              label={attachment ? 'Change file' : 'Upload file'}
              variant="secondary"
              onPress={handlePickAttachment}
            />
            {attachment ? (
              <View className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3">
                <Text className="flex-1 text-sm text-ink-700" numberOfLines={1}>
                  {attachment.name}
                </Text>
                <Pressable onPress={handleClearAttachment}>
                  <Text className="text-sm font-semibold text-rose-600">
                    Remove
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text className="text-xs text-ink-500">
                Accepts PDF, images, or Word documents.
              </Text>
            )}
          </View>
        </View>
        <Button
          label={mutation.isPending ? 'Submitting...' : 'Submit Leave'}
          onPress={handleSubmit(onSubmit)}
          loading={mutation.isPending}
        />
      </View>
      <Modal visible={isPickerOpen} transparent animationType="fade">
        <View className="flex-1 justify-center bg-black/40 px-4">
          <View className="rounded-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-ink-700">
              Select leave dates
            </Text>
            <Text className="text-sm text-ink-500">
              Tap a start date, then an end date. Holidays are disabled.
            </Text>
            <View className="mt-4">
              <Calendar
                markingType="period"
                minDate={todayInJakarta}
                markedDates={markedDates}
                onMonthChange={handleMonthChange}
                dayComponent={({ date, state, marking }) => {
                  if (!date) {
                    return null;
                  }
                  const isHoliday = Boolean(holidayMap[date.dateString]);
                  const isDisabled = state === 'disabled' || isHoliday;
                  const isRange =
                    Boolean(marking?.startingDay) ||
                    Boolean(marking?.endingDay) ||
                    Boolean(marking?.color);
                  const backgroundColor = isRange
                    ? marking?.startingDay || marking?.endingDay
                      ? '#b4d2ff'
                      : '#eef6ff'
                    : 'transparent';
                  const dayColor = isHoliday
                    ? '#dc2626'
                    : state === 'disabled'
                    ? '#94a3b8'
                    : '#1e2a3a';

                  return (
                    <Pressable
                      className="items-center justify-center py-1"
                      onPress={() => handleDayPress(date)}
                      disabled={isDisabled}
                      style={{ backgroundColor, borderRadius: 12 }}
                    >
                      <Text
                        className="text-base font-semibold"
                        style={{ color: dayColor }}
                      >
                        {date.day}
                      </Text>
                      {isHoliday ? (
                        <Text className="text-[10px]" style={{ color: dayColor }}>
                          {formatDayName(date.dateString)}
                        </Text>
                      ) : (
                        <Text className="text-[10px] text-transparent">-</Text>
                      )}
                    </Pressable>
                  );
                }}
              />
            </View>
            <View className="mt-4 flex-row gap-3">
              <Button
                label="Clear"
                variant="secondary"
                onPress={handleClearDates}
                className="flex-1"
              />
              <Button
                label="Done"
                onPress={() => setPickerOpen(false)}
                className="flex-1"
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};
