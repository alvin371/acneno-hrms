import { View } from 'react-native';
import { Card } from '@/ui/Card';
import { tokens } from '@/config/tokens';

type LoadingSkeletonProps = {
  count?: number;
};

export const LoadingSkeleton = ({ count = 3 }: LoadingSkeletonProps) => (
  <View className="gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index} className="gap-3">
        <View
          className="h-5 w-3/4 rounded"
          style={{ backgroundColor: tokens.colors.borderWarm }}
        />
        <View
          className="h-4 w-1/2 rounded"
          style={{ backgroundColor: tokens.colors.borderWarm }}
        />
        <View
          className="h-4 w-1/3 rounded"
          style={{ backgroundColor: tokens.colors.borderWarm }}
        />
      </Card>
    ))}
  </View>
);
