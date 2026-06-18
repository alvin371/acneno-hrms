import { Image, Text, View } from 'react-native';
import { Screen } from '@/ui/Screen';
import { logos } from '@/assets/image';
import packageInfo from '../../../../package.json';

const { version } = packageInfo;

export const SplashScreen = () => (
  <Screen style={{ backgroundColor: '#a3253b' }} className="justify-between items-center">
    <View />
    <View className="items-center gap-6">
      <Image
        source={logos.white}
        style={{ width: 160, height: 160 }}
        resizeMode="contain"
      />
      <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>
        HR MANAGEMENT SYSTEM
      </Text>
    </View>
    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', paddingBottom: 32 }}>
      v{version}
    </Text>
  </Screen>
);
