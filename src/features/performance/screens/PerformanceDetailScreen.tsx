import { Text, View } from 'react-native';
import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@/ui/Screen';
import { Card } from '@/ui/Card';
import { StatusChip } from '@/ui/StatusChip';
import { LoadingSkeleton } from '@/ui/LoadingSkeleton';
import { EmptyState } from '@/ui/EmptyState';
import { ScoreBadge } from '@/ui/ScoreBadge';
import {
  getActiveTemplate,
  getPerformanceSubmission,
} from '@/features/performance/api';
import { formatScore, statusToVariant } from '@/features/performance/utils';
import { getErrorMessage } from '@/api/error';
import { showErrorModal } from '@/utils/errorModal';
import type { PerformanceStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<
  PerformanceStackParamList,
  'PerformanceDetail'
>;

export const PerformanceDetailScreen = ({ route }: Props) => {
  const { id } = route.params;

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['performance-submission', id],
    queryFn: () => getPerformanceSubmission(id),
  });

  const { data: template } = useQuery({
    queryKey: ['performance-template', data?.period_year],
    queryFn: () => getActiveTemplate(data?.period_year),
    enabled: !!data?.period_year,
  });

  const getTemplateItem = useMemo(() => {
    if (!template?.items) return () => undefined;
    const itemMap = new Map(template.items.map((item) => [item.id, item]));
    return (templateItemId: number) => itemMap.get(templateItemId);
  }, [template?.items]);

  useEffect(() => {
    if (error) {
      showErrorModal(getErrorMessage(error));
    }
  }, [error]);

  return (
    <Screen scroll refreshing={isRefetching} onRefresh={refetch}>
      <View className="gap-6">
        <View>
          <Text className="text-2xl font-bold text-ink-700">
            Submission Detail
          </Text>
          <Text className="text-base text-ink-500">
            Review your submitted appraisal scores.
          </Text>
        </View>

        {isLoading ? (
          <LoadingSkeleton count={3} />
        ) : data ? (
          <View className="gap-4">
            <Card className="gap-3">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-semibold text-ink-700">
                    {data.template_name}
                  </Text>
                  <Text className="text-sm text-ink-500">
                    Period: {data.period_year}
                  </Text>
                </View>
                <ScoreBadge score={data.total_score} size="lg" />
              </View>
              <StatusChip
                label={data.status}
                variant={statusToVariant(data.status)}
              />
            </Card>

            {data.items.map((item) => {
              const templateItem = getTemplateItem(item.template_item_id);
              return (
                <Card key={item.id} className="gap-3">
                  <View className="flex-row items-center justify-between">
                    {templateItem?.order_no && (
                      <View className="rounded-full bg-slate-100 px-2 py-0.5">
                        <Text className="text-xs font-medium text-ink-500">
                          #{templateItem.order_no}
                        </Text>
                      </View>
                    )}
                    {templateItem?.kpi && (
                      <View className="rounded-full bg-blue-50 px-2 py-0.5">
                        <Text className="text-xs font-medium text-blue-700">
                          {templateItem.kpi}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-base font-semibold text-ink-700">
                    {item.objective}
                  </Text>
                  <View className="flex-row justify-between">
                    <View>
                      <Text className="text-xs text-ink-500">Target</Text>
                      <Text className="text-sm font-medium text-ink-600">
                        {item.target_value}
                        {templateItem?.unit ? ` ${templateItem.unit}` : ''}
                      </Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-xs text-ink-500">Actual</Text>
                      <Text className="text-sm font-medium text-ink-600">
                        {item.actual_value}
                        {templateItem?.unit ? ` ${templateItem.unit}` : ''}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-ink-500">Weight</Text>
                      <Text className="text-sm font-medium text-ink-600">
                        {item.weight}%
                      </Text>
                    </View>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between rounded-lg bg-slate-50 p-2">
                    <View>
                      <Text className="text-xs text-ink-500">Score Ratio</Text>
                      <Text className="text-sm font-semibold text-ink-700">
                        {formatScore(item.score_ratio * 100)}%
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-ink-500">Final Score</Text>
                      <ScoreBadge
                        score={item.final_score}
                        maxScore={item.weight}
                        size="sm"
                      />
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        ) : (
          <EmptyState
            icon="document-outline"
            title="Submission Not Found"
            description="The requested submission could not be found."
          />
        )}
      </View>
    </Screen>
  );
};
