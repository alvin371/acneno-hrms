import { Text, View } from 'react-native';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { FormInput } from '@/ui/FormInput';
import { FormSelect } from '@/ui/FormSelect';
import { FormDatePicker } from '@/ui/FormDatePicker';
import { FormFilePicker } from '@/ui/FormFilePicker';
import {
  createLeave,
  getHolidays,
  getLeaveQuota,
  uploadLeaveAttachment,
} from '@/features/leave/api';
import { showToast } from '@/utils/toast';
import { showErrorModal } from '@/utils/errorModal';
import { getErrorMessage } from '@/api/error';
import { queryClient } from '@/lib/queryClient';
import type { LeaveStackParamList } from '@/navigation/types';
import { env } from '@/config/env';

const pad2 = (value: number) => String(value).padStart(2, '0');

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const getMonthRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: formatDate(start),
    end: formatDate(end),
  };
};

const isDateString = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const compareDateStrings = (left: string, right: string) =>
  left.localeCompare(right);

const schema = z
  .object({
    leaveTypeId: z.string().min(1, 'Select a leave type'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z.string().min(1, 'Reason is required'),
    attachmentPath: z.string().min(1, 'Attachment is required'),
  })
  .superRefine((values, context) => {
    const today = formatDate(new Date());

    if (isDateString(values.startDate)) {
      if (compareDateStrings(values.startDate, today) < 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start date cannot be in the past',
          path: ['startDate'],
        });
      }
    }

    if (isDateString(values.startDate) && isDateString(values.endDate)) {
      if (compareDateStrings(values.endDate, values.startDate) < 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date must be on or after start date',
          path: ['endDate'],
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

type Props = NativeStackScreenProps<LeaveStackParamList, 'LeaveCreate'>;

const leaveTypeOptions = [
  { label: 'Annual Leave', value: '1' },
  { label: 'Sick Leave', value: '2' },
  { label: 'Unpaid Leave', value: '3' },
];

export const LeaveCreateScreen = ({ navigation }: Props) => {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      reason: '',
      attachmentPath: '',
    },
  });

  const startDate = useWatch({ control, name: 'startDate' });
  const todayString = formatDate(new Date());
  const [holidayRange, setHolidayRange] = useState(() =>
    getMonthRange(new Date())
  );

  const quotaQuery = useQuery({
    queryKey: ['leave-quota'],
    queryFn: getLeaveQuota,
  });

  const holidaysQuery = useQuery({
    queryKey: ['holidays', holidayRange.start, holidayRange.end],
    queryFn: () =>
      getHolidays({ start: holidayRange.start, end: holidayRange.end }),
  });

  const holidayDates = useMemo(
    () =>
      holidaysQuery.data
        ? holidaysQuery.data.filter((holiday) => holiday.isHoliday)
            .map((holiday) => holiday.date)
        : [],
    [holidaysQuery.data]
  );

  const handleMonthChange = (dateString: string) => {
    const [year, month] = dateString.split('-').map(Number);
    if (!year || !month) {
      return;
    }
    setHolidayRange(getMonthRange(new Date(year, month - 1, 1)));
  };

  const mutation = useMutation({
    mutationFn: createLeave,
    onSuccess: () => {
      showToast('success', 'Leave submitted successfully.');
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      navigation.goBack();
    },
    onError: (error) => showErrorModal(getErrorMessage(error)),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadLeaveAttachment,
    onError: (error) => showErrorModal(getErrorMessage(error)),
  });

  const resolveAttachmentPath = (value: string) => {
    if (!value) {
      return value;
    }
    if (/^https?:\/\//i.test(value)) {
      return value;
    }
    const baseOrigin = new URL(env.API_BASE_URL).origin;
    const normalizedPath = value.startsWith('/') ? value.slice(1) : value;
    return `${baseOrigin}/${normalizedPath}`;
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      leaveTypeId: Number(values.leaveTypeId),
      attachment: resolveAttachmentPath(values.attachmentPath.trim()),
    };
    mutation.mutate(payload);
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
            <Text className="text-sm font-semibold text-ink-700">
              Leave quota
            </Text>
            <Text className="text-xs text-ink-500">
              {quotaQuery.data.summary.remainingDays} of{' '}
              {quotaQuery.data.summary.totalDays} remaining
            </Text>
            <View className="mt-3 gap-2">
              {quotaQuery.data.quotas.map((quota) => (
                <View
                  key={quota.id}
                  className="flex-row items-center justify-between"
                >
                  <Text className="text-sm text-ink-600">
                    {quota.leaveTypeName}
                  </Text>
                  <Text className="text-sm font-semibold text-ink-700">
                    {quota.remainingDays} / {quota.totalDays}
                  </Text>
                </View>
              ))}
            </View>
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
          <FormDatePicker
            control={control}
            name="startDate"
            label="Start date"
            placeholder="YYYY-MM-DD"
            minimumDate={todayString}
            holidayDates={holidayDates}
            onMonthChange={handleMonthChange}
          />
          <FormDatePicker
            control={control}
            name="endDate"
            label="End date"
            placeholder="YYYY-MM-DD"
            minimumDate={startDate || todayString}
            holidayDates={holidayDates}
            onMonthChange={handleMonthChange}
          />
          <FormInput
            control={control}
            name="reason"
            label="Reason"
            placeholder="Why do you need leave?"
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
        </View>
        <Button
          label={
            uploadMutation.isPending
              ? 'Uploading...'
              : mutation.isPending
                ? 'Submitting...'
                : 'Submit Leave'
          }
          onPress={handleSubmit(onSubmit)}
          loading={mutation.isPending || uploadMutation.isPending}
        />
      </View>
    </Screen>
  );
};
