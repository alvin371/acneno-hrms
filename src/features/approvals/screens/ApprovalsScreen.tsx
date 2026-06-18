import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getLeaveApprovalHistory,
  getLeaveApprovals,
  getOvertimeApprovalHistory,
  getOvertimeApprovals,
} from '@/features/approvals/api';
import {
  getAvatarColor,
  getInitials,
  formatShortDate,
} from '@/features/approvals/utils';
import { getErrorMessage } from '@/api/error';
import { showErrorModal } from '@/utils/errorModal';
import type { ApprovalStackParamList } from '@/navigation/types';
import type {
  LeaveApprovalTaskItem,
  OvertimeApprovalTaskItem,
} from '@/api/types';

const WINE_DARK = '#5A0F1A';
const WINE = '#8B1F2F';
const AMBER = '#F59E0B';
const BLUE = '#3B82F6';
const GREEN = '#16A34A';
const RED = '#DC2626';
const PAGE_SIZE = 10;

type FilterType = 'all' | 'leave' | 'overtime';
type TabType = 'pending' | 'history';
type ApprovalModule = 'leave' | 'overtime';

type UnifiedItem = (LeaveApprovalTaskItem | OvertimeApprovalTaskItem) & {
  _module: ApprovalModule;
};

function deriveStatus(item: UnifiedItem): 'pending' | 'approved' | 'rejected' {
  if (item.canTakeAction) return 'pending';
  if (item.action === 'APPROVED') return 'approved';
  if (item.action === 'REJECTED') return 'rejected';
  return 'pending';
}

function moduleLabel(module: ApprovalModule) {
  return module === 'leave' ? 'Cuti' : 'Lembur';
}

function moduleIcon(module: ApprovalModule) {
  return module === 'leave' ? '🏖️' : '⏰';
}

type Props = NativeStackScreenProps<ApprovalStackParamList, 'ApprovalsList'>;

