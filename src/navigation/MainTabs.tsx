import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { AttendanceStack } from '@/navigation/stacks/AttendanceStack';
import { LeaveStack } from '@/navigation/stacks/LeaveStack';
import { OvertimeStack } from '@/navigation/stacks/OvertimeStack';
import { ApprovalStack } from '@/navigation/stacks/ApprovalStack';
import { PerformanceStack } from '@/navigation/stacks/PerformanceStack';
import { ProfileStack } from '@/navigation/stacks/ProfileStack';
import { NotificationsStack } from '@/navigation/stacks/NotificationsStack';
import { AnimatedTabBar } from '@/navigation/components/AnimatedTabBar';
import type { MainTabsParamList } from '@/navigation/types';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export const MainTabs = () => {
  return (
    <Tab.Navigator
      id="MainTabs"
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Attendance" component={AttendanceStack} />
      <Tab.Screen
        name="Leave"
        component={LeaveStack}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen name="Performance" component={PerformanceStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
      <Tab.Screen
        name="Overtime"
        component={OvertimeStack}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="Approvals"
        component={ApprovalStack}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsStack}
        options={{ tabBarButton: () => null }}
      />
    </Tab.Navigator>
  );
};
