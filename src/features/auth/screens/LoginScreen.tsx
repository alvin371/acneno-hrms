import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { login } from '@/features/auth/api';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/api/error';
import { showToast } from '@/utils/toast';
import { showErrorModal } from '@/utils/errorModal';
import { logos } from '@/assets/image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

const MAROON = '#6B1A2B';
const INPUT_BG = '#F2F0ED';
const MUTED = '#9CA3AF';
const DANGER = '#dc2626';

export const LoginScreen = () => {
  const setSession = useAuthStore((state) => state.setSession);
  const [showPassword, setShowPassword] = useState(false);

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

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  const isLoading = mutation.isPending || isSubmitting;

  return (
    <View className="flex-1" style={{ backgroundColor: MAROON }}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Section — Maroon Background */}
          <SafeAreaView edges={['top']}>
            <View className="items-center px-6 pb-16 pt-12">
              <View
                className="mb-6 h-24 w-24 items-center justify-center rounded-3xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <Image
                  source={logos.forbes}
                  className="h-16 w-16"
                  resizeMode="contain"
                />
              </View>
              <Text className="mb-2 text-3xl font-bold text-white">
                Selamat Datang
              </Text>
              <Text
                className="text-center text-sm"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Silakan masuk ke akun Anda untuk melanjutkan.
              </Text>
            </View>
          </SafeAreaView>

          {/* Bottom Section — White Card */}
          <View
            className="flex-1 px-6 pb-10 pt-8"
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
            }}
          >
            {/* Email Field */}
            <Controller
              control={control}
              name="username"
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <View className="mb-5">
                  <Text
                    className="mb-2 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: MAROON }}
                  >
                    Email
                  </Text>
                  <View
                    className="flex-row items-center rounded-2xl px-4 py-3.5"
                    style={{ backgroundColor: INPUT_BG }}
                  >
                    <TextInput
                      className="flex-1 text-base"
                      style={{ color: '#111' }}
                      placeholder="nama@perusahaan.com"
                      placeholderTextColor={MUTED}
                      value={value ?? ''}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <Ionicons name="mail-outline" size={20} color={MUTED} />
                  </View>
                  {error ? (
                    <Text
                      className="mt-1 text-xs"
                      style={{ color: DANGER }}
                    >
                      {error.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            {/* Password Field */}
            <Controller
              control={control}
              name="password"
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <View className="mb-3">
                  <Text
                    className="mb-2 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: MAROON }}
                  >
                    Password
                  </Text>
                  <View
                    className="flex-row items-center rounded-2xl px-4 py-3.5"
                    style={{ backgroundColor: INPUT_BG }}
                  >
                    <TextInput
                      className="flex-1 text-base"
                      style={{ color: '#111' }}
                      placeholder="Enter your password"
                      placeholderTextColor={MUTED}
                      value={value ?? ''}
                      onChangeText={onChange}
                      secureTextEntry={!showPassword}
                    />
                    <Pressable
                      onPress={() => setShowPassword((prev) => !prev)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={
                          showPassword
                            ? 'lock-open-outline'
                            : 'lock-closed-outline'
                        }
                        size={20}
                        color={MUTED}
                      />
                    </Pressable>
                  </View>
                  {error ? (
                    <Text
                      className="mt-1 text-xs"
                      style={{ color: DANGER }}
                    >
                      {error.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            {/* Forgot Password */}
            <Pressable className="mb-6 self-end">
              <Text className="text-sm font-semibold" style={{ color: MAROON }}>
                Lupa Password?
              </Text>
            </Pressable>

            {/* Login Button */}
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              className="mb-8 items-center justify-center rounded-2xl py-4"
              style={{
                backgroundColor: MAROON,
                opacity: isLoading ? 0.7 : 1,
                shadowColor: MAROON,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-bold text-white">Masuk</Text>
              )}
            </Pressable>

            {/* Divider */}
            <View className="mb-6 flex-row items-center">
              <View
                className="h-px flex-1"
                style={{ backgroundColor: '#E5E7EB' }}
              />
              <Text className="mx-4 text-xs" style={{ color: MUTED }}>
                Atau masuk dengan
              </Text>
              <View
                className="h-px flex-1"
                style={{ backgroundColor: '#E5E7EB' }}
              />
            </View>

            {/* Biometric Button */}
            <View className="items-center">
              <Pressable
                className="h-14 w-14 items-center justify-center rounded-full"
                style={{ borderWidth: 1.5, borderColor: '#E5E7EB' }}
              >
                <Ionicons
                  name="finger-print-outline"
                  size={28}
                  color={MAROON}
                />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
