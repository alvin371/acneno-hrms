import { FlatList, Pressable, Text, View } from 'react-native';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { FormInput } from '@/ui/FormInput';
import { FormDatePicker } from '@/ui/FormDatePicker';
import { FormTimePicker } from '@/ui/FormTimePicker';
import { FormSelect } from '@/ui/FormSelect';
import { FormFilePicker } from '@/ui/FormFilePicker';
import { Card } from '@/ui/Card';
import { StatusChip } from '@/ui/StatusChip';
import {
  createOvertime,
  getOvertimes,
  getOvertimeTypes,
  uploadOvertimeAttachment,
} from '@/features/overtime/api';
import { statusToVariant, formatDurationHours } from '@/features/overtime/utils';
import { showToast } from '@/utils/toast';
import { showErrorModal } from '@/utils/errorModal';
import { getErrorMessage } from '@/api/error';
import { queryClient } from '@/lib/queryClient';
import { env } from '@/config/env';
import type { OvertimeStackParamList } from '@/navigation/types';

const formatDateUTC = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayInJakarta = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return formatDateUTC(new Date());
  }
};

const schema = z.object({
  overtimeTypeId: z.string().min(1, 'Overtime type is required'),
  overtimeDate: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  reason: z.string().min(1, 'Reason is required'),
  attachmentPath: z.string().min(1, 'Attachment is required'),
});

type FormValues = z.infer<typeof schema>;

type Props = NativeStackScreenProps<OvertimeStackParamList, 'OvertimeRequest'>;

const palette = {
  blue: '#1E88E5',
  lightBlue: '#E3F2FD',
  gray: '#6B7280',
  ink: '#1a1a1a',
  white: '#ffffff',
};

const ClockIcon = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
    <Path
      d="M12 7v5l3 3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BackArrow = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlusIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M5 12h14"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
    />
  </Svg>
);

const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return { hours: 0, minutes: 0 };

  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  let durationMinutes = endTotalMinutes - startTotalMinutes;
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }

  return {
    hours: Math.floor(durationMinutes / 60),
    minutes: durationMinutes % 60,
  };
};

