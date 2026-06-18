import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { FILTERS, NTYPE, MAROON } from '../types';
import type { InAppNotification } from '../types';

interface Props {
  filter: string;
  onFilter: (id: string) => void;
  notifs: InAppNotification[];
  accent?: string;
}

export const FilterBar = ({ filter, onFilter, notifs, accent = MAROON }: Props) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.container}
    >
      {FILTERS.map(f => {
        const on = filter === f.id;
        const unreadCount =
          f.id === 'all'
            ? notifs.filter(n => !n.read).length
            : notifs.filter(n => NTYPE[n.type].deep === f.id && !n.read).length;
        return (
          <Pressable key={f.id} onPress={() => onFilter(f.id)} style={s.pill}>
            <View
              style={[
                s.pillInner,
                on ? s.pillActive : s.pillInactive,
              ]}
            >
              <Text style={[s.pillText, { color: on ? '#fff' : '#6A6066' }]}>
                {f.label}
              </Text>
              {unreadCount > 0 && (
                <View
                  style={[
                    s.badge,
                    {
                      backgroundColor: on ? 'rgba(255,255,255,0.28)' : accent + '18',
                    },
                  ]}
                >
                  <Text
                    style={[s.badgeText, { color: on ? '#fff' : accent }]}
                  >
                    {unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  pill: {
    flexShrink: 0,
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 11,
  },
  pillActive: {
    backgroundColor: MAROON,
    shadowColor: MAROON,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  pillInactive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    lineHeight: 16,
  },
});
