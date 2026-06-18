import { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NotificationsStackParamList } from '@/navigation/types';
import { NTYPE, GROUPS, MAROON } from '../types';
import { useNotifFeedStore } from '../notifFeedStore';
import { FilterBar } from '../components/FilterBar';
import { SwipeRow } from '../components/SwipeRow';
import { NotifRow } from '../components/NotifRow';
import { EmptyState } from '../components/EmptyState';

const MAROON_DARK  = '#3D0A12';
const WARM_BG      = '#F5F5F5';

type Props = NativeStackScreenProps<NotificationsStackParamList, 'NotificationsList'>;

export const NotificationsListScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const { notifs, markRead, markAll, dismiss } = useNotifFeedStore();
  const [filter, setFilter] = useState('all');

  const unread = notifs.filter(n => !n.read).length;
  const visible =
    filter === 'all'
      ? notifs
      : notifs.filter(n => NTYPE[n.type].deep === filter);

  const handleTap = useCallback(
    (id: string) => { markRead(id); },
    [markRead],
  );

  const handleMarkAll = useCallback(() => { markAll(); }, [markAll]);

  const renderGrouped = () => {
    const sections: React.ReactNode[] = [];
    GROUPS.forEach(g => {
      const items = visible.filter(n => n.group === g.id);
      if (!items.length) return;
      sections.push(
        <View key={g.id}>
          {/* Group label */}
          <View style={s.groupHeader}>
            <Text style={s.groupLabel}>{g.label}</Text>
            <View style={s.groupLine} />
            <Text style={s.groupCount}>{items.length}</Text>
          </View>
          {/* Rows */}
          {items.map(n => (
            <SwipeRow key={n.id} onDismiss={() => dismiss(n.id)}>
              <NotifRow
                notification={n}
                accent={MAROON}
                onTap={() => handleTap(n.id)}
              />
            </SwipeRow>
          ))}
        </View>,
      );
    });
    return sections;
  };

  const listPaddingBottom = Math.max(tabBarHeight + 24, insets.bottom + 100);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={MAROON_DARK} />

      {/* Hero header */}
      <View style={s.header}>
        {/* Gradient simulation: dark overlay fading from top */}
        <View style={s.headerGradTop} />
        <View style={s.headerDecor} />
        <View style={s.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Notifikasi</Text>
            <Text style={s.headerSub}>
              {unread > 0 ? `${unread} belum dibaca` : 'Semua sudah dibaca'}
            </Text>
          </View>
          <Pressable
            onPress={handleMarkAll}
            disabled={!unread}
            style={({ pressed }) => [s.markBtn, { opacity: !unread ? 0.45 : pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="checkmark-done-outline" size={14} color="#fff" />
            <Text style={s.markBtnText}>Tandai dibaca</Text>
          </Pressable>
        </View>
      </View>

      {/* Filter bar */}
      <View style={s.filterWrap}>
        <FilterBar
          filter={filter}
          onFilter={setFilter}
          notifs={notifs}
          accent={MAROON}
        />
      </View>

      {/* List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          s.listContent,
          { paddingBottom: listPaddingBottom },
          visible.length === 0 && { flex: 1 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {visible.length === 0 ? (
          <EmptyState accent={MAROON} />
        ) : (
          <View style={{ paddingTop: 2 }}>{renderGrouped()}</View>
        )}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WARM_BG,
  },
  header: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    backgroundColor: MAROON,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: MAROON_DARK,
    opacity: 0.55,
  },
  headerDecor: {
    position: 'absolute',
    top: -24,
    right: -18,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.66)',
    marginTop: 1,
  },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 11,
  },
  markBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  filterWrap: {
    backgroundColor: WARM_BG,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE4E6',
    paddingBottom: 2,
  },
  listContent: {},
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: '#9A9398',
  },
  groupLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  groupCount: {
    fontSize: 10.5,
    color: '#BBB',
    fontWeight: '700',
  },
});
