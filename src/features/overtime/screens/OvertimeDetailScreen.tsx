import { Image, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import { Screen } from '@/ui/Screen';
import { Card } from '@/ui/Card';
import { StatusChip } from '@/ui/StatusChip';
import { EmptyState } from '@/ui/EmptyState';
import { LoadingSkeleton } from '@/ui/LoadingSkeleton';
import { getOvertimeDetail, cancelOvertime } from '@/features/overtime/api';
import { statusToVariant, formatDurationHours } from '@/features/overtime/utils';
import { getErrorMessage } from '@/api/error';
import { showErrorModal } from '@/utils/errorModal';
import { showToast } from '@/utils/toast';
import { queryClient } from '@/lib/queryClient';
import type { OvertimeStackParamList } from '@/navigation/types';
import type { OvertimeApproval } from '@/api/types';

const palette = {
  emerald: '#10B981',
  amber: '#F59E0B',
  gray: '#9CA3AF',
  red: '#EF4444',
  ink: '#1a1a1a',
  muted: '#6B7280',
  lightGray: '#E5E7EB',
  white: '#ffffff',
};

const CheckIcon = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color} />
    <Path
      d="M8 12l3 3 5-5"
      stroke={palette.white}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const HourglassIcon = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color} />
    <Path
      d="M9 6h6M9 18h6M9.5 6v3.5a1 1 0 00.5.86l1.5 1.14a1 1 0 01.5.86V18M14.5 6v3.5a1 1 0 01-.5.86l-1.5 1.14a1 1 0 00-.5.86V18"
      stroke={palette.white}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const EmptyCircle = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
  </Svg>
);

const CloseIcon = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

type Props = NativeStackScreenProps<OvertimeStackParamList, 'OvertimeDetail'>;

const getStepIcon = (approval: OvertimeApproval) => {
  if (approval.action === 'APPROVED') {
    return <CheckIcon color={palette.emerald} />;
  }
  if (approval.action === 'PENDING') {
    return <HourglassIcon color={palette.amber} />;
  }
  if (approval.action === 'REJECTED') {
    return <CloseIcon color={palette.red} />;
  }
  return <EmptyCircle color={palette.gray} />;
};

const getStepLineColor = (approval: OvertimeApproval, isLast: boolean) => {
  if (isLast) return 'transparent';
  if (approval.action === 'APPROVED') {
    return palette.emerald;
  }
  return palette.lightGray;
};

const getAttachmentExtension = (value: string) => {
  const withoutQuery = value.split('?')[0];
  const lastDot = withoutQuery.lastIndexOf('.');
  if (lastDot === -1) return '';
  return withoutQuery.slice(lastDot + 1).toLowerCase();
};

