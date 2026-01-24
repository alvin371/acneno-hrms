import { Pressable, Text, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
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
import { showErrorModal } from '@/utils/errorModal';

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

export const LoginScreen = () => {
  const setSession = useAuthStore((state) => state.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const palette = {
    sand: '#d9d7cf',
    cream: '#f5f2eb',
    ivory: '#f4f1ea',
    ink: '#111111',
    muted: '#6b7280',
    wine: '#b0243e',
    sky: '#7fc4e4',
    danger: '#dc2626',
    white: '#ffffff',
  };
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => login(values.username, values.password),
    onSuccess: async (data) => {
      await setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      showToast('success', 'Welcome back!');
    },
    onError: (error) => {
      showErrorModal(getErrorMessage(error));
    },
  });

  const onSubmit = async (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Screen
      scroll
      className="bg-transparent"
      style={{ backgroundColor: palette.sand }}
    >
      <View className="w-full gap-8 px-1">
        <View className="gap-4">
          <View className="flex-row items-center justify-between">
            <View
              className="h-11 w-11 rounded-2xl"
              style={{ backgroundColor: palette.ink }}
            />
            <Text
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: palette.ink }}
            >
              Acneno Life
            </Text>
          </View>
          <View className="gap-2">
            <Text
              className="text-4xl font-black text-left"
              style={{ color: palette.ink }}
            >
              Hey, Login Now.
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-left" style={{ color: palette.muted }}>
                If you are new
              </Text>
              <Pressable>
                <Text className="text-sm font-semibold" style={{ color: palette.wine }}>
                  Create New
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View
          className="w-full gap-6 rounded-[32px] p-6"
          style={{ backgroundColor: palette.white }}
        >
          <View
            className="relative h-44 w-full overflow-hidden rounded-[28px]"
            style={{ backgroundColor: palette.cream }}
          >
            <View
              className="absolute -left-10 top-10 h-24 w-[75%] -rotate-6 rounded-[28px]"
              style={{ backgroundColor: palette.wine }}
            />
            <View
              className="absolute -right-10 bottom-6 h-24 w-[70%] rotate-6 rounded-[28px]"
              style={{ backgroundColor: palette.sky }}
            />
            <View
              className="absolute left-6 top-6 h-12 w-12 rounded-2xl"
              style={{ backgroundColor: palette.ink }}
            />
            <View
              className="absolute right-6 top-8 h-16 w-16 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
            />
          </View>

          <View className="gap-5">
            <FormInput
              control={control}
              name="username"
              label="Username"
              placeholder="Dstudio_agency"
              keyboardType="default"
              labelClassName="text-xs uppercase tracking-widest"
              inputClassName="rounded-2xl border-0"
              containerClassName="gap-2"
              errorClassName="text-xs"
              labelStyle={{ color: palette.muted }}
              inputStyle={{ backgroundColor: palette.ivory, color: palette.ink }}
              errorStyle={{ color: palette.danger }}
              placeholderTextColor={palette.muted}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View className="gap-2">
                  <Text
                    className="text-xs uppercase tracking-widest"
                    style={{ color: palette.muted }}
                  >
                    Password
                  </Text>
                  <View
                    className="flex-row items-center rounded-2xl px-4 py-3"
                    style={{ backgroundColor: palette.ivory }}
                  >
                    <TextInput
                      className="flex-1 text-base"
                      style={{ color: palette.ink }}
                      placeholder="Enter your password"
                      placeholderTextColor={palette.muted}
                      value={value === undefined || value === null ? '' : String(value)}
                      onChangeText={onChange}
                      secureTextEntry={!showPassword}
                      textAlignVertical="center"
                    />
                    <Pressable
                      onPress={() => setShowPassword((prev) => !prev)}
                      className="px-2 py-1"
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: palette.wine }}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    </Pressable>
                  </View>
                  {error ? (
                    <Text className="text-xs" style={{ color: palette.danger }}>
                      {error.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <View className="flex-row items-center justify-between">
              <Text className="text-xs" style={{ color: palette.muted }}>
                Forgot Passcode?
              </Text>
              <Pressable>
                <Text
                  className="text-xs font-semibold"
                  style={{ color: palette.wine }}
                >
                  Reset
                </Text>
              </Pressable>
            </View>

            <Button
              label={
                mutation.isPending || isSubmitting ? 'Signing in...' : 'Login'
              }
              onPress={handleSubmit(onSubmit)}
              loading={mutation.isPending}
              className="rounded-2xl"
              style={{ backgroundColor: palette.wine }}
              labelStyle={{ color: palette.white }}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
};
