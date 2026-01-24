import { Pressable, Text, View } from 'react-native';
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { StatusChip } from '@/ui/StatusChip';
import { cancelLeave, getLeaves } from '@/features/leave/api';
import { getErrorMessage } from '@/api/error';
import { showToast } from '@/utils/toast';
import { showErrorModal } from '@/utils/errorModal';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LeaveStackParamList } from '@/navigation/types';

const statusToVariant = (status: string) => {
  switch (status) {
    case 'Approved':
      return 'approved';
    case 'Rejected':
    case 'Cancelled':
    case 'CANCELLED':
      return 'rejected';
    case 'PENDING_APPROVAL':
    default:
      return 'pending';
  }
};

type Props = NativeStackScreenProps<LeaveStackParamList, 'LeaveList'>;

export const LeaveListScreen = ({ navigation }: Props) => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['leave'],
    queryFn: getLeaves,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelLeave,
    onSuccess: (response) => {
      showToast('success', response?.message || 'Leave request cancelled.');
      queryClient.invalidateQueries({ queryKey: ['leave'] });
    },
    onError: (mutationError) =>
      showErrorModal(getErrorMessage(mutationError)),
  });

  useEffect(() => {
    if (error) {
      showErrorModal(getErrorMessage(error));
    }
  }, [error]);

  const isCancelableStatus = (status: string) =>
    status === 'Pending' || status === 'PENDING_APPROVAL';

  return (
    <Screen scroll>
      <View className="gap-6">
        <View className="flex-row flex-wrap items-start gap-3">
          <View className="flex-1 pr-2">
            <Text className="text-2xl font-bold text-ink-700">Leave</Text>
            <Text className="text-base text-ink-500">
              Track your leave applications and status.
            </Text>
          </View>
          <Button
            label="Apply"
            onPress={() => navigation.navigate('LeaveCreate')}
            className="shrink-0"
          />
        </View>
        {isLoading ? (
          <Card>
            <Text className="text-base text-ink-500">Loading leave data...</Text>
          </Card>
        ) : data && data.length > 0 ? (
          <View className="gap-4">
            {data.map((leave) => (
              <Pressable
                key={leave.id}
                onPress={() => navigation.navigate('LeaveDetail', { id: leave.id })}
              >
                <Card className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-ink-700">
                      {leave.leaveTypeName}
                    </Text>
                    <StatusChip
                      label={leave.status}
                      variant={statusToVariant(leave.status)}
                    />
                  </View>
                  <Text className="text-sm text-ink-500">
                    {leave.startDate} - {leave.endDate}
                  </Text>
                  <Text className="text-sm text-ink-500">{leave.reason}</Text>
                  {isCancelableStatus(leave.status) ? (
                    <View className="flex-row justify-end">
                      <Button
                        label="Cancel"
                        variant="secondary"
                        onPress={() => cancelMutation.mutate(leave.id)}
                        loading={
                          cancelMutation.isPending &&
                          cancelMutation.variables === leave.id
                        }
                        disabled={cancelMutation.isPending}
                      />
                    </View>
                  ) : null}
                </Card>
              </Pressable>
            ))}
          </View>
        ) : (
          <Card>
            <Text className="text-base text-ink-500">
              No leave applications yet. Apply for your first leave.
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  );
};
