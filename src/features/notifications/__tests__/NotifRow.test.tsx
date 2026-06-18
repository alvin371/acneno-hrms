import React from 'react';
import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

import { NotifRow } from '../components/NotifRow';
import { TEST_NOTIFS } from './fixtures';

const noop = () => {};

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

describe('NotifRow', () => {
  it('renders unread dot in a trailing slot instead of over the icon', () => {
    const notification = TEST_NOTIFS.find(item => !item.read);
    expect(notification).toBeTruthy();

    let root: ReturnType<typeof create>;
    act(() => {
      root = create(
        <NotifRow notification={notification!} onTap={noop} />,
      );
    });

    const iconSlot = root!.root.findByProps({ testID: `notif-row-icon-${notification!.id}` });
    const trailingSlot = root!.root.findByProps({ testID: `notif-row-trailing-${notification!.id}` });
    const row = root!.root.findByProps({ testID: `notif-row-${notification!.id}` });
    const rowStyle = flattenStyle(row.props.style({ pressed: false }));
    const trailingStyle = flattenStyle(trailingSlot.props.style);
    const iconUnreadDots = iconSlot.findAllByProps({ testID: `notif-row-unread-${notification!.id}` });
    const trailingUnreadDots = trailingSlot.findAll(
      node => node.props.testID === `notif-row-unread-${notification!.id}`,
    );

    expect(rowStyle.flexDirection).toBe('row');
    expect(rowStyle.alignItems).toBe('flex-start');
    expect(trailingStyle.height).toBe(40);
    expect(trailingStyle.justifyContent).toBe('center');
    expect(iconUnreadDots).toHaveLength(0);
    expect(trailingUnreadDots.length).toBeGreaterThan(0);
  });

  it('keeps title, description, and time inside the content column', () => {
    const notification = TEST_NOTIFS[0];

    let root: ReturnType<typeof create>;
    act(() => {
      root = create(
        <NotifRow notification={notification} onTap={noop} />,
      );
    });

    const contentSlot = root!.root.findByProps({ testID: `notif-row-content-${notification.id}` });
    const contentTexts = contentSlot.findAllByType(Text).map(node => node.props.children);

    expect(contentTexts).toContain(notification.title);
    expect(contentTexts).toContain(notification.body);
    expect(contentTexts).toContain(notification.time);
  });
});
