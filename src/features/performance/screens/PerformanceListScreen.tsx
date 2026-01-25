import { Pressable, Text, View } from 'react-native';
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { StatusChip } from '@/ui/StatusChip';
import { EmptyState } from '@/ui/EmptyState';
import { LoadingSkeleton } from '@/ui/LoadingSkeleton';
import { ScoreBadge } from '@/ui/ScoreBadge';
import {
  cancelPerformanceSubmission,
  getActiveTemplate,
  getPerformanceSubmissions,
} from '@/features/performance/api';
import { statusToVariant } from '@/features/performance/utils';
import { showErrorModal } from '@/utils/errorModal';
import { showToast } from '@/utils/toast';
import { getErrorMessage } from '@/api/error';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PerformanceStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<
  PerformanceStackParamList,
  'PerformanceList'
>;

const isCancelableStatus = (status: string) => status === 'SUBMITTED';

export const PerformanceListScreen = ({ navigation }: Props) => {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['performance-submissions'],
    queryFn: () => getPerformanceSubmissions(),
  });

  const {
    data: template,
    error: templateError,
    isLoading: isTemplateLoading,
    refetch: refetchTemplate,
  } = useQuery({
    queryKey: ['performance-template', currentYear],
    queryFn: () => getActiveTemplate(currentYear),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelPerformanceSubmission,
    onSuccess: (response) => {
      showToast('success', response?.message || 'Submission cancelled.');
      queryClient.invalidateQueries({ queryKey: ['performance-submissions'] });
    },
    onError: (mutationError) => showErrorModal(getErrorMessage(mutationError)),
  });

  useEffect(() => {
    if (error) {
      showErrorModal(getErrorMessage(error));
    }
  }, [error]);

  useEffect(() => {
    if (templateError) {
      showErrorModal(getErrorMessage(templateError));
    }
  }, [templateError]);

  const handleRefresh = () => {
    refetch();
    refetchTemplate();
  };

  return (
    <Screen scroll refreshing={isRefetching} onRefresh={handleRefresh}>
      <View className="gap-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-bold text-ink-700">
              Performance Appraisal
            </Text>
            <Text className="text-base text-ink-500">
              Track your submissions and scores.
            </Text>
          </View>
          <Button
            label={isTemplateLoading ? 'Checking...' : 'New'}
            onPress={() => navigation.navigate('PerformanceCreate')}
            disabled={!template || isTemplateLoading}
          />
        </View>

        {!template && !isTemplateLoading ? (
          <EmptyState
            icon="calendar-outline"
            title="No Active Template"
            description={`No appraisal template available for ${currentYear}. Check back later.`}
          />
        ) : null}

        {isLoading ? (
          <LoadingSkeleton count={3} />
        ) : data && data.length > 0 ? (
          <View className="gap-4">
            {data.map((record) => (
              <Pressable
                key={record.id}
                onPress={() =>
                  navigation.navigate('PerformanceDetail', { id: record.id })
                }
              >
                <Card className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-base font-semibold text-ink-700">
                      {record.template_name}
                    </Text>
                    <StatusChip
                      label={record.status}
                      variant={statusToVariant(record.status)}
                    />
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-ink-500">
                      Period: {record.period_year}
                    </Text>
                    <ScoreBadge score={record.total_score} size="md" />
                  </View>
                  {isCancelableStatus(record.status) && (
                    <View className="flex-row justify-end">
                      <Button
                        label="Cancel Submission"
                        variant="secondary"
                        onPress={() => cancelMutation.mutate(record.id)}
                        loading={cancelMutation.isPending && cancelMutation.variables === record.id}
                        disabled={cancelMutation.isPending}
                      />
                    </View>
                  )}
                </Card>
              </Pressable>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="clipboard-outline"
            title="No Submissions Yet"
            description="Start your first appraisal to track your performance."
          />
        )}
      </View>
    </Screen>
  );
};
