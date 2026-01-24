import { Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '@/ui/Card';

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
};

export const EmptyState = ({
  icon = 'document-outline',
  title,
  description,
}: EmptyStateProps) => (
  <Card className="items-center py-8">
    <Ionicons name={icon} size={48} color="#94a3b8" />
    <Text className="mt-4 text-base font-semibold text-ink-600">{title}</Text>
    {description && (
      <Text className="mt-1 text-center text-sm text-ink-500">
        {description}
      </Text>
    )}
  </Card>
);
