import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PerformanceListScreen } from '@/features/performance/screens/PerformanceListScreen';
import { PerformanceCreateScreen } from '@/features/performance/screens/PerformanceCreateScreen';
import { PerformanceDetailScreen } from '@/features/performance/screens/PerformanceDetailScreen';
import type { PerformanceStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<PerformanceStackParamList>();

export const PerformanceStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="PerformanceList"
      component={PerformanceListScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="PerformanceCreate"
      component={PerformanceCreateScreen}
      options={{ title: 'New Appraisal' }}
    />
    <Stack.Screen
      name="PerformanceDetail"
      component={PerformanceDetailScreen}
      options={{ title: 'Submission Detail' }}
    />
  </Stack.Navigator>
);
