import React from 'react';
import { Pressable } from 'react-native';
import { act, create } from 'react-test-renderer';

jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

jest.mock('react-native-reanimated', () => {
  const { View, Text } = require('react-native');
  const Animated = { View, Text };
  return {
    __esModule: true,
    default: Animated,
    useSharedValue: (init: unknown) => ({ value: init }),
    useAnimatedStyle: () => ({}),
    withSpring: (val: unknown) => val,
    withTiming: (val: unknown) => val,
    withSequence: (...args: unknown[]) => args[args.length - 1],
    cancelAnimation: jest.fn(),
    createAnimatedComponent: (C: unknown) => C,
  };
});

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

jest.mock('@/config/tokens', () => ({
  tokens: {
    colors: {
      maroon: '#6B1A2B',
      textSub: '#6B7280',
      borderWarm: '#E8E0E2',
      ink: '#1A1A1A',
    },
  },
}));

import { AnimatedTabBar } from '../AnimatedTabBar';

const mockNavigation = {
  emit: jest.fn(() => ({ defaultPrevented: false })),
  navigate: jest.fn(),
};

const VISIBLE_ROUTES = [
  { name: 'Home', key: 'Home-key' },
  { name: 'Attendance', key: 'Attendance-key' },
  { name: 'Leave', key: 'Leave-key' },
  { name: 'Performance', key: 'Performance-key' },
  { name: 'Profile', key: 'Profile-key' },
];

const HIDDEN_ROUTES = [
  { name: 'Overtime', key: 'Overtime-key' },
  { name: 'Approvals', key: 'Approvals-key' },
];

const ALL_ROUTES = [...VISIBLE_ROUTES, ...HIDDEN_ROUTES];

const makeDescriptors = () => ({
  ...Object.fromEntries(
    VISIBLE_ROUTES.map(r => [r.key, { options: {}, render: jest.fn() }])
  ),
  'Overtime-key': { options: { tabBarButton: () => null }, render: jest.fn() },
  'Approvals-key': { options: { tabBarButton: () => null }, render: jest.fn() },
});

const makeState = (index = 0) => ({
  key: 'MainTabs',
  index,
  routes: ALL_ROUTES,
  routeNames: ALL_ROUTES.map(r => r.name),
  history: [],
  preloadedRouteKeys: [],
  type: 'tab' as const,
  stale: false as false,
});

const renderTabBar = (index = 0) =>
  create(
    <AnimatedTabBar
      state={makeState(index)}
      descriptors={makeDescriptors() as any}
      navigation={mockNavigation as any}
      insets={{ bottom: 0, top: 0, left: 0, right: 0 }}
    />
  );

const findTabPressables = (root: ReturnType<typeof create>) =>
  root.root.findAll(
    n => n.props.accessibilityRole === 'tab' && typeof n.props.onPress === 'function',
  );

describe('AnimatedTabBar', () => {
  it('renders without crashing', () => {
    expect(() => act(() => { renderTabBar(); })).not.toThrow();
  });


it('renders exactly 5 visible tabs (Overtime and Approvals hidden)', () => {
    let root: ReturnType<typeof create>;
    act(() => { root = renderTabBar(); });
    const tabs = findTabPressables(root!);
    expect(tabs).toHaveLength(5);
  });

  it('active tab has accessibilityState selected=true, others false', () => {
    let root: ReturnType<typeof create>;
    act(() => { root = renderTabBar(2); });
    const tabs = findTabPressables(root!);
    tabs.forEach((tab, i) => {
      expect(tab.props.accessibilityState).toEqual({ selected: i === 2 });
    });
  });

  it('every tab has a non-empty accessibilityLabel', () => {
    let root: ReturnType<typeof create>;
    act(() => { root = renderTabBar(); });
    const tabs = findTabPressables(root!);
    tabs.forEach(tab => {
      expect(typeof tab.props.accessibilityLabel).toBe('string');
      expect(tab.props.accessibilityLabel.length).toBeGreaterThan(0);
    });
  });

  it('triggers haptic on tab press', () => {
    const { trigger } = require('react-native-haptic-feedback');
    let root: ReturnType<typeof create>;
    act(() => { root = renderTabBar(0); });
    const tabs = findTabPressables(root!);
    act(() => { tabs[1].props.onPress(); });
    expect(trigger).toHaveBeenCalledWith('impactLight', { enableVibrateFallback: true });
  });

  it('labels match route names for all 5 visible tabs', () => {
    let root: ReturnType<typeof create>;
    act(() => { root = renderTabBar(); });
    const tabs = findTabPressables(root!);
    const expectedLabels = VISIBLE_ROUTES.map(r => r.name);
    tabs.forEach((tab, i) => {
      expect(tab.props.accessibilityLabel).toBe(expectedLabels[i]);
    });
  });
});
