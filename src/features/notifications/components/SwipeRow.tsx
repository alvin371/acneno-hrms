import { View, Text, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';

const DANGER = '#BE123C';

interface Props {
  children: React.ReactNode;
  onDismiss: () => void;
}

const RightAction = () => (
  <View style={s.rightAction}>
    <Ionicons name="trash-outline" size={18} color="#fff" />
    <Text style={s.rightActionText}>HAPUS</Text>
  </View>
);

export const SwipeRow = ({ children, onDismiss }: Props) => (
  <Swipeable
    renderRightActions={() => <RightAction />}
    onSwipeableOpen={dir => { if (dir === 'right') onDismiss(); }}
    rightThreshold={80}
    friction={2}
    overshootRight={false}
    overshootFriction={8}
    containerStyle={s.container}
    childrenContainerStyle={s.card}
  >
    {children}
  </Swipeable>
);

const s = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 9,
  },
  card: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  rightAction: {
    backgroundColor: DANGER,
    borderRadius: 15,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
  },
  rightActionText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: '#fff',
  },
});
