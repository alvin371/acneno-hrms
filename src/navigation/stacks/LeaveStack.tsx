import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LeaveListScreen } from '@/features/leave/screens/LeaveListScreen';
import { LeaveCreateScreen } from '@/features/leave/screens/LeaveCreateScreen';
import type { LeaveStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<LeaveStackParamList>();

export const LeaveStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="LeaveList"
      component={LeaveListScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="LeaveCreate"
      component={LeaveCreateScreen}
      options={{ title: 'Apply Leave' }}
    />
  </Stack.Navigator>
);
