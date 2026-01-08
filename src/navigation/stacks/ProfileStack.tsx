import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '@/features/auth/screens/ProfileScreen';
import { ProfileEditScreen } from '@/features/auth/screens/ProfileEditScreen';
import type { ProfileStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProfileEdit"
      component={ProfileEditScreen}
      options={{ title: 'Edit Profile' }}
    />
  </Stack.Navigator>
);
