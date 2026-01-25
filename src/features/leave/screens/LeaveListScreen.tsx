import { Pressable, Text, View } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Svg, { Path } from 'react-native-svg';
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

const ITEMS_PER_PAGE = 5;

const palette = {
  sand: '#d4d0c6',
  cream: '#f6f2ea',
  ivory: '#f1ece2',
  ink: '#1a1a1a',
  muted: '#6a6a66',
  wine: '#a3253b',
  rose: '#f4d7dd',
  white: '#ffffff',
  cardBorder: '#f3eee4',
};

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
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['leave'],
    queryFn: getLeaves,
  });

  const { paginatedData, totalPages } = useMemo(() => {
    if (!data || data.length === 0) {
      return { paginatedData: [], totalPages: 0 };
    }
    const total = Math.ceil(data.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return {
      paginatedData: data.slice(startIndex, endIndex),
      totalPages: total,
    };
  }, [data, currentPage]);

  useEffect(() => {
    if (data && currentPage > Math.ceil(data.length / ITEMS_PER_PAGE)) {
      setCurrentPage(1);
    }
  }, [data, currentPage]);

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
            {paginatedData.map((leave) => (
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

            {totalPages > 1 && (
              <View
                className="flex-row items-center justify-between px-4 py-3"
                style={{
                  backgroundColor: palette.white,
                  borderRadius: 28,
                  borderWidth: 1,
                  borderColor: palette.cardBorder,
                  shadowColor: palette.ink,
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 3,
                }}
              >
                <Pressable
                  onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    opacity: currentPage === 1 ? 0.4 : 1,
                  }}
                >
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor:
                        currentPage === 1 ? palette.cream : palette.wine,
                    }}
                  >
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M15 18l-6-6 6-6"
                        stroke={currentPage === 1 ? palette.muted : palette.white}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                </Pressable>

                <View className="flex-row items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Pressable
                        key={page}
                        onPress={() => setCurrentPage(page)}
                      >
                        <View
                          className="h-9 w-9 items-center justify-center rounded-full"
                          style={{
                            backgroundColor:
                              currentPage === page
                                ? palette.wine
                                : palette.cream,
                          }}
                        >
                          <Text
                            className="text-sm font-semibold"
                            style={{
                              color:
                                currentPage === page
                                  ? palette.white
                                  : palette.muted,
                            }}
                          >
                            {page}
                          </Text>
                        </View>
                      </Pressable>
                    )
                  )}
                </View>

                <Pressable
                  onPress={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  style={{
                    opacity: currentPage === totalPages ? 0.4 : 1,
                  }}
                >
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor:
                        currentPage === totalPages
                          ? palette.cream
                          : palette.wine,
                    }}
                  >
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M9 18l6-6-6-6"
                        stroke={
                          currentPage === totalPages
                            ? palette.muted
                            : palette.white
                        }
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                </Pressable>
              </View>
            )}

            <View
              className="flex-row items-center justify-center py-2"
              style={{ backgroundColor: palette.cream, borderRadius: 16 }}
            >
              <Text className="text-xs" style={{ color: palette.muted }}>
                Showing{' '}
                <Text className="font-semibold" style={{ color: palette.ink }}>
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, data.length)}
                </Text>{' '}
                of{' '}
                <Text className="font-semibold" style={{ color: palette.ink }}>
                  {data.length}
                </Text>{' '}
                leave applications
              </Text>
            </View>
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