export const OvertimeDetailScreen = ({ route, navigation }: Props) => {
  const { id } = route.params;
  const { width } = useWindowDimensions();

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['overtime-detail', id],
    queryFn: () => getOvertimeDetail(id),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelOvertime,
    onSuccess: (response) => {
      showToast('success', response.message || 'Overtime request cancelled successfully.');
      queryClient.invalidateQueries({ queryKey: ['overtime'] });
      queryClient.invalidateQueries({ queryKey: ['overtime-detail', id] });
      navigation.goBack();
    },
    onError: (mutationError) => showErrorModal(getErrorMessage(mutationError)),
  });

  useEffect(() => {
    if (error) {
      showErrorModal(getErrorMessage(error));
    }
  }, [error]);

  const handleCancel = () => {
    cancelMutation.mutate(id);
  };

  const canCancel = data?.statusRaw === 'SUBMITTED' || data?.statusRaw === 'IN_REVIEW';

  const attachmentUrl = data?.attachmentPath || '';
  const attachmentExt = attachmentUrl ? getAttachmentExtension(attachmentUrl) : '';
  const isImageAttachment = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(attachmentExt);
  const attachmentWidth = Math.min(width - 32, 520);
  const attachmentHeight = Math.round(attachmentWidth * 0.7);

  return (
    <Screen scroll refreshing={isRefetching} onRefresh={refetch}>
      <View className="gap-6 pb-24">
        <View>
          <Text className="text-2xl font-bold text-ink-700">Overtime Request</Text>
          <Text className="text-base text-ink-500">
            Review the details of your overtime request.
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
                    {data.overtimeTypeName}
                  </Text>
                  <Text className="text-sm text-ink-500">{data.overtimeDate}</Text>
                </View>
                <StatusChip
                  label={data.status}
                  variant={statusToVariant(data.status)}
                />
              </View>
              <View className="gap-1">
                <Text className="text-sm text-ink-500">
                  Request ID: {data.requestNo}
                </Text>
                <Text className="text-sm text-ink-500">
                  Duration: {formatDurationHours(data.durationHours)} ({data.startTime} - {data.endTime})
                </Text>
              </View>
              <View className="mt-1">
                <Text className="text-xs text-ink-500">Reason</Text>
                <Text className="text-sm text-ink-700">{data.reason}</Text>
              </View>
              <View className="mt-2 gap-1">
                <Text className="text-xs text-ink-500">Requester</Text>
                <Text className="text-sm font-medium text-ink-700">
                  {data.requester.name} ({data.requester.email})
                </Text>
              </View>
              {attachmentUrl ? (
                <View className="mt-2 gap-1">
                  <Text className="text-xs text-ink-500">Attachment</Text>
                  {isImageAttachment ? (
                    <Image
                      source={{ uri: attachmentUrl }}
                      style={{
                        width: attachmentWidth,
                        height: attachmentHeight,
                        borderRadius: 12,
                        backgroundColor: '#f1f5f9',
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-sm text-blue-600">{attachmentUrl}</Text>
                  )}
                </View>
              ) : null}
            </Card>

            <Card className="gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-ink-700">
                  Request Progress
                </Text>
                <Text className="text-xs text-ink-500">
                  Step {data.currentStep} of {data.totalSteps}
                </Text>
              </View>
              <View className="gap-0">
                {data.approvals.map((approval, index) => {
                  const isLast = index === data.approvals.length - 1;
                  return (
                    <View key={approval.id} className="flex-row">
                      <View className="items-center" style={{ width: 32 }}>
                        {getStepIcon(approval)}
                        {!isLast && (
                          <View
                            className="flex-1"
                            style={{
                              width: 2,
                              backgroundColor: getStepLineColor(approval, isLast),
                              minHeight: 48,
                            }}
                          />
                        )}
                      </View>
                      <View className="flex-1 pb-6 pl-3">
                        <Text className="text-sm font-semibold text-ink-700">
                          {approval.stepName}
                        </Text>
                        <Text className="text-xs text-ink-500">
                          {approval.approverName}
                        </Text>
                        {approval.actionAt ? (
                          <Text className="mt-1 text-xs text-ink-500">
                            {approval.actionAt}
                          </Text>
                        ) : null}
                        {approval.notes ? (
                          <View
                            className="mt-2 rounded-lg p-2"
                            style={{ backgroundColor: '#F3F4F6' }}
                          >
                            <Text className="text-xs italic text-ink-600">
                              "{approval.notes}"
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>

            {canCancel ? (
              <Pressable
                onPress={handleCancel}
                disabled={cancelMutation.isPending}
                className="flex-row items-center justify-center gap-2 rounded-xl border py-3"
                style={{
                  borderColor: palette.red,
                  opacity: cancelMutation.isPending ? 0.5 : 1,
                }}
              >
                <CloseIcon color={palette.red} />
                <Text
                  className="text-base font-semibold"
                  style={{ color: palette.red }}
                >
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Request'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <EmptyState
            icon="document-outline"
            title="Request Not Found"
            description="The requested overtime could not be found."
          />
        )}
      </View>
    </Screen>
  );
};
