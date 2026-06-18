import { Text, View } from 'react-native';
import type { LeaveStatus } from '@/api/types';
import { getStatusMeta } from '@/features/leave/meta';

type StatusPillProps = {
  status: LeaveStatus | string;
  size?: 'sm' | 'md';
  full?: boolean;
};

export const StatusPill = ({ status, size = 'sm', full = false }: StatusPillProps) => {
  const meta = getStatusMeta(status);
  const label = full ? meta.label : meta.short;
  const padX = size === 'sm' ? 8 : 12;
  const padY = size === 'sm' ? 4 : 6;
  const fontSize = size === 'sm' ? 11 : 12;
  const dotSize = size === 'sm' ? 6 : 7;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: meta.bg,
        paddingHorizontal: padX,
        paddingVertical: padY,
        borderRadius: 999,
        alignSelf: 'flex-start',
      }}
    >
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: meta.color,
        }}
      />
      <Text
        style={{
          fontSize,
          fontWeight: '700',
          color: meta.color,
        }}
      >
        {label}
      </Text>
    </View>
  );
};
