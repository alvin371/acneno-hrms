import { View } from 'react-native';
import { cn } from '@/utils/cn';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card = ({ children, className }: CardProps) => (
  <View className={cn('rounded-2xl bg-white p-4 shadow-sm', className)}>
    {children}
  </View>
);
