import { View } from 'react-native';

const MAROON = '#6B1A2B';
const EMPTY = '#E8E0E2';

type PinDotsProps = {
  length?: number;
  filledCount: number;
};

export const PinDots = ({ length = 6, filledCount }: PinDotsProps) => {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
      {Array.from({ length }, (_, i) => (
        <View
          key={i}
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: i < filledCount ? MAROON : EMPTY,
          }}
        />
      ))}
    </View>
  );
};
