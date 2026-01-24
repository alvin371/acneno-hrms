import { Image, Text, View, useWindowDimensions } from 'react-native';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@/ui/Screen';
import { Card } from '@/ui/Card';
import { StatusChip } from '@/ui/StatusChip';
import { EmptyState } from '@/ui/EmptyState';
import { LoadingSkeleton } from '@/ui/LoadingSkeleton';
import { getLeaveDetail } from '@/features/leave/api';
import { getErrorMessage } from '@/api/error';
import { showErrorModal } from '@/utils/errorModal';
import type { LeaveStackParamList } from '@/navigation/types';
import { env } from '@/config/env';

let PdfPreview: null | ((props: any) => JSX.Element) = null;
try {
  PdfPreview = require('react-native-pdf').default;
} catch {
  PdfPreview = null;
}

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

type Props = NativeStackScreenProps<LeaveStackParamList, 'LeaveDetail'>;

export const LeaveDetailScreen = ({ route }: Props) => {
  const { id } = route.params;
  const { width } = useWindowDimensions();

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['leave-detail', id],
    queryFn: () => getLeaveDetail(id),
  });

  useEffect(() => {
    if (error) {
      showErrorModal(getErrorMessage(error));
    }
  }, [error]);

  const resolveAttachmentPath = (value?: string | null) => {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) {
      return value;
    }
    const baseOrigin = new URL(env.API_BASE_URL).origin;
    const normalizedPath = value.startsWith('/') ? value.slice(1) : value;
    return `${baseOrigin}/${normalizedPath}`;
  };

  const getAttachmentExtension = (value: string) => {
    const withoutQuery = value.split('?')[0];
    const lastDot = withoutQuery.lastIndexOf('.');
    if (lastDot === -1) return '';
    return withoutQuery.slice(lastDot + 1).toLowerCase();
  };

  const attachmentUrl = resolveAttachmentPath(data?.attachmentPath);
  const attachmentExt = attachmentUrl
    ? getAttachmentExtension(attachmentUrl)
    : '';
  const isImageAttachment = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
    attachmentExt
  );
  const isPdfAttachment = attachmentExt === 'pdf';
  const attachmentWidth = Math.min(width - 32, 520);
  const attachmentHeight = Math.round(attachmentWidth * 0.7);

  return (
    <Screen scroll refreshing={isRefetching} onRefresh={refetch}>
      <View className="gap-6">
        <View>
          <Text className="text-2xl font-bold text-ink-700">Leave Detail</Text>
          <Text className="text-base text-ink-500">
            Review the details of your leave request.
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
                    {data.leaveTypeName}
                  </Text>
                  <Text className="text-sm text-ink-500">
                    Request: {data.requestNo}
                  </Text>
                </View>
                <StatusChip
                  label={data.status}
                  variant={statusToVariant(data.status)}
                />
              </View>
              <Text className="text-sm text-ink-500">
                {data.startDate} - {data.endDate} ({data.daysCount} days)
              </Text>
              <Text className="text-sm text-ink-500">{data.reason}</Text>
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
                  ) : isPdfAttachment && PdfPreview ? (
                    <View style={{ width: attachmentWidth, height: 360 }}>
                      <PdfPreview
                        source={{ uri: attachmentUrl }}
                        style={{ flex: 1, borderRadius: 12 }}
                        trustAllCerts={false}
                      />
                    </View>
                  ) : (
                    <Text className="text-sm text-ink-600">
                      Attachment preview unavailable.
                    </Text>
                  )}
                </View>
              ) : null}
            </Card>

            <Card className="gap-3">
              <Text className="text-base font-semibold text-ink-700">
                Approval Route
              </Text>
              {data.approvals.length > 0 ? (
                data.approvals.map((approval) => (
                  <View key={approval.id} className="gap-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-medium text-ink-700">
                        Step {approval.stepNo}
                      </Text>
                      <Text className="text-xs text-ink-500">
                        {approval.action}
                      </Text>
                    </View>
                    <Text className="text-sm text-ink-600">
                      {approval.approverName} ({approval.approverEmail})
                    </Text>
                    {approval.actionAt ? (
                      <Text className="text-xs text-ink-500">
                        {approval.actionAt}
                      </Text>
                    ) : null}
                    {approval.notes ? (
                      <Text className="text-xs text-ink-500">
                        Notes: {approval.notes}
                      </Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text className="text-sm text-ink-500">
                  No approval steps available.
                </Text>
              )}
            </Card>
          </View>
        ) : (
          <EmptyState
            icon="document-outline"
            title="Leave Not Found"
            description="The requested leave could not be found."
          />
        )}
      </View>
    </Screen>
  );
};
