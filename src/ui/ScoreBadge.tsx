import { Text, View } from 'react-native';
import { cn } from '@/utils/cn';

type ScoreBadgeProps = {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
};

const getScoreVariant = (score: number, maxScore: number) => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return 'excellent';
  if (percentage >= 75) return 'good';
  if (percentage >= 60) return 'average';
  return 'needs-improvement';
};

export const ScoreBadge = ({
  score,
  maxScore = 100,
  size = 'md',
}: ScoreBadgeProps) => {
  const variant = getScoreVariant(score, maxScore);
  const formattedScore = Number.isInteger(score)
    ? String(score)
    : score.toFixed(2);

  return (
    <View
      className={cn(
        'items-center justify-center rounded-xl',
        size === 'sm' && 'px-2 py-1',
        size === 'md' && 'px-3 py-2',
        size === 'lg' && 'px-4 py-3',
        variant === 'excellent' && 'bg-emerald-100',
        variant === 'good' && 'bg-blue-100',
        variant === 'average' && 'bg-amber-100',
        variant === 'needs-improvement' && 'bg-rose-100'
      )}
    >
      <Text
        className={cn(
          'font-bold',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-xl',
          variant === 'excellent' && 'text-emerald-700',
          variant === 'good' && 'text-blue-700',
          variant === 'average' && 'text-amber-700',
          variant === 'needs-improvement' && 'text-rose-700'
        )}
      >
        {formattedScore}
      </Text>
    </View>
  );
};
