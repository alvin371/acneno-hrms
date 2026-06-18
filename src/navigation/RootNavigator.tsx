import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store/authStore';
import { SplashScreen } from '@/features/auth/screens/SplashScreen';
import { AuthStack } from '@/navigation/stacks/AuthStack';
import { MainTabs } from '@/navigation/MainTabs';
import { PinSetupScreen } from '@/features/auth/screens/PinSetupScreen';
import { PinUnlockScreen } from '@/features/auth/screens/PinUnlockScreen';

const SPLASH_MIN_MS = 3000;

const RootStack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { accessToken, isHydrating, hasPin, isUnlocked } = useAuthStore();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  if (isHydrating || !splashDone) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!accessToken ? (
          <RootStack.Screen name="Auth" component={AuthStack} />
        ) : !hasPin ? (
          <RootStack.Screen name="PinSetup" component={PinSetupScreen} />
        ) : !isUnlocked ? (
          <RootStack.Screen name="Unlock" component={PinUnlockScreen} />
        ) : (
          <RootStack.Screen name="Main" component={MainTabs} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
