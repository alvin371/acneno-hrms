import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import NetInfo from '@react-native-community/netinfo';
import { RootNavigator } from '@/navigation/RootNavigator';
import { queryClient } from '@/lib/queryClient';
import {
  initNotifications,
  scheduleDailyCheckInOutNotifications,
} from './lib/notifications';
import { useAuthStore } from '@/store/authStore';

const App = () => {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    NetInfo.configure({ shouldFetchWiFiSSID: true });
    bootstrap();
    initNotifications();
    scheduleDailyCheckInOutNotifications().catch(() => undefined);
  }, [bootstrap]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar barStyle="dark-content" />
          <RootNavigator />
          <Toast />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
