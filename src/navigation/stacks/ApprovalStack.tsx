import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ApprovalsScreen } from '@/features/approvals/screens/ApprovalsScreen';
import { ApprovalDetailScreen } from '@/features/approvals/screens/ApprovalDetailScreen';
import type { ApprovalStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<ApprovalStackParamList>();

export const ApprovalStack = () => (
  <Stack.Navigator id="ApprovalStack">
    <Stack.Screen
      name="ApprovalsList"
      component={ApprovalsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ApprovalDetail"
      component={ApprovalDetailScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);
