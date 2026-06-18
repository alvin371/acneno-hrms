import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { cancelLeave, getLeaveDetail } from '@/features/leave/api';
import { getErrorMessage } from '@/api/error';
import { showErrorModal } from '@/utils/errorModal';
import { showToast } from '@/utils/toast';
import { resolveMediaUrl } from '@/utils/media';
import { HeroGradient } from '@/features/leave/components/HeroGradient';
import {
  CRIMSON,
  STATUS_COLOR,
  getLeaveMeta,
  getStatusMeta,
  normalizeStatus,
} from '@/features/leave/meta';
import { COPY } from '@/features/leave/copy';
import { fmtDateLong, fmtDowFull, fmtTimestamp } from '@/features/leave/utils/date';
import type { LeaveApprovalProgressStep } from '@/api/types';
import type { LeaveStackParamList } from '@/navigation/types';

let PdfPreview: null | ((props: any) => React.JSX.Element) = null;
try {
  PdfPreview = require('react-native-pdf').default;
} catch {
  PdfPreview = null;
}

type Props = NativeStackScreenProps<LeaveStackParamList, 'LeaveDetail'>;

const isApproved = (a: LeaveApprovalProgressStep) =>
  String(a.action).toUpperCase() === 'APPROVED';
const isRejected = (a: LeaveApprovalProgressStep) =>
  String(a.action).toUpperCase() === 'REJECTED';
const isPendingStep = (a: LeaveApprovalProgressStep) =>
  String(a.action).toUpperCase() === 'PENDING' ||
  String(a.action).toUpperCase() === 'WAITING' ||
  String(a.action).toUpperCase() === '';

