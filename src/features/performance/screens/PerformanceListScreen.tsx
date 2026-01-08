import { Text, View } from 'react-native';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/ui/Screen';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { getPerformance } from '@/features/performance/api';
import { showToast } from '@/utils/toast';
import { getErrorMessage } from '@/api/error';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PerformanceStackParamList } from '@/navigation/types';


type Props = NativeStackScreenProps<PerformanceStackParamList, 'PerformanceList'>;

export const PerformanceListScreen = ({ navigation }: Props) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['performance'],
    queryFn: getPerformance,
  });

  useEffect(() => {
    if (error) {
      showToast('error', getErrorMessage(error));
    }
  }, [error]);

  return (
    <Screen scroll>
      <View className="gap-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-ink-700">Performance</Text>
            <Text className="text-base text-ink-500">
              Submit and review performance cycles.
            </Text>
          </View>
          <Button
            label="New"
            onPress={() => navigation.navigate('PerformanceCreate')}
          />
        </View>
        {isLoading ? (
          <Card>
            <Text className="text-base text-ink-500">
              Loading performance updates...
            </Text>
          </Card>
        ) : data && data.length > 0 ? (
          <View className="gap-4">
            {data.map((record) => (
              <Card key={record.id} className="gap-2">
                <Text className="text-base font-semibold text-ink-700">
                  {record.cycle}
                </Text>
                <Text className="text-sm text-ink-500">
                  Self score: {record.selfScore}/5
                </Text>
                <Text className="text-sm text-ink-500" numberOfLines={2}>
                  {record.achievements}
                </Text>
              </Card>
            ))}
          </View>
        ) : (
          <Card>
            <Text className="text-base text-ink-500">
              No performance cycles yet. Create your first entry.
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  );
};
