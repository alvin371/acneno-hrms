import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { AttendanceStack } from '@/navigation/stacks/AttendanceStack';
import { ProfileStack } from '@/navigation/stacks/ProfileStack';
import { LeaveStack } from '@/navigation/stacks/LeaveStack';
import { PerformanceStack } from '@/navigation/stacks/PerformanceStack';
import type { MainTabsParamList } from '@/navigation/types';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export const MainTabs = () => (
  <Tab.Navigator
    id="MainTabs"
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#2454db',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarStyle: {
        borderTopColor: '#e2e8f0',
        paddingTop: 4,
        paddingBottom: 10,
        height: 64,
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 12,
        borderRadius: 12,
      },
      tabBarIcon: ({ color, size }) => {
        const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
          Home: 'home',
          Attendance: 'time',
          Leave: 'calendar',
          Performance: 'trophy',
          Profile: 'person',
        };
        const iconName = icons[route.name] ?? 'ellipse';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Attendance" component={AttendanceStack} />
    <Tab.Screen name="Leave" component={LeaveStack} />
    <Tab.Screen name="Performance" component={PerformanceStack} />
    <Tab.Screen name="Profile" component={ProfileStack} />
  </Tab.Navigator>
);
