import { Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { FormInput } from '@/ui/FormInput';
import { FormSelect } from '@/ui/FormSelect';
import { createLeave, getLeaveQuota } from '@/features/leave/api';
import { showToast } from '@/utils/toast';
import { getErrorMessage } from '@/api/error';
import { queryClient } from '@/lib/queryClient';
import type { LeaveStackParamList } from '@/navigation/types';

const schema = z
  .object({
    leaveTypeId: z.string().min(1, 'Select a leave type'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z.string().min(1, 'Reason is required'),
    attachmentUri: z.string().optional().nullable(),
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

export const LeaveCreateScreen = ({ navigation }: Props) => {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      reason: '',
      attachmentUri: '',
    },
  });

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
      attachmentUri: values.attachmentUri?.trim() || undefined,
    });
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
          <FormInput
            control={control}
            name="startDate"
            label="Start date"
            placeholder="YYYY-MM-DD"
          />
          <FormInput
            control={control}
            name="endDate"
            label="End date"
            placeholder="YYYY-MM-DD"
          />
          <FormInput
            control={control}
            name="reason"
            label="Reason"
            placeholder="Why do you need leave?"
            multiline
          />
          <FormInput
            control={control}
            name="attachmentUri"
            label="Attachment (optional)"
            placeholder="Paste file URI if available"
          />
        </View>
        <Button
          label={mutation.isPending ? 'Submitting...' : 'Submit Leave'}
          onPress={handleSubmit(onSubmit)}
          loading={mutation.isPending}
        />
      </View>
    </Screen>
  );
};
