import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OvertimeRequestScreen } from '@/features/overtime/screens/OvertimeRequestScreen';
import { OvertimeDetailScreen } from '@/features/overtime/screens/OvertimeDetailScreen';
import type { OvertimeStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<OvertimeStackParamList>();

export const OvertimeStack = () => (
  <Stack.Navigator id="OvertimeStack">
    <Stack.Screen
      name="OvertimeRequest"
      component={OvertimeRequestScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="OvertimeDetail"
      component={OvertimeDetailScreen}
      options={{ title: 'Overtime Request' }}
    />
  </Stack.Navigator>
);
