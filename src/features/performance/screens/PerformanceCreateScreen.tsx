import { Text, View } from 'react-native';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { FormInput } from '@/ui/FormInput';
import { Card } from '@/ui/Card';
import { LoadingSkeleton } from '@/ui/LoadingSkeleton';
import { EmptyState } from '@/ui/EmptyState';
import {
  createPerformanceSubmission,
  getActiveTemplate,
} from '@/features/performance/api';
import { showToast } from '@/utils/toast';
import { showErrorModal } from '@/utils/errorModal';
import { getErrorMessage } from '@/api/error';
import { queryClient } from '@/lib/queryClient';
import type { PerformanceStackParamList } from '@/navigation/types';

const schema = z.object({
  items: z
    .array(
      z.object({
        template_item_id: z.coerce.number(),
        actual_value: z.coerce.number().min(0, 'Actual value must be 0 or more'),
      })
    )
    .min(1, 'No appraisal items available'),
});

type FormValues = z.infer<typeof schema>;

type Props = NativeStackScreenProps<
  PerformanceStackParamList,
  'PerformanceCreate'
>;

export const PerformanceCreateScreen = ({ navigation }: Props) => {
  const currentYear = new Date().getFullYear();

  const {
    data: template,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['performance-template', currentYear],
    queryFn: () => getActiveTemplate(currentYear),
  });

  const sortedItems = useMemo(() => {
    if (!template?.items) return [];
    return [...template.items].sort((a, b) => a.order_no - b.order_no);
  }, [template?.items]);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      items: [],
    },
  });

  useEffect(() => {
    if (sortedItems.length > 0) {
      reset({
        items: sortedItems.map((item) => ({
          template_item_id: Number(item.id),
          actual_value: 0,
        })),
      });
    }
  }, [sortedItems, reset]);

  useEffect(() => {
    if (error) {
      showErrorModal(getErrorMessage(error));
    }
  }, [error]);

  const mutation = useMutation({
    mutationFn: createPerformanceSubmission,
    onSuccess: () => {
      showToast('success', 'Performance appraisal submitted.');
      queryClient.invalidateQueries({ queryKey: ['performance-submissions'] });
      navigation.goBack();
    },
    onError: (err) => showErrorModal(getErrorMessage(err)),
  });

  const onSubmit = (values: FormValues) => {
    if (!template) {
      showErrorModal('No active template available.');
      return;
    }
    mutation.mutate({
      templateId: template.id,
      items: values.items.map((item) => ({
        templateItemId: Number(item.template_item_id),
        actualValue: Number(item.actual_value),
      })),
    });
  };

  return (
    <Screen scroll refreshing={isRefetching} onRefresh={refetch}>
      <View className="gap-6">
        <View>
          <Text className="text-2xl font-bold text-ink-700">New Appraisal</Text>
          <Text className="text-base text-ink-500">
            Provide your actual results for each objective.
          </Text>
        </View>

        {isLoading ? (
          <LoadingSkeleton count={3} />
        ) : template ? (
          <View className="gap-4">
            <Card className="gap-2">
              <Text className="text-base font-semibold text-ink-700">
                {template.name}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-ink-500">
                  Period: {template.period_year}
                </Text>
                <View className="h-1 w-1 rounded-full bg-ink-300" />
                <Text className="text-sm text-ink-500">
                  {template.department}
                </Text>
              </View>
              <Text className="text-sm text-ink-500">
                Role:{' '}
                {template.employee_role_name ??
                  template.role_display_name ??
                  'Unassigned'}
              </Text>
            </Card>

            {sortedItems.map((item, index) => (
              <Card key={item.id} className="gap-3">
                <View className="flex-row items-center justify-between">
                  <View className="rounded-full bg-slate-100 px-2 py-0.5">
                    <Text className="text-xs font-medium text-ink-500">
                      #{item.order_no}
                    </Text>
                  </View>
                  {item.kpi && (
                    <View className="rounded-full bg-blue-50 px-2 py-0.5">
                      <Text className="text-xs font-medium text-blue-700">
                        {item.kpi}
                      </Text>
                    </View>
                  )}
                </View>
                <View>
                  <Text className="text-sm text-ink-500">Objective</Text>
                  <Text className="text-base font-semibold text-ink-700">
                    {item.objective}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-xs text-ink-500">Target</Text>
                    <Text className="text-sm font-medium text-ink-600">
                      {item.target_value}
                      {item.unit ? ` ${item.unit}` : ''}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-ink-500">Weight</Text>
                    <Text className="text-sm font-medium text-ink-600">
                      {item.weight}%
                    </Text>
                  </View>
                </View>
                <FormInput
                  control={control}
                  name={`items.${index}.actual_value` as const}
                  label="Actual value"
                  placeholder="0"
                  keyboardType="numeric"
                />
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="document-text-outline"
            title="No Active Template"
            description={`No appraisal template found for ${currentYear}.`}
          />
        )}

        <Button
          label={mutation.isPending ? 'Submitting...' : 'Submit Appraisal'}
          onPress={handleSubmit(onSubmit)}
          loading={mutation.isPending}
          disabled={!template || isLoading}
        />
      </View>
    </Screen>
  );
};
