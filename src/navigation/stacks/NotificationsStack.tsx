import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NotificationsListScreen } from '@/features/notifications/screens/NotificationsListScreen';
import type { NotificationsStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export const NotificationsStack = () => (
  <Stack.Navigator id="NotificationsStack">
    <Stack.Screen
      name="NotificationsList"
      component={NotificationsListScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);