export const LeaveDetailScreen = ({ route, navigation }: Props) => {
  const { id } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['leave-detail', id],
    queryFn: () => getLeaveDetail(id),
  });

  useEffect(() => {
    if (error) showErrorModal(getErrorMessage(error));
  }, [error]);

  const cancelMutation = useMutation({
    mutationFn: cancelLeave,
    onSuccess: (res) => {
      showToast('success', res?.message || COPY.toasts.cancelled);
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      queryClient.invalidateQueries({ queryKey: ['leave-quota'] });
      void refetch();
      setConfirmCancel(false);
    },
    onError: (e) => {
      showErrorModal(getErrorMessage(e));
      setConfirmCancel(false);
    },
  });

  const meta = getLeaveMeta(data?.leaveTypeCode);
  const statusKind = data ? normalizeStatus(data.status) : 'pending';
  const statusMeta = data ? getStatusMeta(data.status) : null;

  const attachmentUrl = resolveMediaUrl(data?.attachmentPath);
  const attachmentExt = useMemo(() => {
    if (!attachmentUrl) return '';
    const noQuery = attachmentUrl.split('?')[0];
    const dot = noQuery.lastIndexOf('.');
    return dot === -1 ? '' : noQuery.slice(dot + 1).toLowerCase();
  }, [attachmentUrl]);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(attachmentExt);
  const isPdf = attachmentExt === 'pdf';
  const canPreview = isImage || (isPdf && Boolean(PdfPreview));
  const attachmentName = useMemo(() => {
    if (!attachmentUrl) return 'Lampiran';
    const noQuery = attachmentUrl.split('?')[0];
    const parts = noQuery.split('/');
    return parts[parts.length - 1] || 'Lampiran';
  }, [attachmentUrl]);

  const openAttachment = async () => {
    if (!attachmentUrl) return;
    if (canPreview) {
      setPreviewOpen(true);
      return;
    }
    try {
      await Linking.openURL(attachmentUrl);
    } catch {
      showErrorModal(COPY.detail.attachmentOpenError);
    }
  };

  // Subtitle for status banner
  const nextApprover = useMemo(() => {
    if (!data) return null;
    const pending = data.approvals.find((a) => isPendingStep(a));
    return pending?.assignedApproverName ?? null;
  }, [data]);

  const bannerSubtitle = useMemo(() => {
    if (!data || !statusMeta) return '';
    if (statusKind === 'pending') {
      return nextApprover
        ? COPY.detail.waitingFor(nextApprover)
        : COPY.detail.waitingForGeneric;
    }
    if (statusKind === 'approved') {
      const step = data.approvals.find((a) => isApproved(a) && a.actionAt);
      const date = step?.actionAt ? fmtDateLong(step.actionAt) : '';
      return date ? `${COPY.detail.approvedOn} ${date}` : COPY.detail.approvedOn;
    }
    if (statusKind === 'rejected') {
      const step = data.approvals.find((a) => isRejected(a) && a.actionAt);
      const date = step?.actionAt ? fmtDateLong(step.actionAt) : '';
      return date ? `${COPY.detail.rejectedOn} ${date}` : COPY.detail.rejectedOn;
    }
    const date = data.updatedAt ? fmtDateLong(data.updatedAt) : '';
    return date ? `${COPY.detail.cancelledOn} ${date}` : COPY.detail.cancelledOn;
  }, [data, statusKind, statusMeta, nextApprover]);

  const decisionNote = useMemo(() => {
    if (!data) return null;
    if (statusKind === 'rejected') {
      const step = data.approvals.find((a) => isRejected(a));
      return step?.notes ?? null;
    }
    if (statusKind === 'approved') {
      const step = data.approvals.find((a) => isApproved(a) && a.notes);
      return step?.notes ?? null;
    }
    return null;
  }, [data, statusKind]);

  const attachmentWidth = Math.min(width - 32, 520);

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#FAFAFA' }} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            hitSlop={8}
          >
            <Text style={s.backIcon}>←</Text>
          </Pressable>
          <Text style={s.headerTitle}>{COPY.detailTitle}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: tabBarHeight + insets.bottom + (statusKind === 'pending' || statusKind === 'rejected' ? 110 : 24),
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#FFFFFF"
            colors={[CRIMSON.cr]}
          />
        }
      >
        {/* Hero */}
        <View style={s.hero}>
          {/* Background: gradient + blobs clipped to hero bounds */}
          <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]} pointerEvents="none">
            <HeroGradient />
            <View style={s.blob1} />
            <View style={s.blob2} />
          </View>

          {data ? (
            <View style={s.heroCenter}>
              <View
                style={[
                  s.heroTypeChip,
                  { backgroundColor: 'rgba(255,255,255,0.15)' },
                ]}
              >
                <Text style={s.heroTypeIcon}>{meta.icon}</Text>
              </View>
              <Text style={s.heroLeaveType}>{data.leaveTypeName ?? meta.label}</Text>
              <Text style={s.heroRequestNo}>{data.requestNo}</Text>

              {/* Glass status banner */}
              {statusMeta ? (
                <View style={s.banner}>
                  <View style={s.bannerLeft}>
                    <Text style={s.bannerStatus}>{statusMeta.label}</Text>
                    <Text style={s.bannerSubtitle} numberOfLines={2}>
                      {bannerSubtitle}
                    </Text>
                  </View>
                  <View style={s.bannerRight}>
                    <Text style={s.bannerDays}>{data.daysCount}</Text>
                    <Text style={s.bannerDaysUnit}>hari</Text>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {isLoading ? (
          <View style={s.loadingCard}>
            <Text style={s.loadingText}>{COPY.detail.loading}</Text>
          </View>
        ) : data ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 14 }}>
            {/* Date range card */}
            <View style={s.card}>
              <Text style={s.cardLabel}>{COPY.detail.dateRange}</Text>
              <View style={s.dateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.dateSubLabel}>{COPY.fields.startDate}</Text>
                  <Text style={s.dateValue}>{fmtDateLong(data.startDate)}</Text>
                  <Text style={s.dateDow}>{fmtDowFull(data.startDate)}</Text>
                </View>
                <Text style={s.dateArrow}>→</Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={s.dateSubLabel}>{COPY.fields.endDate}</Text>
                  <Text style={s.dateValue}>{fmtDateLong(data.endDate)}</Text>
                  <Text style={s.dateDow}>{fmtDowFull(data.endDate)}</Text>
                </View>
              </View>
            </View>

            {/* Reason card */}
            <View style={s.card}>
              <Text style={s.cardLabel}>{COPY.detail.reason}</Text>
              <Text style={s.reasonText}>{data.reason || '—'}</Text>
            </View>

            {/* Requester card */}
            <View style={s.card}>
              <Text style={s.cardLabel}>{COPY.detail.requester}</Text>
              <View style={s.requesterRow}>
                <View style={s.avatar}>
                  <Text style={s.avatarInitials}>
                    {(data.requester.name ?? '?')
                      .split(' ')
                      .slice(0, 2)
                      .map((p) => p[0] ?? '')
                      .join('')
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={s.requesterName} numberOfLines={2}>
                    {data.requester.name || '—'}
                  </Text>
                  <Text style={s.requesterMeta} numberOfLines={1}>
                    {data.requester.position_name ?? data.requester.role_name ?? '—'}
                  </Text>
                  <Text style={s.requesterEmail} numberOfLines={1}>
                    {data.requester.email || '—'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Attachment card */}
            {attachmentUrl ? (
              <View style={s.card}>
                <Text style={s.cardLabel}>{COPY.detail.attachment}</Text>
                <Pressable
                  onPress={() => {
                    void openAttachment();
                  }}
                  style={s.attachmentBtn}
                >
                  <View style={s.attachmentIcon}>
                    <Text style={{ fontSize: 18 }}>
                      {isPdf ? '📄' : isImage ? '🖼️' : '📎'}
                    </Text>
                  </View>
                  <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <Text style={s.attachmentName} numberOfLines={1}>
                      {attachmentName}
                    </Text>
                    <Text style={s.attachmentHint}>
                      {canPreview
                        ? COPY.detail.attachmentTapPreview
                        : COPY.detail.attachmentTapOpen}
                    </Text>
                  </View>
                  <Text style={s.attachmentOpen}>{COPY.detail.openAttachment}</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Approval stepper */}
            <View style={s.card}>
              <Text style={s.cardLabel}>{COPY.detail.approvalRoute}</Text>
              {data.approvals.length === 0 ? (
                <Text style={s.emptyApprovals}>{COPY.detail.noApprovals}</Text>
              ) : (
                <ApprovalStepper steps={data.approvals} />
              )}
            </View>

            {/* Decision note callout */}
            {decisionNote ? (
              <View
                style={[
                  s.noteCallout,
                  {
                    backgroundColor:
                      statusKind === 'rejected'
                        ? STATUS_COLOR.redBg
                        : STATUS_COLOR.greenBg,
                    borderColor:
                      statusKind === 'rejected'
                        ? STATUS_COLOR.red
                        : STATUS_COLOR.green,
                  },
                ]}
              >
                <Text
                  style={[
                    s.noteCalloutLabel,
                    {
                      color:
                        statusKind === 'rejected'
                          ? STATUS_COLOR.red
                          : STATUS_COLOR.green,
                    },
                  ]}
                >
                  {COPY.detail.decisionNote}
                </Text>
                <Text style={s.noteCalloutText}>{decisionNote}</Text>
              </View>
            ) : null}
          </View>
        ) : error ? (
          <View style={s.loadingCard}>
            <Text style={s.loadingText}>{COPY.detail.loadError}</Text>
            <Pressable onPress={() => void refetch()} style={{ marginTop: 12 }}>
              <Text style={{ color: CRIMSON.cr, fontSize: 13, fontWeight: '700' }}>
                {COPY.detail.retryBtn}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.loadingCard}>
            <Text style={s.loadingText}>{COPY.detail.notFound}</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky action bar */}
      {data && (statusKind === 'pending' || statusKind === 'rejected') ? (
        <View style={[s.stickyBar, { paddingBottom: insets.bottom + 12 }]}>
          {statusKind === 'pending' ? (
            <Pressable
              onPress={() => setConfirmCancel(true)}
              style={({ pressed }) => [
                s.cancelBtn,
                pressed && { opacity: 0.85 },
                cancelMutation.isPending && { opacity: 0.6 },
              ]}
              disabled={cancelMutation.isPending}
            >
              <Text style={s.cancelBtnText}>
                {cancelMutation.isPending ? COPY.cancelLoading : COPY.cancel}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => navigation.navigate('LeaveCreate')}
              style={({ pressed }) => [
                s.reapplyBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={s.reapplyBtnText}>{COPY.applyAgain}</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {/* Attachment preview modal */}
      <Modal
        visible={previewOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setPreviewOpen(false)}
      >
        <View style={s.previewBackdrop}>
          <View style={s.previewHeader}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={s.previewTitle}>{COPY.detail.attachment}</Text>
              <Text style={s.previewName} numberOfLines={1}>
                {attachmentName}
              </Text>
            </View>
            <Pressable
              onPress={() => setPreviewOpen(false)}
              style={s.previewClose}
            >
              <Text style={s.previewCloseText}>{COPY.detail.previewClose}</Text>
            </Pressable>
          </View>
          <View style={s.previewBody}>
            {isImage && attachmentUrl ? (
              <>
                <Image
                  source={{ uri: attachmentUrl }}
                  style={{
                    width: attachmentWidth,
                    height: attachmentWidth,
                    maxHeight: '100%',
                    borderRadius: 16,
                    backgroundColor: '#0f172a',
                  }}
                  resizeMode="contain"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                />
                {imageLoading ? (
                  <ActivityIndicator
                    style={{ position: 'absolute' }}
                    color="#fff"
                    size="large"
                  />
                ) : null}
              </>
            ) : isPdf && PdfPreview && attachmentUrl ? (
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  borderRadius: 16,
                }}
              >
                <PdfPreview
                  source={{ uri: attachmentUrl }}
                  style={{ flex: 1 }}
                  trustAllCerts={false}
                />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Cancel confirm */}
      <Modal
        visible={confirmCancel}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmCancel(false)}
      >
        <View style={s.confirmBackdrop}>
          <View style={s.confirmCard}>
            <Text style={s.confirmEmoji}>⚠️</Text>
            <Text style={s.confirmTitle}>{COPY.confirmCancel.title}</Text>
            <Text style={s.confirmMessage}>{COPY.confirmCancel.message}</Text>
            <View style={s.confirmActions}>
              <Pressable
                onPress={() => setConfirmCancel(false)}
                style={s.confirmCancelBtn}
                disabled={cancelMutation.isPending}
              >
                <Text style={s.confirmCancelText}>{COPY.confirmCancel.keep}</Text>
              </Pressable>
              <Pressable
                onPress={() => cancelMutation.mutate(id)}
                style={[s.confirmConfirmBtn, cancelMutation.isPending && { opacity: 0.6 }]}
                disabled={cancelMutation.isPending}
              >
                <Text style={s.confirmConfirmText}>
                  {cancelMutation.isPending ? 'Membatalkan...' : COPY.confirmCancel.confirm}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

function ApprovalStepper({ steps }: { steps: LeaveApprovalProgressStep[] }) {
  return (
    <View style={{ gap: 0, marginTop: 6 }}>
      {steps.map((step, idx) => (
        <StepperItem
          key={step.id}
          step={step}
          isLast={idx === steps.length - 1}
        />
      ))}
    </View>
  );
}

function StepperItem({
  step,
  isLast,
}: {
  step: LeaveApprovalProgressStep;
  isLast: boolean;
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  const approved = isApproved(step);
  const rejected = isRejected(step);
  const pending = isPendingStep(step);

  useEffect(() => {
    if (!pending) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pending, pulse]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  const dotColor = approved
    ? STATUS_COLOR.green
    : rejected
      ? STATUS_COLOR.red
      : pending
        ? STATUS_COLOR.amber
        : STATUS_COLOR.gray;

  const statusLabel = approved
    ? COPY.stepper.approved
    : rejected
      ? COPY.stepper.rejected
      : pending
        ? COPY.stepper.waiting
        : COPY.stepper.notStarted;

  return (
    <View style={st.row}>
      <View style={st.dotCol}>
        <View style={[st.dot, { backgroundColor: dotColor }]}>
          {pending ? (
            <Animated.View
              style={[
                st.pulse,
                {
                  backgroundColor: dotColor,
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />
          ) : null}
          <Text style={st.dotText}>{step.stepNo}</Text>
        </View>
        {!isLast ? (
          <View
            style={[
              st.line,
              { backgroundColor: approved ? STATUS_COLOR.green : '#E8E0E2' },
            ]}
          />
        ) : null}
      </View>
      <View style={st.body}>
        <View style={st.bodyHeader}>
          <Text style={st.approverName}>
            {step.actualApproverName ??
              step.assignedApproverName ??
              `Approver ${step.stepNo}`}
          </Text>
          <View
            style={[
              st.stepBadge,
              {
                backgroundColor:
                  approved
                    ? STATUS_COLOR.greenBg
                    : rejected
                      ? STATUS_COLOR.redBg
                      : pending
                        ? STATUS_COLOR.amberBg
                        : STATUS_COLOR.grayBg,
              },
            ]}
          >
            <Text style={[st.stepBadgeText, { color: dotColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>
        {step.stepName ? (
          <Text style={st.approverRole}>{step.stepName}</Text>
        ) : step.assignedApproverRole ? (
          <Text style={st.approverRole}>{step.assignedApproverRole}</Text>
        ) : null}
        {step.actionAt ? (
          <Text style={st.actionAt}>{fmtTimestamp(step.actionAt)}</Text>
        ) : null}
        {step.notes ? (
          <Text style={st.notes}>{step.notes}</Text>
        ) : null}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  dotCol: {
    width: 36,
    alignItems: 'center',
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  dotText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 4,
  },
  body: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 14,
  },
  bodyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  approverName: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  approverRole: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  stepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  stepBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  actionAt: {
    fontSize: 10.5,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  notes: {
    fontSize: 12,
    color: '#475569',
    marginTop: 6,
    backgroundColor: '#F2F0ED',
    padding: 8,
    borderRadius: 8,
  },
});

const s = StyleSheet.create({
  header: {
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0E2',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F2F0ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: '600',
  },
  hero: {
    paddingBottom: 24,
    paddingTop: 16,
  },
  blob1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  blob2: {
    position: 'absolute',
    bottom: 20,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroCenter: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  heroTypeChip: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTypeIcon: { fontSize: 32 },
  heroLeaveType: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroRequestNo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    marginTop: 4,
  },
  banner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignSelf: 'stretch',
    gap: 12,
  },
  bannerLeft: { flex: 1 },
  bannerStatus: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11.5,
    marginTop: 2,
  },
  bannerRight: {
    alignItems: 'center',
    minWidth: 56,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  bannerDays: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  bannerDaysUnit: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F2EDEE',
    gap: 8,
  },
  cardLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateSubLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 2,
  },
  dateDow: {
    fontSize: 11.5,
    color: CRIMSON.cr,
    fontWeight: '600',
    marginTop: 2,
  },
  dateArrow: {
    color: CRIMSON.cr,
    fontWeight: '800',
    fontSize: 18,
    paddingHorizontal: 8,
  },
  reasonText: {
    fontSize: 13.5,
    color: '#1A1A1A',
    lineHeight: 20,
    marginTop: 4,
  },
  requesterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CRIMSON.cr,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  requesterName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  requesterMeta: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  requesterEmail: {
    fontSize: 11.5,
    color: '#9CA3AF',
    marginTop: 2,
  },
  attachmentBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F0ED',
    borderRadius: 12,
    padding: 12,
  },
  attachmentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  attachmentHint: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  attachmentOpen: {
    fontSize: 12,
    fontWeight: '700',
    color: CRIMSON.cr,
  },
  emptyApprovals: {
    fontSize: 12.5,
    color: '#6B7280',
    paddingVertical: 8,
  },
  noteCallout: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
  },
  noteCalloutLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteCalloutText: {
    fontSize: 13,
    color: '#1A1A1A',
    marginTop: 4,
    lineHeight: 19,
  },
  loadingCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },
  loadingText: { fontSize: 13, color: '#6B7280' },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F2EDEE',
  },
  cancelBtn: {
    backgroundColor: STATUS_COLOR.red,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  reapplyBtn: {
    backgroundColor: CRIMSON.cr,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  reapplyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.92)',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  previewTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  previewName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11.5,
    marginTop: 2,
  },
  previewClose: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  previewCloseText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  previewBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  confirmCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  confirmEmoji: { fontSize: 36, marginBottom: 10 },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  confirmMessage: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  confirmConfirmBtn: {
    flex: 1.4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: STATUS_COLOR.red,
    alignItems: 'center',
  },
  confirmConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