function TypeBadge({ module }: { module: ApprovalModule }) {
  const isOT = module === 'overtime';
  return (
    <View style={[s.badge, { backgroundColor: isOT ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)' }]}>
      <Text style={[s.badgeText, { color: isOT ? '#92400E' : '#1D4ED8' }]}>
        {moduleIcon(module)} {moduleLabel(module)}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const colors = {
    pending:  { bg: 'rgba(245,158,11,0.12)',  text: AMBER,  dot: '#F59E0B' },
    approved: { bg: 'rgba(22,163,74,0.12)',   text: GREEN,  dot: GREEN },
    rejected: { bg: 'rgba(220,38,38,0.12)',   text: RED,    dot: RED },
  };
  const c = colors[status];
  const label = status === 'pending' ? 'Menunggu' : status === 'approved' ? 'Disetujui' : 'Ditolak';
  return (
    <View style={[s.badge, { backgroundColor: c.bg, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c.dot }} />
      <Text style={[s.badgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

function AvatarCircle({ name, size = 42 }: { name: string; size?: number }) {
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: getAvatarColor(name) }]}>
      <Text style={[s.avatarText, { fontSize: size * 0.33 }]}>{getInitials(name)}</Text>
    </View>
  );
}

function getDateLabel(item: UnifiedItem): string {
  if (item._module === 'leave') {
    const leave = item as LeaveApprovalTaskItem;
    if (leave.startDate && leave.endDate && leave.startDate !== leave.endDate) {
      return `${formatShortDate(leave.startDate)} – ${formatShortDate(leave.endDate)}`;
    }
    return leave.startDate ? formatShortDate(leave.startDate) : '—';
  }
  const ot = item as OvertimeApprovalTaskItem;
  return ot.overtimeDate ? formatShortDate(ot.overtimeDate) : '—';
}

function getDurationLabel(item: UnifiedItem): string | null {
  if (item._module === 'leave') {
    const leave = item as LeaveApprovalTaskItem;
    return leave.daysCount != null ? `${leave.daysCount} hari` : null;
  }
  const ot = item as OvertimeApprovalTaskItem;
  return ot.durationHours != null ? `${ot.durationHours} jam` : null;
}

function RequestCard({ item, onPress }: { item: UnifiedItem; onPress: () => void }) {
  const requesterName = item.requesterName ?? '—';
  const status = deriveStatus(item);
  const isOT = item._module === 'overtime';
  const dateLabel = getDateLabel(item);
  const durationLabel = getDurationLabel(item);

  return (
    <Pressable style={({ pressed }) => [s.card, pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] }]} onPress={onPress}>
      <View style={[s.cardStripe, { backgroundColor: isOT ? AMBER : BLUE }]} />
      <View style={s.cardBody}>
        <View style={s.cardRow}>
          <AvatarCircle name={requesterName} />
          <View style={s.cardInfo}>
            <View style={s.cardNameRow}>
              <Text style={s.cardName} numberOfLines={1}>{requesterName}</Text>
              <StatusBadge status={status} />
            </View>
            {item._module === 'leave' && (item as LeaveApprovalTaskItem).requesterRole ? (
              <Text style={s.cardRole}>{(item as LeaveApprovalTaskItem).requesterRole}</Text>
            ) : null}
            <View style={s.cardBadgeRow}>
              <TypeBadge module={item._module} />
              <View style={s.cardMeta}>
                <Ionicons name="calendar-outline" size={11} color="#9CA3AF" />
                <Text style={s.cardMetaText}>{dateLabel}</Text>
              </View>
              {durationLabel ? (
                <View style={s.cardMeta}>
                  <Ionicons name="time-outline" size={11} color="#9CA3AF" />
                  <Text style={s.cardMetaText}>{durationLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
        {item.reason ? (
          <View style={s.reasonBox}>
            <Text style={s.reasonText} numberOfLines={2}>"{item.reason}"</Text>
          </View>
        ) : null}
        <View style={s.cardFooter}>
          <Text style={s.cardId} numberOfLines={1}>ID: {item.requestNo ?? item.stepId}</Text>
          <Text style={[s.cardCta, { color: status === 'pending' ? WINE : '#9CA3AF' }]}>
            {status === 'pending' ? 'Ketuk untuk review →' : 'Lihat detail →'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const ApprovalsScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  const { data: leavePending, error: leavePendingErr, isLoading: leavePendingLoading } = useQuery({
    queryKey: ['leave-approvals', 'pending'],
    queryFn: () => getLeaveApprovals({ status: 'pending' }),
  });

  const { data: leaveHistory, error: leaveHistoryErr, isLoading: leaveHistoryLoading } = useQuery({
    queryKey: ['leave-approvals', 'history'],
    queryFn: () => getLeaveApprovalHistory(),
  });

  const { data: overtimePending, error: overtimePendingErr, isLoading: overtimePendingLoading } = useQuery({
    queryKey: ['overtime-approvals', 'pending'],
    queryFn: () => getOvertimeApprovals({ status: 'pending' }),
  });

  const { data: overtimeHistory, error: overtimeHistoryErr, isLoading: overtimeHistoryLoading } = useQuery({
    queryKey: ['overtime-approvals', 'history'],
    queryFn: () => getOvertimeApprovalHistory(),
  });

  useEffect(() => {
    const err = activeTab === 'pending'
      ? (leavePendingErr ?? overtimePendingErr)
      : (leaveHistoryErr ?? overtimeHistoryErr);
    if (err) showErrorModal(getErrorMessage(err));
  }, [leavePendingErr, overtimePendingErr, leaveHistoryErr, overtimeHistoryErr, activeTab]);

  const pendingItems = useMemo<UnifiedItem[]>(() => {
    const leaveItems: UnifiedItem[] = (leavePending?.data ?? []).map(i => ({ ...i, _module: 'leave' as const }));
    const otItems: UnifiedItem[] = (overtimePending?.data ?? []).map(i => ({ ...i, _module: 'overtime' as const }));
    return [...leaveItems, ...otItems];
  }, [leavePending, overtimePending]);

  const historyItems = useMemo<UnifiedItem[]>(() => {
    const leaveItems: UnifiedItem[] = (leaveHistory?.data ?? []).map(i => ({ ...i, _module: 'leave' as const }));
    const otItems: UnifiedItem[] = (overtimeHistory?.data ?? []).map(i => ({ ...i, _module: 'overtime' as const }));
    return [...leaveItems, ...otItems];
  }, [leaveHistory, overtimeHistory]);

  const currentList = activeTab === 'pending' ? pendingItems : historyItems;
  const isLoading = activeTab === 'pending'
    ? (leavePendingLoading || overtimePendingLoading)
    : (leaveHistoryLoading || overtimeHistoryLoading);

  const displayedItems = useMemo(() => {
    if (activeFilter === 'all') return currentList;
    return currentList.filter(r => r._module === activeFilter);
  }, [currentList, activeFilter]);

  const pendingCount = pendingItems.length;
  const historyCount = historyItems.length;
  const totalPages = Math.max(1, Math.ceil(displayedItems.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, activeFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return displayedItems.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, displayedItems]);

  const approvedTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return historyItems.filter(r => r.action === 'APPROVED' && r.actionAt && new Date(r.actionAt).toDateString() === today).length;
  }, [historyItems]);

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'Semua' },
    { id: 'overtime', label: 'Lembur' },
    { id: 'leave', label: 'Cuti' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5FA' }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={StyleSheet.absoluteFillObject}>
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: WINE_DARK }]} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: WINE, opacity: 0.45 }]} />
        </View>
        <View style={s.decCircle1} />
        <View style={s.decCircle2} />

        <View style={s.headerContent}>
          <Text style={s.headerTitle}>Approval</Text>
          <Text style={s.headerSub}>Cuti & Lembur · Atasan Langsung</Text>
          <View style={s.statsRow}>
            <View style={s.statPill}>
              <Animated.View style={[s.pulseDot, { opacity: pulseAnim }]} />
              <Text style={s.statPillText}>{pendingCount} menunggu</Text>
            </View>
            <View style={[s.statPill, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={[s.statPillText, { color: 'rgba(255,255,255,0.8)' }]}>
                ✓ {approvedTodayCount} disetujui hari ini
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {([['pending', 'Menunggu', pendingCount], ['history', 'Riwayat', historyCount]] as const).map(([id, label, count]) => (
          <Pressable key={id} style={s.tab} onPress={() => setActiveTab(id as TabType)}>
            <View style={s.tabInner}>
              <Text style={[s.tabLabel, activeTab === id && { color: WINE }]}>{label}</Text>
              <View style={[s.countBadge, { backgroundColor: activeTab === id ? (id === 'pending' ? WINE : '#E5E7EB') : '#F3F4F6' }]}>
                <Text style={[s.countBadgeText, { color: activeTab === id ? (id === 'pending' ? '#fff' : '#374151') : '#9CA3AF' }]}>{count}</Text>
              </View>
            </View>
            <View style={[s.tabUnderline, activeTab === id && { backgroundColor: WINE }]} />
          </Pressable>
        ))}
      </View>

      {/* Filter chips */}
      <View style={s.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          {FILTERS.map(f => (
            <Pressable
              key={f.id}
              onPress={() => setActiveFilter(f.id)}
              style={[s.filterChip, activeFilter === f.id && { backgroundColor: WINE }]}
            >
              <Text style={[s.filterChipText, activeFilter === f.id && { color: '#fff' }]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={s.emptyContainer}>
          <Ionicons name="hourglass-outline" size={36} color="#D1D5DB" />
          <Text style={s.emptyTitle}>Memuat...</Text>
        </View>
      ) : displayedItems.length === 0 ? (
        <View style={s.emptyContainer}>
          <Text style={s.emptyIcon}>📭</Text>
          <Text style={s.emptyTitle}>Tidak ada pengajuan</Text>
          <Text style={s.emptySub}>Semua bersih untuk saat ini</Text>
        </View>
      ) : (
        <FlatList
          data={paginatedItems}
          keyExtractor={item => `${item._module}-${item.stepId}`}
          renderItem={({ item }) => (
            <RequestCard
              item={item}
              onPress={() => navigation.navigate('ApprovalDetail', { stepId: item.stepId, module: item._module })}
            />
          )}
          ListFooterComponent={
            displayedItems.length > PAGE_SIZE ? (
              <View style={s.paginationWrap}>
                <Text style={s.paginationSummary}>
                  Menampilkan {Math.min((currentPage - 1) * PAGE_SIZE + 1, displayedItems.length)}-
                  {Math.min(currentPage * PAGE_SIZE, displayedItems.length)} dari {displayedItems.length}
                </Text>
                <View style={s.paginationControls}>
                  <Pressable
                    onPress={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    style={[s.paginationButton, currentPage === 1 && s.paginationButtonDisabled]}
                  >
                    <Text style={[s.paginationButtonText, currentPage === 1 && s.paginationButtonTextDisabled]}>
                      Sebelumnya
                    </Text>
                  </Pressable>
                  <Text style={s.paginationPageText}>
                    Halaman {currentPage}/{totalPages}
                  </Text>
                  <Pressable
                    onPress={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage >= totalPages}
                    style={[s.paginationButton, currentPage >= totalPages && s.paginationButtonDisabled]}
                  >
                    <Text
                      style={[
                        s.paginationButtonText,
                        currentPage >= totalPages && s.paginationButtonTextDisabled,
                      ]}
                    >
                      Berikutnya
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null
          }
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 12,
            paddingBottom: tabBarHeight + insets.bottom + 32,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  decCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerContent: {
    position: 'relative',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FCD34D',
  },
  statPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#fff',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tab: {
    flex: 1,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tabUnderline: {
    height: 2.5,
    backgroundColor: 'transparent',
  },
  filterRow: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardStripe: {
    height: 4,
  },
  cardBody: {
    padding: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 11,
    alignItems: 'flex-start',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 2,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  cardRole: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
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
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardMetaText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  reasonBox: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  reasonText: {
    fontSize: 11.5,
    color: '#6B7280',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cardId: {
    fontSize: 10.5,
    color: '#D1D5DB',
    fontFamily: 'monospace',
    flex: 1,
  },
  cardCta: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  emptySub: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  paginationWrap: {
    marginHorizontal: 16,
    marginTop: 6,
    alignItems: 'center',
    gap: 10,
  },
  paginationSummary: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  paginationControls: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  paginationButton: {
    minWidth: 104,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paginationButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
  },
  paginationButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: WINE,
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  paginationPageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
});
