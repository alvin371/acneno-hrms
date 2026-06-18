import { useNotifFeedStore } from '../notifFeedStore';
import { TEST_NOTIFS } from './fixtures';

describe('useNotifFeedStore', () => {
  beforeEach(() => {
    useNotifFeedStore.setState({ notifs: [] });
  });

  it('starts with an empty notification feed', () => {
    expect(useNotifFeedStore.getState().notifs).toEqual([]);
  });

  it('keeps empty state when mutating actions run without notifications', () => {
    const store = useNotifFeedStore.getState();

    store.markRead('missing-id');
    store.markAll();
    store.dismiss('missing-id');

    expect(useNotifFeedStore.getState().notifs).toEqual([]);
  });

  it('updates existing notifications correctly', () => {
    useNotifFeedStore.setState({ notifs: TEST_NOTIFS.map(item => ({ ...item })) });
    const store = useNotifFeedStore.getState();

    store.markRead(TEST_NOTIFS[0].id);
    store.dismiss(TEST_NOTIFS[2].id);
    store.markAll();

    expect(useNotifFeedStore.getState().notifs).toEqual([
      { ...TEST_NOTIFS[0], read: true },
      { ...TEST_NOTIFS[1], read: true },
    ]);
  });
});
