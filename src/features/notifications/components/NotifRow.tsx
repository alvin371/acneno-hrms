import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MAROON, NTYPE } from '../types';
import type { InAppNotification } from '../types';
import { StatusPill } from './StatusPill';
import { TypeChip } from './TypeChip';

interface Props {
  notification: InAppNotification;
  accent?: string;
  onTap: () => void;
}

export const NotifRow = ({ notification: n, accent = MAROON, onTap }: Props) => {
  const meta = NTYPE[n.type];

  return (
    <Pressable
      testID={`notif-row-${n.id}`}
      onPress={onTap}
      style={({ pressed }) => [
        s.card,
        n.read ? s.cardRead : s.cardUnread,
        pressed && s.cardPressed,
      ]}
    >
      <View testID={`notif-row-icon-${n.id}`} style={s.iconSlot}>
        <TypeChip type={n.type} size={40} />
      </View>

      <View testID={`notif-row-content-${n.id}`} style={s.contentSlot}>
        <View style={s.topRow}>
          <Text
            style={[s.title, !n.read && s.titleUnread]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {n.title}
          </Text>
          {n.pill ? (
            <View style={s.pillWrap}>
              <StatusPill text={n.pill} color={meta.color} />
            </View>
          ) : null}
        </View>

        <Text style={s.body} numberOfLines={2} ellipsizeMode="tail">
          {n.body}
        </Text>

        <Text style={s.timeText}>{n.time}</Text>

        {n.action ? (
          <View style={s.actionWrap}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onTap();
              }}
              style={[s.actionBtn, { backgroundColor: accent }]}
            >
              <Text style={s.actionText}>{n.action}</Text>
              <Ionicons name="chevron-forward" size={11} color="#fff" />
            </Pressable>
          </View>
        ) : null}
      </View>

      <View testID={`notif-row-trailing-${n.id}`} style={s.trailingSlot}>
        {!n.read ? (
          <View
            testID={`notif-row-unread-${n.id}`}
            style={[s.unreadDot, { backgroundColor: accent }]}
          />
        ) : null}
      </View>
    </Pressable>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#1a080d',
  },
  cardRead: {
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardUnread: {
    shadowOpacity: 0.09,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.82,
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
    width: 12,
    height: 40,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '700',
    color: '#1F1A1C',
  },
  titleUnread: {
    fontWeight: '800',
  },
  pillWrap: {
    marginLeft: 10,
    flexShrink: 0,
  },
  body: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#766D72',
  },
  timeText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    color: '#9A6C77',
  },
  actionWrap: {
    marginTop: 10,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
  },
  actionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#fff',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
});
