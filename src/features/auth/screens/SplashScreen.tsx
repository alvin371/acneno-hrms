import { ActivityIndicator, Image, Text, View } from 'react-native';
import { Screen } from '@/ui/Screen';
import { logos } from '@/assets/image';

export const SplashScreen = () => (
  <Screen className="justify-center items-center">
    <View className="items-center gap-4">
      <Image
        source={logos.forbes}
        className="h-28 w-28"
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#2454db" />
      <Text className="text-sm text-ink-500">Preparing your workspace...</Text>
    </View>
  </Screen>
);
