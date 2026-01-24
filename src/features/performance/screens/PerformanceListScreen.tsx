import { Pressable, Text, View } from 'react-native';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { StatusChip } from '@/ui/StatusChip';
import { EmptyState } from '@/ui/EmptyState';
import { LoadingSkeleton } from '@/ui/LoadingSkeleton';
import { ScoreBadge } from '@/ui/ScoreBadge';
import {
  getActiveTemplate,
  getPerformanceSubmissions,
} from '@/features/performance/api';
import { statusToVariant } from '@/features/performance/utils';
import { showErrorModal } from '@/utils/errorModal';
import { getErrorMessage } from '@/api/error';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PerformanceStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<
  PerformanceStackParamList,
  'PerformanceList'
>;

export const PerformanceListScreen = ({ navigation }: Props) => {
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
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-base font-semibold text-ink-700">
                        {record.template_name}
                      </Text>
                      <Text className="text-sm text-ink-500">
                        Period: {record.period_year}
                      </Text>
                    </View>
                    <ScoreBadge score={record.total_score} size="md" />
                  </View>
                  <StatusChip
                    label={record.status}
                    variant={statusToVariant(record.status)}
                  />
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
