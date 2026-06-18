import { Image, Linking, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import type { OvertimeApprovalProgressStep as OvertimeApproval } from '@/api/types';
import { resolveMediaUrl } from '@/utils/media';
import { tokens } from '@/config/tokens';

const palette = {
  emerald: '#047857',
  amber: '#B45309',
  gray: tokens.colors.textMuted,
  red: '#BE123C',
  ink: tokens.colors.ink,
  muted: tokens.colors.textSub,
  lightGray: tokens.colors.borderWarm,
  white: '#FFFFFF',
  maroon: tokens.colors.maroon,
  maroonTint: '#F0E8EA',
  sand: '#F2F0ED',
  warm: tokens.colors.warmSurface,
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

const CloseIcon = ({ color, size = 18 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BackArrow = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
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
    return <CloseIcon color={palette.red} size={20} />;
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
  const insets = useSafeAreaInsets();

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
      showToast('success', response.message || 'Pengajuan lembur berhasil dibatalkan.');
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

  const canCancel = data?.statusRaw === 'SUBMITTED' || data?.statusRaw === 'IN_REVIEW';
  const attachmentUrl = resolveMediaUrl(data?.attachmentPath);
  const attachmentExt = attachmentUrl ? getAttachmentExtension(attachmentUrl) : '';
  const isImageAttachment = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(attachmentExt);
  const attachmentWidth = Math.min(width - 32, 520);
  const attachmentHeight = Math.round(attachmentWidth * 0.7);

  const summaryItems = useMemo(
    () =>
      data
        ? [
            { label: 'Tanggal', value: data.overtimeDate },
            { label: 'Waktu', value: `${data.startTime} - ${data.endTime}` },
            { label: 'Durasi', value: formatDurationHours(data.durationHours) },
          ]
        : [],
    [data]
  );

  const handleCancel = () => {
    cancelMutation.mutate(id);
  };

  const openAttachment = async () => {
    if (!attachmentUrl) return;

    try {
      await Linking.openURL(attachmentUrl);
    } catch {
      showErrorModal('Lampiran tidak bisa dibuka saat ini. Silakan coba lagi.');
    }
  };

  return (
    <Screen
      scroll
      refreshing={isRefetching}
      onRefresh={refetch}
      safeAreaStyle={{ backgroundColor: palette.maroon }}
      contentContainerStyle={{ paddingTop: 0, paddingHorizontal: 0 }}
    >
      <View
        className="px-4 pb-5"
        style={{ backgroundColor: palette.maroon, paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          className="mb-4 flex-row items-center self-start rounded-full px-3 py-2"
          style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
        >
          <BackArrow color={palette.white} />
          <Text className="ml-2 text-sm font-semibold text-white">Kembali</Text>
        </Pressable>

        <Text className="text-xs font-semibold uppercase tracking-wide text-white/70">
          {data?.requestNo ?? 'Detail lembur'}
        </Text>
        <Text className="mt-1 text-2xl font-bold text-white">
          Detail pengajuan lembur
        </Text>
        <Text className="mt-2 text-sm text-white/80">
          Lihat ringkasan, lampiran, dan progres persetujuan dalam satu alur.
        </Text>

        {data ? (
          <View className="mt-4">
            <StatusChip
              label={data.status}
              variant={statusToVariant(data.status)}
            />
          </View>
        ) : null}
      </View>

      <View className="gap-4 px-4 pb-24 pt-4" style={{ backgroundColor: palette.warm }}>
        {isLoading ? (
          <LoadingSkeleton count={3} />
        ) : data ? (
          <View className="gap-4">
            <Card className="gap-4">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-ink-700">
                    {data.overtimeTypeName}
                  </Text>
                  <Text className="mt-1 text-sm text-ink-500">
                    {data.requestNo}
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-3">
                {summaryItems.map((item) => (
                  <View
                    key={item.label}
                    className="min-w-[30%] flex-1 rounded-2xl px-3 py-3"
                    style={{ backgroundColor: palette.sand }}
                  >
                    <Text className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                      {item.label}
                    </Text>
                    <Text className="mt-1 text-sm font-medium text-ink-700">
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card className="gap-3">
              <Text className="text-base font-semibold text-ink-700">Alasan lembur</Text>
              <View
                className="rounded-2xl px-4 py-4"
                style={{ backgroundColor: palette.sand }}
              >
                <Text className="text-sm text-ink-700">{data.reason}</Text>
              </View>
            </Card>

            <Card className="gap-3">
              <Text className="text-base font-semibold text-ink-700">Pemohon</Text>
              <View
                className="rounded-2xl px-4 py-4"
                style={{ backgroundColor: palette.sand }}
              >
                <Text className="text-sm font-medium text-ink-700">
                  {data.requester.name}
                </Text>
                <Text className="mt-1 text-sm text-ink-500">
                  {data.requester.email}
                </Text>
              </View>
            </Card>

            <Card className="gap-3">
              <Text className="text-base font-semibold text-ink-700">Lampiran</Text>
              {attachmentUrl ? (
                <Pressable
                  onPress={() => {
                    void openAttachment();
                  }}
                  className="overflow-hidden rounded-2xl border"
                  style={{ borderColor: palette.lightGray }}
                >
                  <View className="flex-row items-center justify-between px-4 py-4">
                    <View className="mr-3 flex-1">
                      <Text className="text-sm font-semibold text-ink-700">
                        {isImageAttachment ? 'Lampiran gambar' : 'Buka lampiran'}
                      </Text>
                      <Text className="mt-1 text-xs text-ink-500">
                        {isImageAttachment
                          ? 'Ketuk untuk membuka versi penuh lampiran.'
                          : 'Ketuk untuk membuka file lampiran.'}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold" style={{ color: palette.maroon }}>
                      Buka
                    </Text>
                  </View>

                  {isImageAttachment ? (
                    <Image
                      source={{ uri: attachmentUrl }}
                      style={{
                        width: attachmentWidth,
                        height: attachmentHeight,
                        borderRadius: 12,
                        backgroundColor: palette.sand,
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      className="items-center justify-center px-4 py-8"
                      style={{ backgroundColor: palette.sand }}
                    >
                      <Text className="text-sm text-ink-600">
                        Lampiran siap dibuka dari perangkat Anda.
                      </Text>
                    </View>
                  )}
                </Pressable>
              ) : (
                <Text className="text-sm text-ink-500">
                  Tidak ada lampiran pada pengajuan ini.
                </Text>
              )}
            </Card>

            <Card className="gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-ink-700">
                  Alur persetujuan
                </Text>
                <Text className="text-xs text-ink-500">
                  Tahap {data.currentStep} dari {data.totalSteps}
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
                          {approval.actualApproverName ?? approval.assignedApproverName}
                        </Text>
                        {approval.actionAt ? (
                          <Text className="mt-1 text-xs text-ink-500">
                            {approval.actionAt}
                          </Text>
                        ) : null}
                        {approval.notes ? (
                          <View
                            className="mt-2 rounded-lg p-2"
                            style={{ backgroundColor: palette.sand }}
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
                  backgroundColor: '#FFF1F2',
                  opacity: cancelMutation.isPending ? 0.5 : 1,
                }}
              >
                <CloseIcon color={palette.red} />
                <Text
                  className="text-base font-semibold"
                  style={{ color: palette.red }}
                >
                  {cancelMutation.isPending ? 'Membatalkan...' : 'Batalkan pengajuan'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <EmptyState
            icon="document-outline"
            title="Pengajuan tidak ditemukan"
            description="Data lembur yang diminta tidak tersedia atau sudah tidak bisa diakses."
          />
        )}
      </View>
    </Screen>
  );
};
