import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { cancelLeave, getLeaveQuota, getLeaves } from '@/features/leave/api';
import { getErrorMessage } from '@/api/error';
import { showToast } from '@/utils/toast';
import { showErrorModal } from '@/utils/errorModal';
import { useAuthStore } from '@/store/authStore';
import { StatusPill } from '@/features/leave/components/StatusPill';
import { COPY } from '@/features/leave/copy';
import { getLeaveMeta, normalizeStatus } from '@/features/leave/meta';
import { tokens } from '@/config/tokens';
import { fmtDate, monthKey, monthLabel } from '@/features/leave/utils/date';
import type { LeaveRecord, LeaveStatus } from '@/api/types';
import type { LeaveStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<LeaveStackParamList, 'LeaveList'>;

type FilterKey = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: COPY.filters.all },
  { key: 'pending', label: COPY.filters.pending },
  { key: 'approved', label: COPY.filters.approved },
  { key: 'rejected', label: COPY.filters.rejected },
  { key: 'cancelled', label: COPY.filters.cancelled },
];

const matchesFilter = (status: LeaveStatus | string, filter: FilterKey) => {
  if (filter === 'all') return true;
  return normalizeStatus(status) === filter;
};

export const LeaveListScreen = ({ navigation }: Props) => {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const leavesQuery = useQuery({
    queryKey: ['leave'],
    queryFn: getLeaves,
  });

  const quotaQuery = useQuery({
    queryKey: ['leave-quota'],
    queryFn: getLeaveQuota,
  });

  useEffect(() => {
    if (leavesQuery.error) {
      showErrorModal(getErrorMessage(leavesQuery.error));
    }
  }, [leavesQuery.error]);

  const cancelMutation = useMutation({
    mutationFn: cancelLeave,
    onSuccess: (response) => {
      showToast('success', response?.message || COPY.toasts.cancelled);
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      queryClient.invalidateQueries({ queryKey: ['leave-quota'] });
      setConfirmId(null);
    },
    onError: (e) => {
      showErrorModal(getErrorMessage(e));
      setConfirmId(null);
    },
  });

  const onRefresh = () => {
    void leavesQuery.refetch();
    void quotaQuery.refetch();
  };

  const counts = useMemo(() => {
    const map: Record<FilterKey, number> = {
      all: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    };
    (leavesQuery.data ?? []).forEach((l) => {
      map.all += 1;
      map[normalizeStatus(l.status)] += 1;
    });
    return map;
  }, [leavesQuery.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (leavesQuery.data ?? [])
      .filter((l) => matchesFilter(l.status, filter))
      .filter((l) => {
        if (!q) return true;
        return (
          l.leaveTypeName.toLowerCase().includes(q) ||
          l.reason.toLowerCase().includes(q) ||
          l.requestNo.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [leavesQuery.data, filter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; items: LeaveRecord[] }>();
    filtered.forEach((l) => {
      const key = monthKey(l.startDate);
      if (!map.has(key)) {
        map.set(key, { label: monthLabel(l.startDate), items: [] });
      }
      map.get(key)!.items.push(l);
    });
    return Array.from(map.values());
  }, [filtered]);

  const quotaCards = useMemo(() => {
    const items = quotaQuery.data?.quotas ?? [];
    return items.slice(0, 3).map((q) => {
      const meta = getLeaveMeta(q.leaveTypeCode);
      return {
        id: q.id,
        icon: meta.icon,
        label: q.leaveTypeName,
        remaining: q.remainingDays,
        total: q.totalDays,
      };
    });
  }, [quotaQuery.data]);

  const emptyKey: keyof typeof COPY.emptyList = filter;
  const empty = COPY.emptyList[emptyKey];

  const showSearch = searchOpen;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.colors.warmSurface }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: tokens.colors.maroon }} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: tabBarHeight + insets.bottom + 24,
        }}
        refreshControl={
          <RefreshControl
            refreshing={leavesQuery.isFetching || quotaQuery.isFetching}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={[tokens.colors.maroon]}
          />
        }
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <View>
              <Text style={styles.heroTitle}>{COPY.listTitle}</Text>
              <Text style={styles.heroSubtitle}>
                {user?.name ? `Halo, ${user.name.split(' ')[0]}` : COPY.listSubtitle}
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('LeaveCreate')}
              style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
              hitSlop={8}
              accessibilityLabel="Ajukan cuti"
              accessibilityRole="button"
            >
              <Text style={styles.fabIcon}>＋</Text>
              <Text style={styles.fabLabel}>Ajukan</Text>
            </Pressable>
          </View>

          {/* Quota strip */}
          <View style={styles.quotaStrip}>
            {quotaCards.length > 0 ? (
              quotaCards.map((q, i) => (
                <View
                  key={q.id}
                  style={[
                    styles.quotaCell,
                    i < quotaCards.length - 1 && styles.quotaCellBorder,
                  ]}
                >
                  <Text style={styles.quotaIcon}>{q.icon}</Text>
                  <Text style={styles.quotaValue}>
                    {q.remaining}
                    <Text style={styles.quotaTotal}>/{q.total}</Text>
                  </Text>
                  <Text style={styles.quotaLabel} numberOfLines={1}>
                    {q.label}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.quotaEmpty}>
                <Text style={styles.quotaEmptyText}>
                  {quotaQuery.isLoading ? 'Memuat kuota...' : COPY.quota.title}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Filter chips + search */}
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          >
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const count = counts[f.key];
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={[
                    styles.chip,
                    active && { backgroundColor: tokens.colors.maroon, borderColor: tokens.colors.maroon },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && { color: '#fff' },
                    ]}
                  >
                    {f.label}
                  </Text>
                  <View
                    style={[
                      styles.chipBadge,
                      active && { backgroundColor: 'rgba(255,255,255,0.25)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipBadgeText,
                        active && { color: '#fff' },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable
            onPress={() => setSearchOpen((v) => !v)}
            style={styles.searchToggle}
            hitSlop={8}
            accessibilityLabel={showSearch ? 'Tutup pencarian' : 'Cari cuti'}
            accessibilityRole="button"
          >
            <Text style={styles.searchToggleIcon}>{showSearch ? '✕' : '🔍'}</Text>
          </Pressable>
        </View>

        {showSearch ? (
          <View style={styles.searchWrap}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={COPY.searchPlaceholder}
              placeholderTextColor={tokens.colors.textMuted}
              style={styles.searchInput}
              autoFocus
              underlineColorAndroid="transparent"
              accessibilityLabel={COPY.searchPlaceholder}
            />
          </View>
        ) : null}

        {/* List */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 16 }}>
          {leavesQuery.isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : grouped.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>{empty.title}</Text>
              <Text style={styles.emptySubtitle}>{empty.subtitle}</Text>
              {filter === 'all' ? (
                <Pressable
                  onPress={() => navigation.navigate('LeaveCreate')}
                  style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.8 }]}
                  accessibilityLabel={COPY.applyNew}
                  accessibilityRole="button"
                >
                  <Text style={styles.emptyCtaText}>{COPY.applyNew}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            grouped.map((group) => (
              <View key={group.label} style={{ gap: 10 }}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                {group.items.map((leave) => (
                  <LeaveCard
                    key={leave.id}
                    leave={leave}
                    onView={() =>
                      navigation.navigate('LeaveDetail', { id: leave.id })
                    }
                    onCancel={() => setConfirmId(leave.id)}
                    cancelLoading={
                      cancelMutation.isPending &&
                      cancelMutation.variables === leave.id
                    }
                  />
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Cancel confirm */}
      <Modal
        visible={confirmId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>⚠️</Text>
            <Text style={styles.modalTitle}>{COPY.confirmCancel.title}</Text>
            <Text style={styles.modalMessage}>{COPY.confirmCancel.message}</Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setConfirmId(null)}
                style={({ pressed }) => [styles.modalCancelBtn, pressed && { opacity: 0.7 }]}
                disabled={cancelMutation.isPending}
                accessibilityRole="button"
              >
                <Text style={styles.modalCancelText}>{COPY.confirmCancel.keep}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (confirmId != null) cancelMutation.mutate(confirmId);
                }}
                style={({ pressed }) => [styles.modalConfirmBtn, pressed && { opacity: 0.8 }]}
                disabled={cancelMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel={cancelMutation.isPending ? 'Memproses pembatalan' : COPY.confirmCancel.confirm}
              >
                <Text style={styles.modalConfirmText}>
                  {cancelMutation.isPending ? '...' : COPY.confirmCancel.confirm}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

function LeaveCard({
  leave,
  onView,
  onCancel,
  cancelLoading,
}: {
  leave: LeaveRecord;
  onView: () => void;
  onCancel: () => void;
  cancelLoading: boolean;
}) {
  const meta = getLeaveMeta(leave.leaveTypeCode);
  const statusKind = normalizeStatus(leave.status);
  const isPending = statusKind === 'pending';

  return (
    <Pressable
      onPress={onView}
      style={({ pressed }) => [styles.leaveCard, pressed && { opacity: 0.92 }]}
      accessibilityLabel={`${leave.leaveTypeName}, ${leave.requestNo}`}
      accessibilityRole="button"
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.typeChip,
            { backgroundColor: meta.bg, borderColor: meta.border },
          ]}
        >
          <Text style={styles.typeChipIcon}>{meta.icon}</Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={styles.typeName} numberOfLines={1}>
            {leave.leaveTypeName}
          </Text>
          <Text style={styles.requestNo} numberOfLines={1}>
            {leave.requestNo}
          </Text>
        </View>
        <StatusPill status={leave.status} />
      </View>

      <View style={styles.dateRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.dateRange}>
            {fmtDate(leave.startDate)}{' '}
            <Text style={styles.dateArrow}>→</Text>{' '}
            {fmtDate(leave.endDate)}
          </Text>
        </View>
        <View style={styles.daysChip}>
          <Text style={styles.daysChipText}>{leave.daysCount} hari</Text>
        </View>
      </View>

      {leave.reason ? (
        <Text style={styles.reasonText} numberOfLines={2}>
          {leave.reason}
        </Text>
      ) : null}

      {isPending ? (
        <View style={styles.cardFooter}>
          <Pressable
            onPress={onCancel}
            disabled={cancelLoading}
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.75 }]}
            accessibilityLabel={cancelLoading ? 'Memproses pembatalan...' : COPY.cancel}
            accessibilityRole="button"
          >
            <Text style={styles.cancelBtnText}>
              {cancelLoading ? '...' : COPY.cancel}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

function SkeletonCard() {
  return (
    <View
      style={[styles.leaveCard, { gap: 12 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.cardHeader}>
        <View style={styles.skeletonIcon} />
        <View style={{ flex: 1, paddingHorizontal: 12, gap: 6 }}>
          <View style={[styles.skeletonLine, { width: '55%' }]} />
          <View style={[styles.skeletonLine, { width: '35%', height: 9 }]} />
        </View>
        <View style={[styles.skeletonLine, { width: 68, height: 22, borderRadius: 999 }]} />
      </View>
      <View style={[styles.skeletonLine, { width: '65%' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: tokens.colors.maroon,
  },
  heroContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 4,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  fabIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: -1,
  },
  fabLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  quotaStrip: {
    marginHorizontal: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
  },
  quotaCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  quotaCellBorder: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.12)',
  },
  quotaIcon: { fontSize: 20, marginBottom: 4 },
  quotaValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  quotaTotal: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  quotaLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  quotaEmpty: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  quotaEmptyText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: tokens.colors.warmSurface,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.colors.borderWarm,
    backgroundColor: '#fff',
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: tokens.colors.ink,
  },
  chipBadge: {
    minWidth: 20,
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 9,
    backgroundColor: '#F2F0ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: tokens.colors.textSub,
  },
  searchToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  searchToggleIcon: { fontSize: 16 },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.borderWarm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: tokens.colors.ink,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    paddingHorizontal: 4,
  },
  leaveCard: {
    backgroundColor: '#fff',
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.card,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F2EDEE',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeChip: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipIcon: { fontSize: 18 },
  typeName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: tokens.colors.ink,
  },
  requestNo: {
    fontSize: 11,
    color: tokens.colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateRange: {
    fontSize: 13,
    color: tokens.colors.ink,
    fontWeight: '600',
  },
  dateArrow: {
    color: tokens.colors.maroon,
    fontWeight: '800',
  },
  daysChip: {
    backgroundColor: '#F0E8EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  daysChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.maroon,
  },
  reasonText: {
    fontSize: 12.5,
    color: tokens.colors.textSub,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F2EDEE',
    marginHorizontal: -tokens.spacing.card,
    paddingHorizontal: tokens.spacing.card,
    paddingTop: 12,
    paddingBottom: 4,
  },
  cancelBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
    backgroundColor: '#FFE4E6',
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#BE123C',
  },
  skeletonIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EDE8E6',
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EDE8E6',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: tokens.radius.card,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F2EDEE',
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.ink,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: tokens.colors.textSub,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 12,
    backgroundColor: tokens.colors.maroon,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyCtaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalEmoji: { fontSize: 36, marginBottom: 10 },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: tokens.colors.ink,
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 13,
    color: tokens.colors.textSub,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: tokens.colors.borderWarm,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.textSub,
  },
  modalConfirmBtn: {
    flex: 1.4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#BE123C',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});

