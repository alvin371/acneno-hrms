import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MAROON } from '../types';

interface Props {
  accent?: string;
}

export const EmptyState = ({ accent = MAROON }: Props) => (
  <View style={s.container}>
    <View style={[s.iconCircle, { backgroundColor: accent + '14' }]}>
      <Ionicons name="notifications-outline" size={46} color={accent} />
    </View>
    <Text style={s.title}>Tidak ada notifikasi</Text>
    <Text style={s.subtitle}>
      Belum ada notifikasi untuk ditampilkan.{'\n'}Kami akan kabari saat ada yang baru.
    </Text>
  </View>
);

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 70,
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3A3338',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#9A9398',
    textAlign: 'center',
    lineHeight: 18,
  },
});
