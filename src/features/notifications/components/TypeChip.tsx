import { View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NTYPE } from '../types';
import type { NotifType } from '../types';

interface Props {
  type: NotifType;
  size?: number;
}

export const TypeChip = ({ type, size = 38 }: Props) => {
  const m = NTYPE[type];
  const radius = Math.round(size * 0.29);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: m.bg,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Ionicons name={m.iconName} size={Math.round(size * 0.52)} color={m.color} />
    </View>
  );
};
