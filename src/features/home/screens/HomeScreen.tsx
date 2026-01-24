import { Animated, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Screen } from '@/ui/Screen';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabsParamList } from '@/navigation/types';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = BottomTabScreenProps<MainTabsParamList, 'Home'>;

export const HomeScreen = ({ navigation }: Props) => {
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
  const floatAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  const floatUp = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  const ShortcutIcon = ({
    name,
    color,
  }: {
    name:
      | 'absensi'
      | 'cuti'
      | 'slip'
      | 'performance'
      | 'approvals'
      | 'employee';
    color: string;
  }) => {
    switch (name) {
      case 'absensi':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
            <Path
              d="M12 7v5l3 3"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'cuti':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Rect
              x="4"
              y="6"
              width="16"
              height="14"
              rx="3"
              stroke={color}
              strokeWidth={2}
            />
            <Path
              d="M8 4h8"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Path
              d="M8 12h8M8 16h5"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        );
      case 'slip':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Rect
              x="5"
              y="3"
              width="14"
              height="18"
              rx="3"
              stroke={color}
              strokeWidth={2}
            />
            <Path
              d="M8 8h8M8 12h8M8 16h5"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        );
      case 'performance':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M4 17l5-5 4 4 7-7"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx="9" cy="12" r="1.6" fill={color} />
            <Circle cx="13" cy="16" r="1.6" fill={color} />
          </Svg>
        );
      case 'approvals':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M7 12l3 3 7-7"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
          </Svg>
        );
      case 'employee':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth={2} />
            <Path
              d="M5 19c1.8-3 11.2-3 14 0"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        );
      default:
        return null;
    }
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
        <View className="absolute left-0 right-0 top-0 h-[420px] overflow-hidden">
          <View
            className="absolute -top-12 left-[-80px] h-56 w-56 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}
          />
          <View
            className="absolute -top-6 right-[-60px] h-40 w-40 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          />
          <View
            className="absolute top-36 left-10 h-24 w-24 rounded-full"
            style={{ backgroundColor: 'rgba(163,37,59,0.08)' }}
          />
        </View>
        <View className="relative px-4 pt-8">
          <View
            className="absolute left-0 right-0 top-0"
            style={{ height: insets.top, backgroundColor: palette.wine }}
          />
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
          <Animated.View
            className="absolute -right-6 bottom-6 h-28 w-28 rounded-full"
            style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              transform: [{ translateY: floatUp }],
            }}
          />
          <Animated.View
            className="absolute -left-10 bottom-10 h-20 w-20 rounded-full"
            style={{
              backgroundColor: 'rgba(255,255,255,0.16)',
              transform: [{ translateY: floatUp }],
            }}
          />
          <View className="absolute left-0 right-0 bottom-0 h-24 overflow-hidden">
            <Svg width="100%" height="100%" viewBox="0 0 360 96">
              <Path
                d="M0,48 C40,20 80,8 120,12 C160,16 200,36 240,44 C280,52 320,52 360,40 L360,96 L0,96 Z"
                fill="rgba(255,255,255,0.09)"
              />
            </Svg>
          </View>
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: palette.white }}
                >
                  <Text className="text-xs font-semibold" style={{ color: palette.wine }}>
                    A
                  </Text>
                </View>
                <View>
                  <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Selamat Datang
                  </Text>
                  <Text className="text-base font-semibold" style={{ color: palette.white }}>
                    Alvin
                  </Text>
                </View>
              </View>
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
              className="gap-5 p-5"
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
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold" style={{ color: palette.ink }}>
                  Sabtu, 24 Januari 2026
                </Text>
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: palette.wine }}
                  />
                  <View
                    className="rounded-full px-2 py-0.5"
                    style={{ backgroundColor: palette.rose }}
                  >
                    <Text
                      className="text-[10px] font-semibold"
                      style={{ color: palette.wine }}
                    >
                      Day Off
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View
                  className="flex-1 px-3 py-3"
                  style={{ backgroundColor: palette.ivory, borderRadius: radii.tile }}
                >
                  <Text className="text-xs font-semibold" style={{ color: palette.ink }}>
                    Masuk
                  </Text>
                  <Text className="text-xs" style={{ color: palette.muted }}>
                    --:--
                  </Text>
                </View>
                <View
                  className="flex-1 px-3 py-3"
                  style={{ backgroundColor: palette.ivory, borderRadius: radii.tile }}
                >
                  <Text className="text-xs font-semibold" style={{ color: palette.ink }}>
                    Pulang
                  </Text>
                  <Text className="text-xs" style={{ color: palette.muted }}>
                    --:--
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="gap-4 px-4">
          <View
            className="rounded-3xl p-4"
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
            <View className="flex-row flex-wrap justify-between">
              {[
                {
                  label: 'Absensi',
                  icon: 'absensi',
                  onPress: () => navigation.navigate('Attendance'),
                },
                {
                  label: 'Cuti',
                  icon: 'cuti',
                  onPress: () => navigation.navigate('Leave'),
                },
                { label: 'Slip Gaji', icon: 'slip' },
                {
                  label: 'Performance',
                  icon: 'performance',
                  onPress: () => navigation.navigate('Performance'),
                },
                { label: 'Persetujuan', icon: 'approvals' },
                { label: 'Karyawan', icon: 'employee' },
              ].map((item) => (
                <Pressable
                  key={item.label}
                  onPress={item.onPress}
                  className="mb-6 w-[30%] items-center gap-2"
                >
                  <View className="items-center gap-2">
                    <View
                      className="h-12 w-12 items-center justify-center rounded-full"
                      style={{ backgroundColor: palette.cream }}
                    >
                      <ShortcutIcon name={item.icon} color={palette.wine} />
                    </View>
                    <Text className="text-xs text-center" style={{ color: palette.muted }}>
                      {item.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

            <View
              className="flex-row items-center justify-between px-4 py-3"
              style={{
                backgroundColor: palette.cream,
                borderRadius: radii.card,
              }}
            >
              <View>
                <Text className="text-xs" style={{ color: palette.muted }}>
                  Status Berikutnya
                </Text>
                <Text className="text-sm font-semibold" style={{ color: palette.ink }}>
                  Payroll cut-off 3 hari lagi
                </Text>
              </View>
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: palette.white, borderColor: palette.rose, borderWidth: 1 }}
              >
                <Text className="text-xs font-semibold" style={{ color: palette.wine }}>
                  Lihat
                </Text>
              </View>
            </View>

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
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold" style={{ color: palette.ink }}>
                Pengumuman
              </Text>
              <Pressable>
                <Text className="text-xs font-semibold" style={{ color: palette.wine }}>
                  Lihat Semua
                </Text>
              </Pressable>
            </View>
            <View className="gap-4">
              <View className="gap-1">
                <Text className="text-sm font-semibold" style={{ color: palette.ink }}>
                  Memperingati Hari Isra Mi'raj Nabi Muhammad SAW
                </Text>
                <Text className="text-xs" style={{ color: palette.muted }}>
                  Dear Acneno Team, dalam rangka memperingati Hari Isra Mi'raj.
                </Text>
                <Text className="text-[10px]" style={{ color: palette.muted }}>
                  1 minggu yang lalu
                </Text>
              </View>
              <View className="h-px w-full" style={{ backgroundColor: palette.divider }} />
              <View className="gap-1">
                <Text className="text-sm font-semibold" style={{ color: palette.ink }}>
                  Selamat Natal & Tahun Baru 2026
                </Text>
                <Text className="text-xs" style={{ color: palette.muted }}>
                  Selamat Natal dan Tahun Baru 2026 untuk semua.
                </Text>
                <Text className="text-[10px]" style={{ color: palette.muted }}>
                  4 minggu yang lalu
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
};
