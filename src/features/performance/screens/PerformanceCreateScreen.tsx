import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { FormInput } from '@/ui/FormInput';
import { EmptyState } from '@/ui/EmptyState';
import { LoadingSkeleton } from '@/ui/LoadingSkeleton';
import { ScoreBadge } from '@/ui/ScoreBadge';
import { createPerformanceSubmission, getActiveTemplate } from '@/features/performance/api';
import {
  calculateScorePreview,
  calculateTotalScore,
  formatScore,
} from '@/features/performance/utils';
import { showToast } from '@/utils/toast';
import { getErrorMessage } from '@/api/error';
import { queryClient } from '@/lib/queryClient';
import type { PerformanceStackParamList } from '@/navigation/types';
import type { PerformanceTemplateItem } from '@/api/types';

const formSchema = z.object({
  items: z.array(
    z.object({
      templateItemId: z.union([z.number(), z.string()]),
      actualValue: z.string().min(1, 'Value is required'),
    })
  ),
});

type FormValues = z.infer<typeof formSchema>;

type Props = NativeStackScreenProps<PerformanceStackParamList, 'PerformanceCreate'>;

const ItemScorePreview = ({
  actualValue,
  templateItem,
}: {
  actualValue: number | string;
  templateItem: PerformanceTemplateItem;
}) => {
  const numericValue =
    typeof actualValue === 'string' ? parseFloat(actualValue) || 0 : actualValue || 0;
  const { scoreRatio, finalScore } = calculateScorePreview(
    numericValue,
    templateItem.target_value,
    templateItem.weight
  );

  return (
    <View className="mt-2 flex-row items-center justify-between rounded-lg bg-slate-50 p-2">
      <Text className="text-xs text-ink-500">
        Score: {formatScore(scoreRatio * 100)}% of weight
      </Text>
      <Text className="text-sm font-semibold text-ink-700">
        +{formatScore(finalScore)} pts
      </Text>
    </View>
  );
};