export const OvertimeRequestScreen = ({ navigation }: Props) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const insets = useSafeAreaInsets();
  const todayInJakarta = useMemo(() => getTodayInJakarta(), []);

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      overtimeTypeId: '',
      overtimeDate: '',
      startTime: '',
      endTime: '',
      reason: '',
      attachmentPath: '',
    },
  });

  const startTime = useWatch({ control, name: 'startTime' });
  const endTime = useWatch({ control, name: 'endTime' });

  const duration = useMemo(
    () => calculateDuration(startTime, endTime),
    [startTime, endTime]
  );

  const { data: overtimeTypes } = useQuery({
    queryKey: ['overtime-types'],
    queryFn: getOvertimeTypes,
  });

  const overtimeTypeOptions = useMemo(() => {
    if (!overtimeTypes) return [];
    return overtimeTypes.map((type) => ({
      label: type.name,
      value: String(type.id),
    }));
  }, [overtimeTypes]);

  const { data: overtimes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['overtime'],
    queryFn: () => getOvertimes(),
  });

  const mutation = useMutation({
    mutationFn: createOvertime,
    onSuccess: () => {
      showToast('success', 'Overtime request submitted successfully.');
      queryClient.invalidateQueries({ queryKey: ['overtime'] });
      reset();
      setActiveTab('history');
    },
    onError: (error) => showErrorModal(getErrorMessage(error)),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadOvertimeAttachment,
    onError: (error) => showErrorModal(getErrorMessage(error)),
  });

  const resolveAttachmentPath = (value: string) => {
    if (!value) return value;
    if (/^https?:\/\//i.test(value)) return value;
    const baseOrigin = new URL(env.API_BASE_URL).origin;
    const normalizedPath = value.startsWith('/') ? value.slice(1) : value;
    return `${baseOrigin}/${normalizedPath}`;
  };

  const handleAttachmentPick = async (
    file: { uri: string; name?: string | null; type?: string | null; size?: number | null }
  ) => {
    try {
      const maxSizeBytes = 2 * 1024 * 1024;
      if (file.size && file.size > maxSizeBytes) {
        showErrorModal('File size must be 2MB or less.');
        return undefined;
      }

      const lowerName = (file.name || '').toLowerCase();
      const isAllowedType =
        file.type === 'application/pdf' ||
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        lowerName.endsWith('.pdf') ||
        lowerName.endsWith('.jpg') ||
        lowerName.endsWith('.jpeg') ||
        lowerName.endsWith('.png');

      if (!isAllowedType) {
        showErrorModal('Only PDF, JPG, JPEG, or PNG files are allowed.');
        return undefined;
      }

      const uploaded = await uploadMutation.mutateAsync({
        uri: file.uri,
        name: file.name,
        type: file.type,
      });

      return { value: uploaded.path, fileName: uploaded.originalName };
    } catch {
      return undefined;
    }
  };

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      overtimeTypeId: Number(values.overtimeTypeId),
      overtimeDate: values.overtimeDate,
      startTime: values.startTime,
      endTime: values.endTime,
      reason: values.reason,
      attachment: resolveAttachmentPath(values.attachmentPath.trim()),
    });
  };

  const renderHistoryItem = ({ item }: { item: NonNullable<typeof overtimes>[number] }) => (
    <Pressable
      onPress={() => navigation.navigate('OvertimeDetail', { id: item.id })}
    >
      <Card className="gap-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-semibold text-ink-700">
              {item.overtimeTypeName}
            </Text>
            <Text className="text-xs text-ink-500">
              {item.overtimeDate} - {formatDurationHours(item.durationHours)}
            </Text>
          </View>
          <StatusChip label={item.status} variant={statusToVariant(item.status)} />
        </View>
        <Text className="text-sm text-ink-500" numberOfLines={2}>
          {item.reason}
        </Text>
      </Card>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => navigation.goBack()} className="mr-4">
          <BackArrow color={palette.ink} />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-semibold text-ink-700">
          Overtime Request
        </Text>
        <View className="w-6" />
      </View>

      <View className="flex-row border-b border-slate-200 px-4">
        <Pressable
          onPress={() => setActiveTab('new')}
          className="mr-6 pb-3"
          style={{
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'new' ? palette.blue : 'transparent',
          }}
        >
          <Text
            className="text-sm font-medium"
            style={{ color: activeTab === 'new' ? palette.blue : palette.gray }}
          >
            New Request
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('history')}
          className="pb-3"
          style={{
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'history' ? palette.blue : 'transparent',
          }}
        >
          <Text
            className="text-sm font-medium"
            style={{ color: activeTab === 'history' ? palette.blue : palette.gray }}
          >
            Request History
          </Text>
        </Pressable>
      </View>

      {activeTab === 'new' ? (
        <Screen scroll>
          <View className="gap-4">
            <FormSelect
              control={control}
              name="overtimeTypeId"
              label="Overtime Type"
              placeholder="Select overtime type"
              options={overtimeTypeOptions}
            />

            <FormDatePicker
              control={control}
              name="overtimeDate"
              label="Select Date"
              placeholder="YYYY-MM-DD"
              minimumDate={todayInJakarta}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <FormTimePicker
                  control={control}
                  name="startTime"
                  label="Start Time"
                  placeholder="Select time"
                />
              </View>
              <View className="flex-1">
                <FormTimePicker
                  control={control}
                  name="endTime"
                  label="End Time"
                  placeholder="Select time"
                />
              </View>
            </View>

            <View
              className="flex-row items-center rounded-2xl p-4"
              style={{ backgroundColor: palette.lightBlue }}
            >
              <View className="flex-row items-center gap-3">
                <ClockIcon color={palette.blue} />
                <View>
                  <Text className="text-xs font-medium uppercase text-ink-500">
                    Total Duration
                  </Text>
                  <Text className="text-lg font-bold text-ink-700">
                    {duration.hours} hrs {duration.minutes} mins
                  </Text>
                </View>
              </View>
            </View>

            <FormInput
              control={control}
              name="reason"
              label="Reason"
              placeholder="Describe why you need overtime..."
              multiline
            />

            <FormFilePicker
              control={control}
              name="attachmentPath"
              label="Attachment"
              placeholder="No file selected"
              helperText="PDF, JPG, JPEG, or PNG. Max 2MB."
              loading={uploadMutation.isPending}
              onPick={handleAttachmentPick}
            />

            <Button
              label={
                uploadMutation.isPending
                  ? 'Uploading...'
                  : mutation.isPending
                    ? 'Submitting...'
                    : 'Submit Request >'
              }
              onPress={handleSubmit(onSubmit)}
              loading={mutation.isPending || uploadMutation.isPending}
              className="mt-2"
              style={{ backgroundColor: palette.blue }}
            />
          </View>
        </Screen>
      ) : (
        <View className="flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center p-4">
              <Text className="text-base text-ink-500">Loading...</Text>
            </View>
          ) : overtimes && overtimes.length > 0 ? (
            <FlatList
              data={overtimes}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderHistoryItem}
              contentContainerStyle={{ padding: 16, gap: 12 }}
              refreshing={isRefetching}
              onRefresh={refetch}
            />
          ) : (
            <View className="flex-1 items-center justify-center p-4">
              <Text className="text-base text-ink-500">
                No overtime requests yet.
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => setActiveTab('new')}
            className="absolute items-center justify-center rounded-full shadow-lg"
            style={{
              backgroundColor: palette.blue,
              width: 56,
              height: 56,
              bottom: insets.bottom + 16,
              right: 16,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }}
          >
            <PlusIcon color={palette.white} />
          </Pressable>
        </View>
      )}
    </View>
  );
};
