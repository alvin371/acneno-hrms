import React from 'react';
import * as ReactNative from 'react-native';
import { act, create } from 'react-test-renderer';

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  return {
    BottomTabBarHeightContext: React.createContext(0),
  };
});

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { MiniboxDropdown } from '../components/MiniboxDropdown';
import { TEST_NOTIFS } from './fixtures';

const noop = () => {};

const renderDropdown = () =>
  create(
    <BottomTabBarHeightContext.Provider value={84}>
      <MiniboxDropdown
        visible
        notifs={TEST_NOTIFS}
        onClose={noop}
        onViewAll={noop}
        onMarkAll={noop}
        onTapItem={noop}
      />
    </BottomTabBarHeightContext.Provider>,
  );

const flattenStyle = (value: unknown): Record<string, unknown> => {
  if (Array.isArray(value)) {
    return value.reduce<Record<string, unknown>>(
      (acc, item) => ({ ...acc, ...flattenStyle(item) }),
      {},
    );
  }

  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }

  return {};
};

describe('MiniboxDropdown', () => {
  beforeEach(() => {
    jest
      .spyOn(ReactNative, 'useWindowDimensions')
      .mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 1 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps header, scroll area, and footer as separate regions', () => {
    let root: ReturnType<typeof create>;
    act(() => {
      root = renderDropdown();
    });

    expect(root!.root.findByProps({ testID: 'notification-popover-card' })).toBeTruthy();
    expect(root!.root.findByProps({ testID: 'notification-popover-scroll-area' })).toBeTruthy();
    expect(root!.root.findByProps({ testID: 'notification-popover-footer' })).toBeTruthy();
    expect(root!.root.findByProps({ children: 'Lihat semua notifikasi' })).toBeTruthy();
  });

  it('applies constrained popover dimensions from viewport and safe areas', () => {
    let root: ReturnType<typeof create>;
    act(() => {
      root = renderDropdown();
    });

    const card = root!.root.findByProps({ testID: 'notification-popover-card' });
    const style = flattenStyle(card.props.style);

    expect(typeof style.width).toBe('number');
    expect(style.width as number).toBeLessThanOrEqual(360);
    expect(style.top).toBe(104);
    expect(typeof style.maxHeight).toBe('number');
    expect(style.maxHeight as number).toBeGreaterThanOrEqual(240);
    expect(style.borderRadius).toBe(24);
  });

  it('renders row icon, content, and trailing unread slot separately', () => {
    let root: ReturnType<typeof create>;
    act(() => {
      root = renderDropdown();
    });

    const unreadItem = TEST_NOTIFS.find(item => !item.read);
    expect(unreadItem).toBeTruthy();

    expect(
      root!.root.findByProps({ testID: `notification-row-icon-${unreadItem!.id}` }),
    ).toBeTruthy();
    expect(
      root!.root.findByProps({ testID: `notification-row-content-${unreadItem!.id}` }),
    ).toBeTruthy();
    expect(
      root!.root.findByProps({ testID: `notification-row-trailing-${unreadItem!.id}` }),
    ).toBeTruthy();
    expect(
      root!.root.findByProps({ testID: `notification-row-unread-${unreadItem!.id}` }),
    ).toBeTruthy();
  });

  it('keeps footer outside the scroll viewport and row layout horizontal', () => {
    let root: ReturnType<typeof create>;
    act(() => {
      root = renderDropdown();
    });

    const firstItem = TEST_NOTIFS[0];
    const row = root!.root.findByProps({ testID: `notification-row-${firstItem.id}` });
    const rowStyle = flattenStyle(row.props.style({ pressed: false }));
    const trailing = root!.root.findByProps({ testID: `notification-row-trailing-${firstItem.id}` });
    const trailingStyle = flattenStyle(trailing.props.style);
    const footer = root!.root.findByProps({ testID: 'notification-popover-footer' });
    const scrollArea = root!.root.findByProps({ testID: 'notification-popover-scroll-area' });

    expect(rowStyle.flexDirection).toBe('row');
    expect(rowStyle.alignItems).toBe('flex-start');
    expect(trailingStyle.width).toBe(8);
    expect(trailingStyle.height).toBe(40);
    expect(trailingStyle.justifyContent).toBe('center');
    expect(footer.parent).not.toBe(scrollArea);
  });

  it('renders an empty state when there are no notifications', () => {
    let root: ReturnType<typeof create>;
    act(() => {
      root = create(
        <BottomTabBarHeightContext.Provider value={84}>
          <MiniboxDropdown
            visible
            notifs={[]}
            onClose={noop}
            onViewAll={noop}
            onMarkAll={noop}
            onTapItem={noop}
          />
        </BottomTabBarHeightContext.Provider>,
      );
    });

    expect(root!.root.findByProps({ testID: 'notification-popover-empty-state' })).toBeTruthy();
    expect(root!.root.findByProps({ children: 'Belum ada notifikasi' })).toBeTruthy();
  });
});
