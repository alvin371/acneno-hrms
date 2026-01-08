import { Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { login } from '@/features/auth/api';
import { Screen } from '@/ui/Screen';
import { FormInput } from '@/ui/FormInput';
import { Button } from '@/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/api/error';
import { showToast } from '@/utils/toast';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

const DEMO_EMAIL = 'demo@acme.co';
const DEMO_PASSWORD = 'password';

export const LoginScreen = () => {
  const setSession = useAuthStore((state) => state.setSession);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => login(values.email, values.password),
    onSuccess: async (data) => {
      await setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      showToast('success', 'Welcome back!');
    },
    onError: (error) => {
      showToast('error', getErrorMessage(error));
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (
      values.email.trim().toLowerCase() === DEMO_EMAIL &&
      values.password === DEMO_PASSWORD
    ) {
      await setSession({
        accessToken: 'demo-access-token',
        refreshToken: 'demo-refresh-token',
        user: {
          id: 'demo-user',
          name: 'Demo Account',
          email: DEMO_EMAIL,
          role: 'Demo',
        },
      });
      showToast('success', 'Signed in with the demo account.');
      return;
    }

    mutation.mutate(values);
  };

  return (
    <Screen scroll className="bg-white">
      <View className="w-full gap-8">
        <View className="gap-5">
          <View className="flex-row items-center justify-between">
            <View className="h-11 w-11 rounded-2xl bg-black" />
            <Text className="text-xs uppercase tracking-widest text-black">
              Acme HR
            </Text>
          </View>
          <View className="gap-2">
            <Text className="text-4xl font-black text-black text-left">
              Welcome back
            </Text>
            <Text className="text-base text-zinc-600 text-left">
              Sign in to your workspace. Minimal, focused, fast.
            </Text>
          </View>
        </View>
        <View className="w-full gap-5 rounded-3xl border-2 border-black bg-white p-6">
          <FormInput
            control={control}
            name="email"
            label="Email"
            placeholder="you@company.com"
            keyboardType="email-address"
            labelClassName="text-xs uppercase tracking-widest text-zinc-600"
            inputClassName="border-zinc-300 bg-white text-black placeholder:text-zinc-400"
          />
          <FormInput
            control={control}
            name="password"
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            labelClassName="text-xs uppercase tracking-widest text-zinc-600"
            inputClassName="border-zinc-300 bg-white text-black placeholder:text-zinc-400"
          />
          <Button
            label={
              mutation.isPending || isSubmitting ? 'Signing in...' : 'Sign In'
            }
            onPress={handleSubmit(onSubmit)}
            loading={mutation.isPending}
            className="rounded-2xl bg-black"
            labelClassName="text-white"
          />
        </View>
        <View className="rounded-2xl border border-zinc-200 bg-zinc-100 p-4">
          <Text className="text-sm text-black text-left">
            Demo account: {DEMO_EMAIL} | password: {DEMO_PASSWORD}
          </Text>
          <Text className="mt-1 text-xs text-zinc-600 text-left">
            Demo sign-in bypasses the API.
          </Text>
        </View>
      </View>
    </Screen>
  );
};