export const PerformanceCreateScreen = ({ navigation }: Props) => {
  const currentYear = new Date().getFullYear();

  const {
    data: template,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['performance-template', currentYear],
    queryFn: () => getActiveTemplate(currentYear),
  });

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [],
    },
  });

  useFieldArray({
    control,
    name: 'items',
  });

  // Watch all items for total score calculation
  const watchedItems = useWatch({ control, name: 'items' });

  // Initialize form when template loads
  useEffect(() => {
    if (template && template.items.length > 0) {
      reset({
        items: template.items.map((item) => ({
          templateItemId: item.id,
          actualValue: '0',
        })),
      });
    }
  }, [template, reset]);

  const mutation = useMutation({
    mutationFn: createPerformanceSubmission,
    onSuccess: () => {
      showToast('success', 'Performance submission created successfully.');
      queryClient.invalidateQueries({ queryKey: ['performance-submissions'] });
      navigation.goBack();
    },
    onError: (err) => showToast('error', getErrorMessage(err)),
  });

  const onSubmit = (values: FormValues) => {
    if (!template) return;
    const payload = {
      templateId: template.id,
      items: values.items.map((item) => ({
        templateItemId:
          typeof item.templateItemId === 'string'
            ? parseInt(item.templateItemId, 10)
            : item.templateItemId,
        actualValue: parseFloat(item.actualValue) || 0,
      })),
    };
    console.log('Performance submission payload:', {
      template_id: payload.templateId,
      items: payload.items.map((item) => ({
        template_item_id: item.templateItemId,
        actual_value: item.actualValue,
      })),
    });
    mutation.mutate(payload);
  };

  const onFormError = (errors: any) => {
    console.log('Form validation errors:', errors);
    showToast('error', 'Please fill in all fields correctly');
  };

  // Calculate total score
  const totalScore = template
    ? calculateTotalScore(watchedItems || [], template.items)
    : 0;

  // Render loading state
  if (isLoading) {
    return (
      <Screen scroll>
        <View className="gap-6">
          <View>
            <Text className="text-2xl font-bold text-ink-700">New Submission</Text>
            <Text className="text-base text-ink-500">Loading template...</Text>
          </View>
          <LoadingSkeleton count={4} />
        </View>
      </Screen>
    );
  }

  // Render error/empty state
  if (error || !template) {
    return (
      <Screen scroll>
        <View className="gap-6">
          <View>
            <Text className="text-2xl font-bold text-ink-700">New Submission</Text>
            <Text className="text-base text-ink-500">Performance appraisal</Text>
          </View>
          <EmptyState
            icon="calendar-outline"
            title="No Active Template"
            description={
              error
                ? getErrorMessage(error)
                : `No appraisal template available for ${currentYear}. Please contact your administrator.`
            }
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View className="gap-6 pb-24">
        {/* Header */}
        <View>
          <Text className="text-2xl font-bold text-ink-700">New Submission</Text>
          <Text className="text-base text-ink-500">
            Fill in your actual values for each objective
          </Text>
        </View>

        {/* Template Info Card */}
        <Card className="gap-2">
          <Text className="text-lg font-semibold text-ink-700">{template.name}</Text>
          <View className="flex-row flex-wrap gap-2">
            <View className="rounded-full bg-blue-100 px-3 py-1">
              <Text className="text-xs font-medium text-blue-700">
                {template.period_year}
              </Text>
            </View>
            <View className="rounded-full bg-purple-100 px-3 py-1">
              <Text className="text-xs font-medium text-purple-700">
                {template.department}
              </Text>
            </View>
            {template.role_display_name && (
              <View className="rounded-full bg-emerald-100 px-3 py-1">
                <Text className="text-xs font-medium text-emerald-700">
                  {template.role_display_name}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Score Preview Card */}
        <Card className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-ink-500">Estimated Total Score</Text>
            <Text className="text-xs text-ink-400">Based on current values</Text>
          </View>
          <ScoreBadge score={totalScore} size="lg" />
        </Card>

        {/* Template Item Cards */}
        <View className="gap-4">
          {template.items.map((templateItem, index) => {
            const itemValue = watchedItems?.[index]?.actualValue || '0';

            return (
              <Card key={templateItem.id} className="gap-3">
                {/* Order & KPI badges */}
                <View className="flex-row items-center gap-2">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-ink-100">
                    <Text className="text-xs font-bold text-ink-600">
                      {templateItem.order_no}
                    </Text>
                  </View>
                  {templateItem.kpi && (
                    <View className="rounded-full bg-amber-100 px-2 py-1">
                      <Text className="text-xs font-medium text-amber-700">
                        {templateItem.kpi}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Objective */}
                <Text className="text-base font-medium text-ink-700">
                  {templateItem.objective}
                </Text>

                {/* Target & Weight info */}
                <View className="flex-row gap-4">
                  <View className="flex-1 rounded-lg bg-slate-50 p-2">
                    <Text className="text-xs text-ink-400">Target</Text>
                    <Text className="text-sm font-semibold text-ink-700">
                      {templateItem.target_value}
                      {templateItem.unit ? ` ${templateItem.unit}` : ''}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-lg bg-slate-50 p-2">
                    <Text className="text-xs text-ink-400">Weight</Text>
                    <Text className="text-sm font-semibold text-ink-700">
                      {templateItem.weight} pts
                    </Text>
                  </View>
                </View>

                {/* Input for actual value */}
                <FormInput
                  control={control}
                  name={`items.${index}.actualValue`}
                  label="Your Actual Value"
                  keyboardType="numeric"
                />

                {/* Score preview for this item */}
                <ItemScorePreview actualValue={itemValue} templateItem={templateItem} />
              </Card>
            );
          })}
        </View>

        {/* Submit Button */}
        <Button
          label={mutation.isPending ? 'Submitting...' : 'Submit Performance'}
          onPress={handleSubmit(onSubmit, onFormError)}
          loading={mutation.isPending}
        />
      </View>
    </Screen>
  );
};
