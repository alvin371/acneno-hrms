import { ActivityIndicator, Text, View } from 'react-native';
import { Screen } from '@/ui/Screen';

export const SplashScreen = () => (
  <Screen className="justify-center items-center">
    <View className="items-center gap-4">
      <Text className="text-2xl font-bold text-ink-700">Acme HR</Text>
      <ActivityIndicator size="large" color="#2454db" />
      <Text className="text-sm text-ink-500">Preparing your workspace...</Text>
    </View>
  </Screen>
);
