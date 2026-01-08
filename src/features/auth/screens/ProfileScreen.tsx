import { Image, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { queryClient } from '@/lib/queryClient';
import type { ProfileStackParamList } from '@/navigation/types';
import { logos } from '@/assets/image';

export const ProfileScreen = () => {
  const { user, clearSession } = useAuthStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const name = user?.name ?? 'Jordan Lee';
  const email = user?.email ?? 'jordan.lee@acmenow.com';
  const role = user?.role ?? 'People Operations';
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const onLogout = async () => {
    await clearSession();
    queryClient.clear();
  };

  return (
    <Screen scroll className="relative bg-slate-50">
      <View className="absolute -left-4 -right-4 -top-6 h-64">
        <View className="absolute inset-0 rounded-b-3xl bg-brand-600" />
        <View className="absolute -top-10 right-6 h-36 w-36 rounded-full bg-brand-400 opacity-40" />
        <View className="absolute top-6 left-8 h-4 w-4 rounded-full bg-amber-200" />
        <View className="absolute top-16 right-16 h-3 w-3 rounded-full bg-emerald-200" />
        <View className="absolute top-24 left-20 h-2 w-2 rounded-full bg-rose-200" />
        <View className="absolute top-14 left-40 h-2 w-2 rounded-full bg-indigo-200" />
      </View>
      <View className="mt-6 gap-6">
        <View className="items-center">
          <View className="relative items-center">
            <View className="rounded-full bg-white p-1 shadow-lg">
              <Image
                source={logos.green}
                className="h-28 w-28 rounded-full"
                resizeMode="cover"
              />
            </View>
            <View className="absolute -bottom-4 rounded-full bg-brand-600 px-3 py-1">
              <Text className="text-xs font-semibold text-white">
                {initials}
              </Text>
            </View>
          </View>
          <Text className="mt-6 text-2xl font-bold text-white">{name}</Text>
          <Text className="text-sm text-brand-100">{role}</Text>
        </View>
        <View className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
          <Text className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            Contact
          </Text>
          <View className="mt-3 gap-3">
            <View>
              <Text className="text-xs text-ink-500">Email</Text>
              <Text className="text-base font-semibold text-ink-700">
                {email}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-ink-500">Department</Text>
              <Text className="text-base font-semibold text-ink-700">
                People Experience
              </Text>
            </View>
            <View>
              <Text className="text-xs text-ink-500">Location</Text>
              <Text className="text-base font-semibold text-ink-700">
                Lagos, NG
              </Text>
            </View>
          </View>
        </View>
        <View className="rounded-2xl bg-white p-5 shadow-sm">
          <Text className="text-xs font-semibold uppercase tracking-widest text-ink-500">
            Highlights
          </Text>
          <View className="mt-4 flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-ink-700">12</Text>
              <Text className="text-xs text-ink-500">Projects</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-ink-700">8</Text>
              <Text className="text-xs text-ink-500">Kudos</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-ink-700">5</Text>
              <Text className="text-xs text-ink-500">Leave Days</Text>
            </View>
          </View>
        </View>
        <View className="gap-3">
          <Button
            label="Edit Profile"
            onPress={() => navigation.navigate('ProfileEdit')}
          />
          <Button label="Logout" variant="secondary" onPress={onLogout} />
        </View>
      </View>
    </Screen>
  );
};
