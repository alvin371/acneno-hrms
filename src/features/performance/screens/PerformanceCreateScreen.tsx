import { Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { FormInput } from '@/ui/FormInput';
import { createPerformance } from '@/features/performance/api';
import { showToast } from '@/utils/toast';
import { getErrorMessage } from '@/api/error';
import { queryClient } from '@/lib/queryClient';
import type { PerformanceStackParamList } from '@/navigation/types';

const schema = z.object({
  cycle: z.string().min(1, 'Cycle is required'),
  achievements: z.string().min(1, 'Achievements are required'),
  challenges: z.string().min(1, 'Challenges are required'),
  selfScore: z.number().min(1).max(5),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = NativeStackScreenProps<PerformanceStackParamList, 'PerformanceCreate'>;

export const PerformanceCreateScreen = ({ navigation }: Props) => {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cycle: '',
      achievements: '',
      challenges: '',
      selfScore: 3,
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: createPerformance,
    onSuccess: () => {
      showToast('success', 'Performance entry submitted.');
      queryClient.invalidateQueries({ queryKey: ['performance'] });
      navigation.goBack();
    },
    onError: (error) => showToast('error', getErrorMessage(error)),
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Screen scroll>
      <View className="gap-6">
        <View>
          <Text className="text-2xl font-bold text-ink-700">New Performance</Text>
          <Text className="text-base text-ink-500">
            Capture achievements, challenges, and self scores.
          </Text>
        </View>
        <View className="gap-4">
          <FormInput
            control={control}
            name="cycle"
            label="Cycle"
            placeholder="Q1 2026"
          />
          <FormInput
            control={control}
            name="achievements"
            label="Achievements"
            placeholder="Highlight key wins"
            multiline
          />
          <FormInput
            control={control}
            name="challenges"
            label="Challenges"
            placeholder="Any obstacles faced"
            multiline
          />
          <FormInput
            control={control}
            name="selfScore"
            label="Self score (1-5)"
            placeholder="3"
            keyboardType="numeric"
          />
          <FormInput
            control={control}
            name="notes"
            label="Notes"
            placeholder="Optional notes"
            multiline
          />
        </View>
        <Button
          label={mutation.isPending ? 'Submitting...' : 'Submit'}
          onPress={handleSubmit(onSubmit)}
          loading={mutation.isPending}
        />
      </View>
    </Screen>
  );
};
