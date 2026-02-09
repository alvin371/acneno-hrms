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
  const palette = {
    sand: '#d4d0c6',
    cream: '#f6f2ea',
    ivory: '#f1ece2',
    ink: '#1a1a1a',
    muted: '#6a6a66',
    wine: '#a3253b',
    rose: '#f4d7dd',
    sky: '#8bbfda',
    white: '#ffffff',
    divider: '#e6e0d6',
    cardBorder: '#f3eee4',
  };
  const radii = {
    hero: 36,
    card: 28,
    tile: 20,
  };
  const name = user?.name ?? 'Jordan Lee';
  const email = user?.email ?? 'jordan.lee@acmenow.com';
  const role = user?.role ?? user?.role_name ?? 'People Operations';
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
    <Screen
      scroll
      className="bg-transparent"
      style={{ backgroundColor: palette.sand }}
      safeAreaStyle={{ backgroundColor: palette.sand }}
      contentContainerStyle={{ paddingTop: 0 }}
    >
      <View className="gap-6">
        <View className="relative px-4 pt-8">
          <View
            className="absolute top-0 h-56 rounded-b-[36px]"
            style={{
              backgroundColor: palette.wine,
              left: -16,
              right: -16,
              borderBottomLeftRadius: radii.hero,
              borderBottomRightRadius: radii.hero,
            }}
          />
          <View
            className="absolute -right-8 top-8 h-24 w-24 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          />
          <View
            className="absolute -left-10 top-16 h-20 w-20 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}
          />
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Profile
              </Text>
              <View
                className="flex-row items-center gap-2 rounded-full px-3 py-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <View
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: palette.sky }}
                />
                <Text className="text-xs font-semibold" style={{ color: palette.white }}>
                  Jakarta Office
                </Text>
              </View>
            </View>

            <View
              className="items-center gap-3 rounded-3xl p-5"
              style={{
                backgroundColor: palette.white,
                borderRadius: radii.card,
                borderWidth: 1,
                borderColor: palette.cardBorder,
                shadowColor: palette.ink,
                shadowOpacity: 0.12,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 10 },
                elevation: 6,
              }}
            >
              <View className="relative items-center">
                <View
                  className="rounded-full p-1"
                  style={{ backgroundColor: palette.cream }}
                >
                  <Image
                    source={logos.forbes}
                    className="h-24 w-24 rounded-full"
                    resizeMode="cover"
                  />
                </View>
                <View
                  className="absolute -bottom-3 rounded-full px-3 py-1"
                  style={{ backgroundColor: palette.wine }}
                >
                  <Text className="text-xs font-semibold" style={{ color: palette.white }}>
                    {initials}
                  </Text>
                </View>
              </View>
              <View className="items-center">
                <Text className="text-xl font-bold" style={{ color: palette.ink }}>
                  {name}
                </Text>
                <Text className="text-sm" style={{ color: palette.muted }}>
                  {role}
                </Text>
              </View>
              <View
                className="flex-row rounded-2xl px-4 py-3"
                style={{ backgroundColor: palette.ivory }}
              >
                {[
                  { label: 'Projects', value: '12' },
                  { label: 'Kudos', value: '8' },
                  { label: 'Leave Days', value: '5' },
                ].map((item, index) => (
                  <View
                    key={item.label}
                    className="flex-1 items-center"
                    style={
                      index !== 0
                        ? { borderLeftWidth: 1, borderLeftColor: palette.divider }
                        : undefined
                    }
                  >
                    <Text className="text-lg font-semibold" style={{ color: palette.ink }}>
                      {item.value}
                    </Text>
                    <Text className="text-xs" style={{ color: palette.muted }}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View className="gap-4 px-4">
          <View
            className="gap-4 p-5"
            style={{
              backgroundColor: palette.white,
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: palette.cardBorder,
              shadowColor: palette.ink,
              shadowOpacity: 0.1,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 5,
            }}
          >
            <Text className="text-xs font-semibold uppercase tracking-widest" style={{ color: palette.muted }}>
              Contact
            </Text>
            <View className="gap-3">
              <View>
                <Text className="text-xs" style={{ color: palette.muted }}>
                  Email
                </Text>
                <Text className="text-base font-semibold" style={{ color: palette.ink }}>
                  {email}
                </Text>
              </View>
              <View>
                <Text className="text-xs" style={{ color: palette.muted }}>
                  Department
                </Text>
                <Text className="text-base font-semibold" style={{ color: palette.ink }}>
                  People Experience
                </Text>
              </View>
              <View>
                <Text className="text-xs" style={{ color: palette.muted }}>
                  Location
                </Text>
                <Text className="text-base font-semibold" style={{ color: palette.ink }}>
                  Lagos, NG
                </Text>
              </View>
            </View>
          </View>

          <View className="gap-3">
            <Button
              label="Edit Profile"
              onPress={() => navigation.navigate('ProfileEdit')}
              className="rounded-2xl"
              style={{ backgroundColor: palette.wine }}
              labelStyle={{ color: palette.white }}
            />
            <Button
              label="Logout"
              variant="secondary"
              onPress={onLogout}
              className="rounded-2xl"
              style={{ borderColor: palette.wine }}
              labelStyle={{ color: palette.wine }}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
};
