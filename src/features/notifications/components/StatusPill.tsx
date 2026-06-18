import { View, Text } from 'react-native';

interface Props {
  text: string;
  color: string;
}

export const StatusPill = ({ text, color }: Props) => (
  <View
    style={{
      borderRadius: 7,
      backgroundColor: color + '1A',
      paddingHorizontal: 7,
      paddingVertical: 3,
      alignSelf: 'flex-start',
    }}
  >
    <Text
      style={{
        fontSize: 9.5,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color,
      }}
    >
      {text}
    </Text>
  </View>
);
