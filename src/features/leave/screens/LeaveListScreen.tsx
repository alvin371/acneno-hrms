import { Text, View } from 'react-native';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { StatusChip } from '@/ui/StatusChip';
import { getLeaves } from '@/features/leave/api';
import { getErrorMessage } from '@/api/error';
import { showToast } from '@/utils/toast';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LeaveStackParamList } from '@/navigation/types';

const statusToVariant = (status: string) => {
  switch (status) {
    case 'Approved':
      return 'approved';
    case 'Rejected':
      return 'rejected';
    default:
      return 'pending';
  }
};

type Props = NativeStackScreenProps<LeaveStackParamList, 'LeaveList'>;

export const LeaveListScreen = ({ navigation }: Props) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['leave'],
    queryFn: getLeaves,
  });

  useEffect(() => {
    if (error) {
      showToast('error', getErrorMessage(error));
    }
  }, [error]);

  return (
    <Screen scroll>
      <View className="gap-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-ink-700">Leave</Text>
            <Text className="text-base text-ink-500">
              Track your leave applications and status.
            </Text>
          </View>
          <Button label="Apply" onPress={() => navigation.navigate('LeaveCreate')} />
        </View>
        {isLoading ? (
          <Card>
            <Text className="text-base text-ink-500">Loading leave data...</Text>
          </Card>
        ) : data && data.length > 0 ? (
          <View className="gap-4">
            {data.map((leave) => (
              <Card key={leave.id} className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-ink-700">
                    {leave.leaveType}
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
              </Card>
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
