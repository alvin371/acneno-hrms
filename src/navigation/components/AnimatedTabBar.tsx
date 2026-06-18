import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { trigger } from 'react-native-haptic-feedback';
import { tokens } from '@/config/tokens';
import type { MainTabsParamList } from '@/navigation/types';

const MAX_TABBAR_WIDTH = 680;
const FAB_SIZE = 56;
const FAB_NOTCH_GAP = FAB_SIZE + 16;
const ACTIVE_COLOR = tokens.colors.maroon;
const INACTIVE_COLOR = tokens.colors.textSub;
const SPRING = { damping: 20, stiffness: 180, mass: 0.8 };
const LABEL_HEIGHT = 14;

// ─── icon maps ───────────────────────────────────────────────────────────────

const ICON_OUTLINE: Partial<Record<keyof MainTabsParamList, keyof typeof Ionicons.glyphMap>> = {
  Home: 'home-outline',
  Attendance: 'time-outline',
  Performance: 'trophy-outline',
  Profile: 'person-outline',
};
const ICON_FILLED: Partial<Record<keyof MainTabsParamList, keyof typeof Ionicons.glyphMap>> = {
  Home: 'home',
  Attendance: 'time',
  Performance: 'trophy',
  Profile: 'person',
};

// All 5 tabs shown in the collapsed slim row (Leave = center calendar)
const SLIM_TABS: Array<{ id: keyof MainTabsParamList; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }> = [
  { id: 'Home',        icon: 'home-outline',     iconActive: 'home'     },
  { id: 'Attendance',  icon: 'time-outline',     iconActive: 'time'     },
  { id: 'Leave',       icon: 'calendar-outline', iconActive: 'calendar' },
  { id: 'Performance', icon: 'trophy-outline',   iconActive: 'trophy'   },
  { id: 'Profile',     icon: 'person-outline',   iconActive: 'person'   },
];

// ─── TabItem (expanded row) ───────────────────────────────────────────────────

type TabLayout = { x: number; width: number };

type TabItemProps = {
  routeName: keyof MainTabsParamList;
  label: string;
  isFocused: boolean;
  collapsed: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onTabLayout: (l: TabLayout) => void;
};

const TabItem = ({ routeName, label, isFocused, collapsed, onPress, onLongPress, onTabLayout }: TabItemProps) => {
  const scale = useSharedValue(1);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0);
  const labelHeight = useSharedValue(isFocused ? LABEL_HEIGHT : 0);

  useEffect(() => {
    const show = isFocused && !collapsed;
    labelOpacity.value = withTiming(show ? 1 : 0, { duration: 200 });
    labelHeight.value = withTiming(show ? LABEL_HEIGHT : 0, { duration: 260 });
  }, [isFocused, collapsed, labelOpacity, labelHeight]);

  const handlePress = () => {
    trigger('impactLight', { enableVibrateFallback: true });
    cancelAnimation(scale);
    scale.value = withSequence(
      withSpring(0.88, { damping: 8, stiffness: 300, mass: 0.6 }),
      withSpring(1.0, { damping: 14, stiffness: 200 }),
    );
    onPress();
  };

  const iconWrapStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const labelContainerStyle = useAnimatedStyle(() => ({
    height: labelHeight.value,
    opacity: labelOpacity.value,
    overflow: 'hidden' as const,
  }));

  const iconName = isFocused
    ? (ICON_FILLED[routeName] ?? 'home')
    : (ICON_OUTLINE[routeName] ?? 'home-outline');
  const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onLayout={(e: LayoutChangeEvent) =>
        onTabLayout({ x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width })
      }
      style={styles.tabItem}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View style={iconWrapStyle}>
        <Ionicons name={iconName} size={22} color={color} />
      </Animated.View>
      <Animated.View style={labelContainerStyle}>
        <Animated.Text style={[styles.label, { color }]} numberOfLines={1}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

// ─── SlimTab (collapsed row) ──────────────────────────────────────────────────

type SlimTabProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  onPress: () => void;
};

const SlimTab = ({ icon, iconActive, isActive, onPress }: SlimTabProps) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    trigger('impactLight', { enableVibrateFallback: true });
    cancelAnimation(scale);
    scale.value = withSequence(
      withSpring(0.82, { damping: 8, stiffness: 300 }),
      withSpring(1.0, { damping: 14, stiffness: 200 }),
    );
    onPress();
  };

  const wrapStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={handlePress} style={[styles.slimTab, isActive && styles.slimTabActive]}>
      <Animated.View style={wrapStyle}>
        <Ionicons
          name={isActive ? iconActive : icon}
          size={18}
          color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
      </Animated.View>
    </Pressable>
  );
};

