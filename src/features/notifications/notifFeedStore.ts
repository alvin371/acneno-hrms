import { create } from 'zustand';
import type { InAppNotification } from './types';

interface NotifFeedStore {
  notifs: InAppNotification[];
  markRead: (id: string) => void;
  markAll: () => void;
  dismiss: (id: string) => void;
}

export const useNotifFeedStore = create<NotifFeedStore>((set) => ({
  notifs: [],
  markRead: (id) => set(s => ({ notifs: s.notifs.map(n => n.id === id ? { ...n, read: true } : n) })),
  markAll:  ()   => set(s => ({ notifs: s.notifs.map(n => ({ ...n, read: true })) })),
  dismiss:  (id) => set(s => ({ notifs: s.notifs.filter(n => n.id !== id) })),
}));
