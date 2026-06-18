import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useContext } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MAROON } from '../types';
import type { InAppNotification } from '../types';
import { TypeChip } from './TypeChip';

interface Props {
  visible: boolean;
  notifs: InAppNotification[];
  onClose: () => void;
  onViewAll: () => void;
  onMarkAll: () => void;
  onTapItem: (n: InAppNotification) => void;
}

const MAX_ITEMS = 4;
const CARD_MAX_WIDTH = 360;
const HORIZONTAL_INSET = 16;
const CARD_TOP_OFFSET = 60;
const CARD_MIN_HEIGHT = 240;
const CARD_HEIGHT_RATIO = 0.66;
const CARD_MIN_BOTTOM_GAP = 24;

export const MiniboxDropdown = ({
  visible,
  notifs,
  onClose,
  onViewAll,
  onMarkAll,
  onTapItem,
}: Props) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;

  const unread = notifs.filter(n => !n.read).length;
  const items = notifs.slice(0, MAX_ITEMS);
  const popoverWidth = Math.min(windowWidth - HORIZONTAL_INSET * 2, CARD_MAX_WIDTH);
  const topOffset = insets.top + CARD_TOP_OFFSET;
  const bottomGap = Math.max(
    insets.bottom + CARD_MIN_BOTTOM_GAP,
    tabBarHeight + CARD_MIN_BOTTOM_GAP,
  );
  const maxHeight = Math.max(
    CARD_MIN_HEIGHT,
    Math.min(windowHeight * CARD_HEIGHT_RATIO, windowHeight - topOffset - bottomGap),
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={s.overlay} pointerEvents="box-none">
        <Pressable style={s.backdrop} onPress={onClose} />

        <View pointerEvents="box-none" style={s.cardLayer}>
          <Pressable
            testID="notification-popover-card"
            style={[
              s.card,
              {
                top: topOffset,
                right: HORIZONTAL_INSET,
                width: popoverWidth,
                maxHeight,
              },
            ]}
            onPress={e => e.stopPropagation()}
          >
            <View style={s.header}>
              <View style={s.headerLeft}>
                <Ionicons name="notifications-outline" size={18} color={MAROON} />
                <Text style={s.headerTitle}>Notifikasi</Text>
                {unread > 0 ? (
                  <View style={s.unreadBadge}>
                    <Text style={s.unreadBadgeText}>{unread}</Text>
                  </View>
                ) : null}
              </View>

              <Pressable
                onPress={onMarkAll}
                disabled={!unread}
                style={({ pressed }) => [
                  s.markButton,
                  !unread && s.markButtonDisabled,
                  pressed && unread > 0 && s.pressed,
                ]}
              >
                <Ionicons name="checkmark-done-outline" size={14} color={MAROON} />
                <Text style={s.markText}>Tandai</Text>
              </Pressable>
            </View>

            <View testID="notification-popover-scroll-area" style={s.listViewport}>
              {items.length === 0 ? (
                <View testID="notification-popover-empty-state" style={s.emptyState}>
                  <View style={s.emptyIconWrap}>
                    <Ionicons name="notifications-outline" size={28} color={MAROON} />
                  </View>
                  <Text style={s.emptyTitle}>Belum ada notifikasi</Text>
                  <Text style={s.emptyBody}>
                    Notifikasi baru akan muncul di sini saat tersedia.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={s.listScroll}
                  contentContainerStyle={s.listContent}
                  showsVerticalScrollIndicator={false}
                  bounces={items.length > 2}
                >
                  {items.map((n, index) => (
                    <Pressable
                      key={n.id}
                      testID={`notification-row-${n.id}`}
                      onPress={() => onTapItem(n)}
                      style={({ pressed }) => [
                        s.itemCard,
                        !n.read && s.itemCardUnread,
                        index < items.length - 1 && s.itemGap,
                        pressed && s.pressed,
                      ]}
                    >
                      <View testID={`notification-row-icon-${n.id}`} style={s.iconSlot}>
                        <TypeChip type={n.type} size={40} />
                      </View>

                      <View testID={`notification-row-content-${n.id}`} style={s.contentSlot}>
                        <Text
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          style={[s.itemTitle, !n.read && s.itemTitleUnread]}
                        >
                          {n.title}
                        </Text>
                        <Text
                          numberOfLines={2}
                          ellipsizeMode="tail"
                          style={s.itemBody}
                        >
                          {n.body}
                        </Text>
                        <Text style={s.itemTime}>{n.time}</Text>
                      </View>

                      <View testID={`notification-row-trailing-${n.id}`} style={s.trailingSlot}>
                        {!n.read ? (
                          <View
                            testID={`notification-row-unread-${n.id}`}
                            style={s.unreadDot}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            <Pressable
              testID="notification-popover-footer"
              onPress={onViewAll}
              style={({ pressed }) => [s.footer, pressed && s.pressed]}
            >
              <Text style={s.footerText}>Lihat semua notifikasi</Text>
              <Ionicons name="chevron-forward" size={14} color={MAROON} />
            </Pressable>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 11, 14, 0.52)',
  },
  cardLayer: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#1E0C12',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE5E8',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    marginLeft: 8,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: '#23181C',
  },
  unreadBadge: {
    marginLeft: 8,
    minWidth: 20,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MAROON,
  },
  unreadBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  markButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 12,
  },
  markButtonDisabled: {
    opacity: 0.4,
  },
  markText: {
    marginLeft: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: MAROON,
  },
  listViewport: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#FFFFFF',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyState: {
    flex: 1,
    minHeight: CARD_MIN_HEIGHT - 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(107,26,43,0.1)',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    color: '#23181C',
  },
  emptyBody: {
    marginTop: 6,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#766D72',
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FCFAFA',
    borderWidth: 1,
    borderColor: '#F0E7EA',
  },
  itemCardUnread: {
    backgroundColor: '#F8F1F3',
    borderColor: '#EAD9DF',
  },
  itemGap: {
    marginBottom: 14,
  },
  iconSlot: {
    width: 40,
    height: 40,
    marginRight: 12,
    flexShrink: 0,
  },
  contentSlot: {
    flex: 1,
    minWidth: 0,
  },
  trailingSlot: {
    width: 8,
    height: 40,
    marginLeft: 12,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: '#23181C',
  },
  itemTitleUnread: {
    fontWeight: '800',
  },
  itemBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#6E6268',
  },
  itemTime: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: '#8D5F6A',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: MAROON,
  },
  footer: {
    minHeight: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE5E8',
    backgroundColor: '#FFFFFF',
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: MAROON,
    marginRight: 6,
  },
  pressed: {
    opacity: 0.72,
  },
});
