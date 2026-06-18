import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '@/features/auth/screens/ProfileScreen';
import { ProfileEditScreen } from '@/features/auth/screens/ProfileEditScreen';
import { EditPasswordScreen } from '@/features/auth/screens/EditPasswordScreen';
import { ConfigScreen } from '@/features/config/screens/ConfigScreen';
import { NotificationSettingsScreen } from '@/features/auth/screens/NotificationSettingsScreen';
import type { ProfileStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack = () => (
  <Stack.Navigator id="ProfileStack">
    <Stack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProfileEdit"
      component={ProfileEditScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="EditPassword"
      component={EditPasswordScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Config"
      component={ConfigScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="NotificationSettings"
      component={NotificationSettingsScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);
