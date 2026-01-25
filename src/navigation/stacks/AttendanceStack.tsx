import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AttendanceScreen } from '@/features/attendance/screens/AttendanceScreen';
import { AttendanceMonthlyDetailScreen } from '@/features/attendance/screens/AttendanceMonthlyDetailScreen';
import type { AttendanceStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<AttendanceStackParamList>();

export const AttendanceStack = () => (
  <Stack.Navigator id="AttendanceStack">
    <Stack.Screen
      name="AttendanceMain"
      component={AttendanceScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="AttendanceMonthlyDetail"
      component={AttendanceMonthlyDetailScreen}
      options={{ title: 'Monthly detail' }}
    />
  </Stack.Navigator>
);
