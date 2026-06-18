import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getLeaveApprovalDetail,
  getOvertimeApprovalDetail,
  approveLeave,
  rejectLeave,
  approveOvertime,
  rejectOvertime,
} from '@/features/approvals/api';
import {
  getAvatarColor,
  getInitials,
  formatShortDate,
} from '@/features/approvals/utils';
import { getErrorMessage } from '@/api/error';
import { showErrorModal } from '@/utils/errorModal';
import { showToast } from '@/utils/toast';
import type { ApprovalStackParamList } from '@/navigation/types';
import { resolveMediaUrl } from '@/utils/media';
import type {
  LeaveApprovalDetailResponse,
  OvertimeApprovalDetailResponse,
  LeaveApprovalProgressStep,
  OvertimeApprovalProgressStep,
} from '@/api/types';

const WINE_DARK = '#5A0F1A';
const WINE = '#8B1F2F';
const GREEN = '#16A34A';
const RED = '#DC2626';
const AMBER = '#F59E0B';
const BLUE = '#3B82F6';
const MIN_NOTE_LENGTH = 10;

let PdfPreview: null | ((props: any) => React.JSX.Element) = null;
try {
  PdfPreview = require('react-native-pdf').default;
} catch {
  PdfPreview = null;
}

type Props = NativeStackScreenProps<ApprovalStackParamList, 'ApprovalDetail'>;

// Unified view model consumed by the UI
type ApprovalVM = {
  requesterName: string;
  requesterRole: string | null;
  requestNo: string;
  status: 'pending' | 'approved' | 'rejected';
  module: 'leave' | 'overtime';
  startDate: string;
  endDate: string;
  durationLabel: string;
  reason: string;
  attachmentPath: string | null;
  submittedAt: string;
  startTime: string | null;
  endTime: string | null;
  approvalNote: string | null;
  rejectionReason: string | null;
  canTakeAction: boolean;
  steps: StepVM[];
};

type StepVM = {
  stepNo: number;
  stepName: string;
  approverName: string;
  action: string;
  actionAt: string | null;
  notes: string | null;
};

function deriveStatus(statusRaw: string | undefined, canTakeAction: boolean): 'pending' | 'approved' | 'rejected' {
  if (canTakeAction) return 'pending';
  const raw = (statusRaw ?? '').toUpperCase();
  if (raw === 'APPROVED') return 'approved';
  if (raw === 'REJECTED') return 'rejected';
  return 'pending';
}

function mapLeaveDetail(d: LeaveApprovalDetailResponse): ApprovalVM {
  const status = deriveStatus(d.request.statusRaw, d.step.canTakeAction);
  const steps: StepVM[] = (d.workflow.steps ?? []).map((s: LeaveApprovalProgressStep) => ({
    stepNo: s.stepNo,
    stepName: s.stepName ?? `Step ${s.stepNo}`,
    approverName: s.actualApproverName ?? s.assignedApproverName ?? '—',
    action: s.action,
    actionAt: s.actionAt ?? null,
    notes: s.notes ?? null,
  }));
  const approvalNote = d.step.action === 'APPROVED' ? (d.step.notes ?? null) : null;
  const rejectionReason = d.step.action === 'REJECTED' ? (d.step.notes ?? null) : null;
  return {
    requesterName: d.requester.name ?? '—',
    requesterRole: d.requester.positionName ?? null,
    requestNo: d.request.requestNo,
    status,
    module: 'leave',
    startDate: d.request.startDate,
    endDate: d.request.endDate,
    durationLabel: `${d.request.daysCount} hari`,
    reason: d.request.reason,
    attachmentPath: d.request.attachmentPath ?? null,
    submittedAt: d.request.createdAt,
    startTime: null,
    endTime: null,
    approvalNote,
    rejectionReason,
    canTakeAction: d.step.canTakeAction,
    steps,
  };
}

