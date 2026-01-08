import { Text, View } from 'react-native';
import { Screen } from '@/ui/Screen';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabsParamList } from '@/navigation/types';

type Props = BottomTabScreenProps<MainTabsParamList, 'Home'>;

export const HomeScreen = ({ navigation }: Props) => (
  <Screen scroll>
    <View className="gap-6">
      <View>
        <Text className="text-2xl font-bold text-ink-700">Good morning</Text>
        <Text className="text-base text-ink-500">
          Here's your HR dashboard for today.
        </Text>
      </View>
      <Card>
        <Text className="text-base font-semibold text-ink-700">
          Today's summary
        </Text>
        <View className="mt-3 gap-2">
          <Text className="text-sm text-ink-500">Attendance: Not checked in</Text>
          <Text className="text-sm text-ink-500">Leaves: 2 pending approvals</Text>
          <Text className="text-sm text-ink-500">Performance: Next cycle in 3 days</Text>
        </View>
      </Card>
      <View className="gap-4">
        <Card className="gap-3">
          <Text className="text-lg font-semibold text-ink-700">Attendance</Text>
          <Text className="text-sm text-ink-500">
            Confirm your attendance using office validation.
          </Text>
          <Button
            label="Go to Attendance"
            onPress={() => navigation.navigate('Attendance')}
          />
        </Card>
        <Card className="gap-3">
          <Text className="text-lg font-semibold text-ink-700">Leave</Text>
          <Text className="text-sm text-ink-500">
            Apply for leave and track approvals.
          </Text>
          <Button
            label="Open Leave"
            onPress={() => navigation.navigate('Leave')}
          />
        </Card>
        <Card className="gap-3">
          <Text className="text-lg font-semibold text-ink-700">Performance</Text>
          <Text className="text-sm text-ink-500">
            Submit your performance cycle updates.
          </Text>
          <Button
            label="View Performance"
            onPress={() => navigation.navigate('Performance')}
          />
        </Card>
      </View>
    </View>
  </Screen>
);
