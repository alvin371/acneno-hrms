import { View } from 'react-native';
import { Card } from '@/ui/Card';

type LoadingSkeletonProps = {
  count?: number;
};

export const LoadingSkeleton = ({ count = 3 }: LoadingSkeletonProps) => (
  <View className="gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index} className="gap-3">
        <View className="h-5 w-3/4 rounded bg-slate-200" />
        <View className="h-4 w-1/2 rounded bg-slate-200" />
        <View className="h-4 w-1/3 rounded bg-slate-200" />
      </Card>
    ))}
  </View>
);