function mapOvertimeDetail(d: OvertimeApprovalDetailResponse): ApprovalVM {
  const status = deriveStatus(d.request.statusRaw, d.step.canTakeAction);
  const steps: StepVM[] = (d.workflow.steps ?? []).map((s: OvertimeApprovalProgressStep) => ({
    stepNo: s.stepNo,
    stepName: s.stepName ?? `Step ${s.stepNo}`,
    approverName: s.actualApproverName ?? s.assignedApproverName ?? '—',
    action: s.action,
    actionAt: s.actionAt ?? null,
    notes: s.notes ?? null,
  }));
  const approvalNote = d.step.action === 'APPROVED' ? (d.step.notes ?? null) : null;
  const rejectionReason = d.step.action === 'REJECTED' ? (d.step.notes ?? null) : null;
  return {
    requesterName: d.requester.name ?? '—',
    requesterRole: d.requester.positionName ?? null,
    requestNo: d.request.requestNo,
    status,
    module: 'overtime',
    startDate: d.request.overtimeDate,
    endDate: d.request.overtimeDate,
    durationLabel: `${d.request.durationHours} jam`,
    reason: d.request.reason,
    attachmentPath: d.request.attachmentPath ?? null,
    submittedAt: d.request.createdAt,
    startTime: d.request.startTime,
    endTime: d.request.endTime,
    approvalNote,
    rejectionReason,
    canTakeAction: d.step.canTakeAction,
    steps,
  };
}

function AvatarCircle({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: getAvatarColor(name), alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.33 }}>{getInitials(name)}</Text>
    </View>
  );
}