// ─── AnimatedTabBar ───────────────────────────────────────────────────────────

export const AnimatedTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isTablet = width >= 768;
  const horizontalInset = isTablet ? Math.max((width - MAX_TABBAR_WIDTH) / 2, 24) : 12;
  const tabBarBottom = Math.max(insets.bottom + 8, 12);

  const indicatorX = useSharedValue(-100);
  const indicatorW = useSharedValue(80);
  const indicatorOpacity = useSharedValue(0);
  const collapseP = useSharedValue(0);
  const expandedOpacity = useSharedValue(1);
  const collapsedOpacity = useSharedValue(0);
  const fabOpacity = useSharedValue(1);
  const fabTranslateY = useSharedValue(0);
  const chevronRotate = useSharedValue(0);
  const fabScale = useSharedValue(1);

  const layoutsRef = useRef<Partial<Record<string, TabLayout>>>({});
  const activeRouteRef = useRef(state.routes[state.index]);
  const isFabActiveRef = useRef(false);
  const isCollapsedRef = useRef(false);

  const visibleRoutes = state.routes.filter(
    route => !descriptors[route.key].options.tabBarButton,
  );

  const activeRoute = state.routes[state.index];
  const isFabActive = activeRoute.name === 'Leave';

  activeRouteRef.current = activeRoute;
  isFabActiveRef.current = isFabActive;
  isCollapsedRef.current = isCollapsed;

  useEffect(() => {
    if (isFabActive || isCollapsed) {
      indicatorOpacity.value = withTiming(0, { duration: 150 });
    } else {
      const layout = layoutsRef.current[activeRoute.key];
      if (layout) {
        indicatorX.value = withSpring(layout.x, SPRING);
        indicatorW.value = withSpring(layout.width, SPRING);
        indicatorOpacity.value = withTiming(1, { duration: 220 });
      }
    }
  }, [state.index, state.routes, isFabActive, isCollapsed, activeRoute.key,
    indicatorX, indicatorW, indicatorOpacity]);

  useEffect(() => {
    collapseP.value = withSpring(isCollapsed ? 1 : 0, SPRING);
    expandedOpacity.value = withTiming(isCollapsed ? 0 : 1, { duration: 220 });
    collapsedOpacity.value = withTiming(isCollapsed ? 1 : 0, { duration: 260 });
    fabOpacity.value = withTiming(isCollapsed ? 0 : 1, { duration: 200 });
    fabTranslateY.value = withSpring(isCollapsed ? 18 : 0, SPRING);
    chevronRotate.value = withSpring(isCollapsed ? 0 : 180, SPRING);
  }, [isCollapsed, collapseP, expandedOpacity, collapsedOpacity, fabOpacity, fabTranslateY, chevronRotate]);

  const handleTabLayout = useCallback((routeKey: string, layout: TabLayout) => {
    layoutsRef.current[routeKey] = layout;
    if (
      routeKey === activeRouteRef.current.key &&
      !isFabActiveRef.current &&
      !isCollapsedRef.current
    ) {
      indicatorX.value = withSpring(layout.x, SPRING);
      indicatorW.value = withSpring(layout.width, SPRING);
      indicatorOpacity.value = withTiming(1, { duration: 220 });
    }
  }, [indicatorX, indicatorW, indicatorOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    height: 64 - collapseP.value * 20,
    borderRadius: 24 - collapseP.value * 2,
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorX.value,
    width: indicatorW.value,
    opacity: indicatorOpacity.value,
  }));

  const expandedRowStyle = useAnimatedStyle(() => ({ opacity: expandedOpacity.value }));
  const collapsedRowStyle = useAnimatedStyle(() => ({ opacity: collapsedOpacity.value }));

  const fabWrapStyle = useAnimatedStyle(() => ({
    opacity: fabOpacity.value,
    transform: [
      { translateX: -(FAB_SIZE / 2) },
      { translateY: fabTranslateY.value },
    ],
  }));

  const fabPressStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotate.value}deg` }],
  }));

  const handleFabPress = () => {
    trigger('impactLight', { enableVibrateFallback: true });
    cancelAnimation(fabScale);
    fabScale.value = withSequence(
      withSpring(0.88, { damping: 8, stiffness: 300 }),
      withSpring(1.0, { damping: 14, stiffness: 200 }),
    );
    navigation.navigate('Leave');
  };

  const expand = () => setIsCollapsed(false);
  const leftRoutes = visibleRoutes.slice(0, 2);
  const rightRoutes = visibleRoutes.slice(2);

  return (
    <Animated.View
      style={[
        styles.container,
        { left: horizontalInset, right: horizontalInset, bottom: tabBarBottom },
        containerStyle,
      ]}
    >
      {/* Inner shine */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.shine, containerStyle]} pointerEvents="none" />

      {/* Sliding pill indicator (expanded only) */}
      <Animated.View style={[styles.indicator, indicatorStyle]} pointerEvents="none" />

      {/* ── Expanded row ──────────────────────────────────────────── */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.row, expandedRowStyle]}
        pointerEvents={isCollapsed ? 'none' : 'auto'}
      >
        {leftRoutes.map(route => {
          const { options } = descriptors[route.key];
          const label = typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title ?? route.name;
          const isFocused = activeRoute.key === route.key;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <TabItem
              key={route.key}
              routeName={route.name as keyof MainTabsParamList}
              label={label}
              isFocused={isFocused}
              collapsed={isCollapsed}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              onTabLayout={layout => handleTabLayout(route.key, layout)}
            />
          );
        })}

        <View style={{ width: FAB_NOTCH_GAP }} />

        {rightRoutes.map(route => {
          const { options } = descriptors[route.key];
          const label = typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title ?? route.name;
          const isFocused = activeRoute.key === route.key;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <TabItem
              key={route.key}
              routeName={route.name as keyof MainTabsParamList}
              label={label}
              isFocused={isFocused}
              collapsed={isCollapsed}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              onTabLayout={layout => handleTabLayout(route.key, layout)}
            />
          );
        })}
      </Animated.View>

      {/* ── Collapsed slim row (all 5 icons) ──────────────────────── */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.collapsedRow, collapsedRowStyle]}
        pointerEvents={isCollapsed ? 'auto' : 'none'}
      >
        {SLIM_TABS.map(tab => {
          const isActive = activeRoute.name === tab.id;
          return (
            <SlimTab
              key={tab.id}
              icon={tab.icon}
              iconActive={tab.iconActive}
              isActive={isActive}
              onPress={() => {
                navigation.navigate(tab.id);
                expand();
              }}
            />
          );
        })}
      </Animated.View>

      {/* ── Center FAB (Leave / Cuti) ──────────────────────────────── */}
      <Animated.View
        style={[styles.fabWrap, fabWrapStyle]}
        pointerEvents={isCollapsed ? 'none' : 'auto'}
      >
        <Pressable onPress={handleFabPress} accessibilityRole="button" accessibilityLabel="Cuti">
          <Animated.View style={[styles.fab, isFabActive && styles.fabActive, fabPressStyle]}>
            <Ionicons name={isFabActive ? 'calendar' : 'add'} size={26} color="#fff" />
          </Animated.View>
        </Pressable>
      </Animated.View>

      {/* ── Collapse chevron ───────────────────────────────────────── */}
      <Pressable
        style={[styles.handle, isCollapsed && styles.handleCollapsed]}
        onPress={() => setIsCollapsed(v => !v)}
        accessibilityLabel="Toggle menu"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Animated.View style={chevronStyle}>
          <Ionicons
            name="chevron-down"
            size={13}
            color={isCollapsed ? ACTIVE_COLOR : INACTIVE_COLOR}
          />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(252,253,254,0.96)',
    borderWidth: 0.5,
    borderColor: 'rgba(200,190,195,0.6)',
    shadowColor: tokens.colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    overflow: 'visible',
  },
  shine: {
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.85)',
    pointerEvents: 'none',
  } as const,
  indicator: {
    position: 'absolute',
    top: 10,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(107,26,43,0.09)',
    borderWidth: 0.5,
    borderColor: 'rgba(107,26,43,0.18)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    includeFontPadding: false,
    letterSpacing: 0.1,
  },
  slimTab: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'transparent',
  },
  slimTabActive: {
    backgroundColor: 'rgba(107,26,43,0.09)',
    borderColor: 'rgba(107,26,43,0.18)',
  },
  fabWrap: {
    position: 'absolute',
    top: -(FAB_SIZE / 2 + 4),
    left: '50%',
    zIndex: 20,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: tokens.colors.maroon,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.colors.maroon,
    shadowOpacity: 0.42,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 12,
  },
  fabActive: {
    backgroundColor: tokens.colors.maroonActive,
  },
  handle: {
    position: 'absolute',
    top: -24,
    right: 10,
    width: 32,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(252,253,254,0.94)',
    borderWidth: 0.5,
    borderColor: 'rgba(200,190,195,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.colors.ink,
    shadowOpacity: 0.07,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  handleCollapsed: {
    backgroundColor: 'rgba(107,26,43,0.08)',
    borderColor: 'rgba(107,26,43,0.22)',
  },
});