function ModuleBadge({ module }: { module: 'leave' | 'overtime' }) {
  const isOT = module === 'overtime';
  return (
    <View style={[sd.badge, { backgroundColor: isOT ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)' }]}>
      <Text style={[sd.badgeText, { color: isOT ? '#92400E' : '#1D4ED8' }]}>
        {isOT ? '⏰' : '🏖️'} {isOT ? 'Lembur' : 'Cuti'}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const colors = {
    pending:  { bg: 'rgba(245,158,11,0.2)',  text: AMBER },
    approved: { bg: 'rgba(22,163,74,0.2)',   text: GREEN },
    rejected: { bg: 'rgba(220,38,38,0.2)',   text: RED },
  };
  const label = status === 'pending' ? 'Menunggu' : status === 'approved' ? 'Disetujui' : 'Ditolak';
  const c = colors[status];
  return (
    <View style={[sd.badge, { backgroundColor: c.bg }]}>
      <Text style={[sd.badgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

function StepRow({ step, index, isLast, overallStatus }: { step: StepVM; index: number; isLast: boolean; overallStatus: 'pending' | 'approved' | 'rejected' }) {
  const isApproved = step.action === 'APPROVED' || (overallStatus === 'approved' && isLast);
  const isRejected = step.action === 'REJECTED';
  const isCurrent = step.action === 'PENDING' && overallStatus === 'pending';

  const dotBg = isRejected ? 'rgba(220,38,38,0.12)' : isApproved ? 'rgba(22,163,74,0.12)' : isCurrent ? 'rgba(59,130,246,0.1)' : '#F3F4F6';
  const dotBorder = isRejected ? RED : isApproved ? GREEN : isCurrent ? BLUE : '#D1D5DB';
  const dotColor = isRejected ? RED : isApproved ? GREEN : isCurrent ? BLUE : '#9CA3AF';
  const lineColor = isApproved ? GREEN : '#E5E7EB';

  return (
    <View style={sd.stepRow}>
      <View style={sd.stepLeft}>
        <View style={[sd.stepDot, { backgroundColor: dotBg, borderColor: dotBorder }]}>
          {isRejected ? (
            <Ionicons name="close" size={13} color={dotColor} />
          ) : isApproved ? (
            <Ionicons name="checkmark" size={13} color={dotColor} />
          ) : isCurrent ? (
            <Ionicons name="chevron-forward" size={13} color={dotColor} />
          ) : (
            <Text style={{ fontSize: 10, fontWeight: '700', color: dotColor }}>{index + 1}</Text>
          )}
        </View>
        {!isLast && <View style={[sd.stepLine, { backgroundColor: lineColor }]} />}
      </View>
      <View style={[sd.stepContent, !isLast && { paddingBottom: 20 }]}>
        <View style={sd.stepNameRow}>
          <Text style={sd.stepName}>Step {index + 1}: {step.stepName}</Text>
          {isCurrent && <View style={sd.stepTagActive}><Text style={sd.stepTagTextActive}>AKTIF</Text></View>}
          {isApproved && !isRejected && <View style={sd.stepTagDone}><Text style={sd.stepTagTextDone}>SELESAI</Text></View>}
          {isRejected && <View style={sd.stepTagRejected}><Text style={sd.stepTagTextRejected}>DITOLAK</Text></View>}
        </View>
        <View style={sd.stepPerson}>
          <Ionicons name="person-outline" size={11} color="#9CA3AF" />
          <Text style={sd.stepPersonText}>{step.approverName}</Text>
        </View>
        {step.actionAt ? (
          <Text style={sd.stepDate}>{formatShortDate(step.actionAt)}</Text>
        ) : null}
        {step.notes ? (
          <View style={sd.stepNotes}>
            <Text style={sd.stepNotesText}>"{step.notes}"</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ConfirmModal({
  action,
  data,
  note,
  isPending,
  onConfirm,
  onCancel,
}: {
  action: 'approve' | 'reject';
  data: ApprovalVM;
  note: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isApprove = action === 'approve';
  const color = isApprove ? GREEN : RED;
  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={sd.modalOverlay} onPress={onCancel}>
        <Pressable style={sd.modalBox} onPress={() => {}}>
          <View style={[sd.modalIcon, { backgroundColor: isApprove ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.1)' }]}>
            <Ionicons name={isApprove ? 'checkmark' : 'close'} size={32} color={color} />
          </View>
          <Text style={sd.modalTitle}>
            {isApprove ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan'}
          </Text>
          <Text style={sd.modalDesc}>
            {isApprove
              ? `Anda akan menyetujui pengajuan dari ${data.requesterName}. Tindakan ini tidak dapat dibatalkan.`
              : `Anda akan menolak pengajuan dari ${data.requesterName}. Pemohon akan diberitahu dengan catatan Anda.`}
          </Text>
          <View style={sd.modalSummary}>
            <AvatarCircle name={data.requesterName} size={32} />
            <View style={{ flex: 1 }}>
              <Text style={sd.modalSummaryName}>{data.requesterName}</Text>
              <Text style={sd.modalSummaryMeta}>{data.module === 'overtime' ? 'Lembur' : 'Cuti'} · {formatShortDate(data.startDate)}</Text>
            </View>
            <StatusBadge status={isApprove ? 'approved' : 'rejected'} />
          </View>
          {note.trim().length > 0 && (
            <View style={[sd.modalNote, { backgroundColor: isApprove ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.05)', borderColor: isApprove ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.15)' }]}>
              <Text style={{ fontSize: 12, color: '#555', lineHeight: 20 }}>
                <Text style={{ fontWeight: '700', color }}>Catatan: </Text>
                "{note}"
              </Text>
            </View>
          )}
          <View style={sd.modalActions}>
            <Pressable style={sd.modalCancelBtn} onPress={onCancel} disabled={isPending}>
              <Text style={sd.modalCancelText}>Batal</Text>
            </Pressable>
            <Pressable
              style={[sd.modalConfirmBtn, { backgroundColor: isApprove ? GREEN : RED }]}
              onPress={onConfirm}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={sd.modalConfirmText}>
                  {isApprove ? '✓ Ya, Setujui' : '✕ Ya, Tolak'}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const ApprovalDetailScreen = ({ navigation, route }: Props) => {
  const { stepId, module } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'detail' | 'progress'>('detail');
  const [noteText, setNoteText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAction, setSuccessAction] = useState<'approve' | 'reject'>('approve');
  const [isAttachmentPreviewOpen, setIsAttachmentPreviewOpen] = useState(false);

  const leaveQuery = useQuery({
    queryKey: ['leave-approval-detail', stepId],
    queryFn: () => getLeaveApprovalDetail(stepId),
    enabled: module === 'leave',
  });

  const overtimeQuery = useQuery({
    queryKey: ['overtime-approval-detail', stepId],
    queryFn: () => getOvertimeApprovalDetail(stepId),
    enabled: module === 'overtime',
  });

  const isLoading = module === 'leave' ? leaveQuery.isLoading : overtimeQuery.isLoading;
  const queryError = module === 'leave' ? leaveQuery.error : overtimeQuery.error;

  const data: ApprovalVM | null = (() => {
    if (module === 'leave' && leaveQuery.data) return mapLeaveDetail(leaveQuery.data);
    if (module === 'overtime' && overtimeQuery.data) return mapOvertimeDetail(overtimeQuery.data);
    return null;
  })();

  useEffect(() => {
    if (queryError) showErrorModal(getErrorMessage(queryError));
  }, [queryError]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['leave-approvals'] });
    queryClient.invalidateQueries({ queryKey: ['overtime-approvals'] });
    queryClient.invalidateQueries({ queryKey: ['leave-approval-detail', stepId] });
    queryClient.invalidateQueries({ queryKey: ['overtime-approval-detail', stepId] });
  };

  const onSuccess = (action: 'approve' | 'reject') => {
    invalidateAll();
    setModalVisible(false);
    setSuccessAction(action);
    setShowSuccess(true);
    showToast('success', action === 'approve' ? 'Pengajuan berhasil disetujui.' : 'Pengajuan berhasil ditolak.');
  };

  const onError = (err: unknown) => {
    setModalVisible(false);
    showErrorModal(getErrorMessage(err as Error));
  };

  const leaveApproveMutation = useMutation({
    mutationFn: (notes: string) => approveLeave(stepId, { notes }),
    onSuccess: () => onSuccess('approve'),
    onError,
  });

  const leaveRejectMutation = useMutation({
    mutationFn: (notes: string) => rejectLeave(stepId, { notes }),
    onSuccess: () => onSuccess('reject'),
    onError,
  });

  const overtimeApproveMutation = useMutation({
    mutationFn: (notes: string) => approveOvertime(stepId, { notes }),
    onSuccess: () => onSuccess('approve'),
    onError,
  });

  const overtimeRejectMutation = useMutation({
    mutationFn: (notes: string) => rejectOvertime(stepId, { notes }),
    onSuccess: () => onSuccess('reject'),
    onError,
  });

  const isMutating =
    leaveApproveMutation.isPending ||
    leaveRejectMutation.isPending ||
    overtimeApproveMutation.isPending ||
    overtimeRejectMutation.isPending;

  const noteOk = noteText.trim().length >= MIN_NOTE_LENGTH;

  const handleConfirm = () => {
    if (module === 'leave') {
      if (pendingAction === 'approve') leaveApproveMutation.mutate(noteText);
      else if (pendingAction === 'reject') leaveRejectMutation.mutate(noteText);
    } else {
      if (pendingAction === 'approve') overtimeApproveMutation.mutate(noteText);
      else if (pendingAction === 'reject') overtimeRejectMutation.mutate(noteText);
    }
  };

  const attachmentUrl = resolveMediaUrl(data?.attachmentPath);
  const attachmentWidth = Math.min(width - 32, 520);
  const attachmentPreviewHeight = Math.round(attachmentWidth * 0.7);

  const attachmentExt = useMemo(() => {
    if (!attachmentUrl) return '';
    const withoutQuery = attachmentUrl.split('?')[0];
    const lastDot = withoutQuery.lastIndexOf('.');
    if (lastDot === -1) return '';
    return withoutQuery.slice(lastDot + 1).toLowerCase();
  }, [attachmentUrl]);

  const isImageAttachment = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
    attachmentExt
  );
  const isPdfAttachment = attachmentExt === 'pdf';
  const hasPreviewableAttachment = Boolean(attachmentUrl) && (isImageAttachment || isPdfAttachment);
  const canPreviewInApp =
    Boolean(attachmentUrl) && (isImageAttachment || (isPdfAttachment && Boolean(PdfPreview)));
  const attachmentName = useMemo(() => {
    if (!attachmentUrl) return 'Lampiran';
    const withoutQuery = attachmentUrl.split('?')[0];
    const parts = withoutQuery.split('/');
    return parts[parts.length - 1] || 'Lampiran';
  }, [attachmentUrl]);

  if (isLoading || !data) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5FA' }}>
        <ActivityIndicator color={WINE} size="large" />
      </View>
    );
  }

  const isLembur = data.module === 'overtime';
  const dateRange = data.startDate === data.endDate
    ? formatShortDate(data.startDate)
    : `${formatShortDate(data.startDate)} – ${formatShortDate(data.endDate)}`;
  const handleAttachmentPress = async () => {
    if (!attachmentUrl) {
      showErrorModal('Lampiran tidak tersedia.');
      return;
    }

    if (canPreviewInApp) {
      setIsAttachmentPreviewOpen(true);
      return;
    }

    try {
      await Linking.openURL(attachmentUrl);
    } catch {
      showErrorModal('Lampiran tidak bisa dibuka saat ini. Silakan coba lagi.');
    }
  };

  if (showSuccess) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F5FA' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
          <View style={[sd.successIcon, { backgroundColor: successAction === 'approve' ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.1)' }]}>
            <Ionicons name={successAction === 'approve' ? 'checkmark' : 'close'} size={40} color={successAction === 'approve' ? GREEN : RED} />
          </View>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={sd.successTitle}>
              {successAction === 'approve' ? 'Berhasil Disetujui!' : 'Berhasil Ditolak!'}
            </Text>
            <Text style={sd.successDesc}>Keputusan telah dikirim ke sistem.{'\n'}Pemohon akan mendapat notifikasi.</Text>
          </View>
          <View style={sd.successCard}>
            <AvatarCircle name={data.requesterName} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={sd.successCardName}>{data.requesterName}</Text>
              <Text style={sd.successCardSub}>{data.requestNo}</Text>
            </View>
            <StatusBadge status={successAction === 'approve' ? 'approved' : 'rejected'} />
          </View>
        </View>
        <View style={{ padding: 16, paddingBottom: tabBarHeight + insets.bottom + 16 }}>
          <Pressable style={sd.backBtn} onPress={() => navigation.goBack()}>
            <Text style={sd.backBtnText}>← Kembali ke Inbox</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {modalVisible && pendingAction && (
        <ConfirmModal
          action={pendingAction}
          data={data}
          note={noteText}
          isPending={isMutating}
          onConfirm={handleConfirm}
          onCancel={() => setModalVisible(false)}
        />
      )}

      <Modal
        visible={isAttachmentPreviewOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsAttachmentPreviewOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            paddingHorizontal: 16,
            paddingTop: 32,
            paddingBottom: 20,
          }}
        >
          <View style={sd.previewHeader}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={sd.previewTitle}>Lampiran</Text>
              <Text style={sd.previewSubtitle}>{attachmentName}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsAttachmentPreviewOpen(false)}
              style={sd.previewCloseButton}
            >
              <Text style={sd.previewCloseText}>Tutup</Text>
            </TouchableOpacity>
          </View>
          <View style={sd.previewBody}>
            {isAttachmentPreviewOpen && attachmentUrl && isImageAttachment ? (
              <Image
                source={{ uri: attachmentUrl }}
                style={sd.previewImage}
                resizeMode="contain"
              />
            ) : isAttachmentPreviewOpen && attachmentUrl && isPdfAttachment && PdfPreview ? (
              <View style={sd.previewPdfWrap}>
                <PdfPreview
                  source={{ uri: attachmentUrl }}
                  style={{ flex: 1 }}
                  trustAllCerts={false}
                />
              </View>
            ) : (
              <Text style={sd.previewUnavailableText}>Pratinjau lampiran tidak tersedia.</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={[sd.header, { paddingTop: insets.top + 12 }]}>
        <View style={StyleSheet.absoluteFillObject}>
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: WINE_DARK }]} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: WINE, opacity: 0.45 }]} />
        </View>
        <View style={sd.decCircle} />
        <Pressable style={sd.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={14} color="#fff" />
          <Text style={sd.backButtonText}>Inbox</Text>
        </Pressable>
        <View style={sd.headerBody}>
          <Text style={sd.requestNo}>{data.requestNo}</Text>
          <Text style={sd.headerTitle}>
            Detail {isLembur ? 'Pengajuan Lembur' : 'Pengajuan Cuti'}
          </Text>
          <View style={sd.headerBadgeRow}>
            <ModuleBadge module={data.module} />
            <StatusBadge status={data.status} />
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={sd.tabRow}>
        {([['detail', '📋 Detail'], ['progress', '🔄 Progress']] as const).map(([tabId, label]) => (
          <Pressable key={tabId} style={sd.tab} onPress={() => setActiveTab(tabId)}>
            <Text style={[sd.tabLabel, activeTab === tabId && { color: WINE }]}>{label}</Text>
            <View style={[sd.tabUnderline, activeTab === tabId && { backgroundColor: WINE }]} />
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: '#F5F5FA' }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: tabBarHeight + insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {activeTab === 'detail' && (
          <View>
            {/* Pemohon */}
            <View style={sd.section}>
              <Text style={sd.sectionLabel}>PEMOHON</Text>
              <View style={sd.pemohonRow}>
                <AvatarCircle name={data.requesterName} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={sd.pemohonName}>{data.requesterName}</Text>
                  {data.requesterRole ? <Text style={sd.pemohonRole}>{data.requesterRole}</Text> : null}
                  <View style={sd.submitRow}>
                    <Ionicons name="calendar-outline" size={11} color="#9CA3AF" />
                    <Text style={sd.submitText}>Diajukan {formatShortDate(data.submittedAt)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Rincian */}
            <View style={sd.section}>
              <Text style={sd.sectionLabel}>RINCIAN</Text>
              <View style={sd.grid}>
                <View style={sd.gridCell}>
                  <View style={sd.gridLabelRow}>
                    <Ionicons name="calendar-outline" size={11} color="#D1D5DB" />
                    <Text style={sd.gridLabel}>Tanggal</Text>
                  </View>
                  <Text style={sd.gridValue}>{dateRange}</Text>
                </View>
                <View style={sd.gridCell}>
                  <View style={sd.gridLabelRow}>
                    <Ionicons name="time-outline" size={11} color="#D1D5DB" />
                    <Text style={sd.gridLabel}>Durasi</Text>
                  </View>
                  <Text style={[sd.gridValue, { color: BLUE, fontWeight: '700' }]}>{data.durationLabel}</Text>
                </View>
                <View style={sd.gridCell}>
                  <View style={sd.gridLabelRow}>
                    <Text style={{ color: '#D1D5DB', fontSize: 11 }}>📌</Text>
                    <Text style={sd.gridLabel}>{isLembur ? 'Tipe Lembur' : 'Tipe Cuti'}</Text>
                  </View>
                  <Text style={sd.gridValue}>{isLembur ? 'Lembur' : 'Cuti'}</Text>
                </View>
                {isLembur && data.startTime && data.endTime && (
                  <View style={sd.gridCell}>
                    <View style={sd.gridLabelRow}>
                      <Ionicons name="time-outline" size={11} color="#D1D5DB" />
                      <Text style={sd.gridLabel}>Waktu</Text>
                    </View>
                    <Text style={sd.gridValue}>{data.startTime} – {data.endTime}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Alasan */}
            <View style={sd.section}>
              <Text style={sd.sectionLabel}>ALASAN</Text>
              <Text style={sd.alasanText}>{data.reason}</Text>
            </View>

            {/* Lampiran */}
            <View style={sd.section}>
              <Text style={sd.sectionLabel}>LAMPIRAN</Text>
              {data.attachmentPath ? (
                <Pressable style={sd.attachment} onPress={() => void handleAttachmentPress()}>
                  <Text style={{ fontSize: 18 }}>
                    {isImageAttachment ? '🖼️' : isPdfAttachment ? '📄' : '📎'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={sd.attachmentName}>{attachmentName}</Text>
                    <Text style={sd.attachmentHint}>Ketuk untuk membuka</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={BLUE} />
                </Pressable>
              ) : (
                <Text style={sd.noAttachment}>Tidak ada lampiran</Text>
              )}
              {hasPreviewableAttachment && isImageAttachment ? (
                <Pressable
                  onPress={() => void handleAttachmentPress()}
                  style={{ marginTop: 10 }}
                >
                  <Image
                    source={{ uri: attachmentUrl }}
                    style={{
                      width: attachmentWidth,
                      height: attachmentPreviewHeight,
                      borderRadius: 12,
                      backgroundColor: '#f1f5f9',
                    }}
                    resizeMode="cover"
                  />
                </Pressable>
              ) : hasPreviewableAttachment && isPdfAttachment ? (
                <Pressable
                  onPress={() => void handleAttachmentPress()}
                  style={sd.attachmentPreviewCard}
                >
                  <Text style={sd.attachmentPreviewTitle}>PDF</Text>
                  <Text style={sd.attachmentPreviewHint}>Ketuk untuk pratinjau</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Approved note */}
            {data.status === 'approved' && (
              <View style={[sd.noteBox, { backgroundColor: 'rgba(22,163,74,0.06)', borderColor: 'rgba(22,163,74,0.2)' }]}>
                <Text style={[sd.noteBoxLabel, { color: GREEN }]}>✓ CATATAN PERSETUJUAN</Text>
                <Text style={sd.noteBoxText}>{data.approvalNote || 'Tidak ada catatan tambahan.'}</Text>
              </View>
            )}

            {/* Rejected note */}
            {data.status === 'rejected' && data.rejectionReason && (
              <View style={[sd.noteBox, { backgroundColor: 'rgba(220,38,38,0.05)', borderColor: 'rgba(220,38,38,0.15)' }]}>
                <Text style={[sd.noteBoxLabel, { color: RED }]}>✕ ALASAN PENOLAKAN</Text>
                <Text style={sd.noteBoxText}>{data.rejectionReason}</Text>
              </View>
            )}

            {/* Action area — pending only */}
            {data.canTakeAction && (
              <View style={sd.actionArea}>
                <Text style={sd.actionTitle}>Tindakan Persetujuan</Text>
                <Text style={sd.actionHint}>Catatan wajib diisi untuk penolakan (min. {MIN_NOTE_LENGTH} karakter)</Text>
                <TextInput
                  style={[sd.noteInput, noteText.length > 0 && noteOk && { borderColor: 'rgba(22,163,74,0.4)', backgroundColor: 'rgba(22,163,74,0.02)' }]}
                  multiline
                  placeholder="Tambahkan catatan (wajib untuk penolakan)..."
                  placeholderTextColor="#9CA3AF"
                  value={noteText}
                  onChangeText={setNoteText}
                />
                {noteText.length > 0 && (
                  <Text style={[sd.noteCounter, { color: noteOk ? GREEN : AMBER }]}>
                    {noteOk ? `✓ ${noteText.trim().length} karakter` : `min. ${MIN_NOTE_LENGTH - noteText.trim().length} karakter lagi`}
                  </Text>
                )}
                <View style={sd.actionBtns}>
                  <Pressable
                    style={[sd.rejectBtn, !noteOk && { borderColor: '#E5E7EB', opacity: 0.5 }]}
                    onPress={() => { setPendingAction('reject'); setModalVisible(true); }}
                    disabled={!noteOk}
                  >
                    <Ionicons name="close" size={14} color={noteOk ? RED : '#9CA3AF'} />
                    <Text style={[sd.rejectBtnText, !noteOk && { color: '#9CA3AF' }]}>Tolak</Text>
                  </Pressable>
                  <Pressable
                    style={sd.approveBtn}
                    onPress={() => { setPendingAction('approve'); setModalVisible(true); }}
                  >
                    <Ionicons name="checkmark" size={14} color="#fff" />
                    <Text style={sd.approveBtnText}>Setujui</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'progress' && (
          <View style={[sd.section, { marginTop: 14 }]}>
            <Text style={sd.stepperTitle}>Alur Persetujuan</Text>
            <Text style={sd.stepperSub}>
              {data.status === 'pending' ? 'Menunggu persetujuan pada step aktif' : data.status === 'approved' ? 'Semua step telah selesai' : 'Pengajuan ditolak'}
            </Text>
            {data.steps.map((step, index) => (
              <StepRow
                key={step.stepNo}
                step={step}
                index={index}
                isLast={index === data.steps.length - 1}
                overallStatus={data.status}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const sd = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  decCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  headerBody: {
    gap: 4,
  },
  requestNo: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'monospace',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  headerBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    paddingVertical: 12,
  },
  tabUnderline: {
    height: 2.5,
    width: '100%',
    backgroundColor: 'transparent',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: 12,
  },
  pemohonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  pemohonName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  pemohonRole: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  submitText: {
    fontSize: 10.5,
    color: '#9CA3AF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCell: {
    width: '47%',
  },
  gridLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  gridLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  alasanText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 22,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: '600',
    color: BLUE,
  },
  attachmentHint: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  attachmentPreviewCard: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
  },
  attachmentPreviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  attachmentPreviewHint: {
    marginTop: 4,
    fontSize: 11,
    color: '#2563EB',
  },
  noAttachment: {
    fontSize: 12,
    color: '#D1D5DB',
    fontStyle: 'italic',
  },
  previewHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#CBD5E1',
  },
  previewCloseButton: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  previewCloseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#0F172A',
  },
  previewPdfWrap: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 16,
  },
  previewUnavailableText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  noteBox: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  noteBoxLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: 6,
  },
  noteBoxText: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionArea: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  actionHint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  noteInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    minHeight: 88,
    fontSize: 12.5,
    lineHeight: 22,
    color: '#111827',
    backgroundColor: '#FAFAFA',
    textAlignVertical: 'top',
  },
  noteCounter: {
    fontSize: 10.5,
    textAlign: 'right',
    marginTop: 4,
    fontWeight: '600',
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(220,38,38,0.4)',
    backgroundColor: 'rgba(220,38,38,0.05)',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: RED,
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 12.5,
    color: '#9CA3AF',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  modalSummaryName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  modalSummaryMeta: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  modalNote: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  modalConfirmBtn: {
    flex: 2,
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  stepperTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  stepperSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepLeft: {
    alignItems: 'center',
    width: 28,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  stepName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  stepTagActive: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  stepTagTextActive: {
    fontSize: 9,
    fontWeight: '700',
    color: BLUE,
  },
  stepTagDone: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(22,163,74,0.1)',
  },
  stepTagTextDone: {
    fontSize: 9,
    fontWeight: '700',
    color: GREEN,
  },
  stepTagRejected: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(220,38,38,0.1)',
  },
  stepTagTextRejected: {
    fontSize: 9,
    fontWeight: '700',
    color: RED,
  },
  stepPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  stepPersonText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  stepDate: {
    fontSize: 10.5,
    color: '#9CA3AF',
    marginTop: 2,
  },
  stepNotes: {
    marginTop: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  stepNotesText: {
    fontSize: 11.5,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  successDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 22,
    textAlign: 'center',
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    width: '100%',
  },
  successCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  successCardSub: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  backBtn: {
    backgroundColor: WINE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
