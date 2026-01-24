import { create } from 'zustand';

type ErrorModalPayload = {
  message: string;
  title?: string;
};

type ErrorModalState = {
  isVisible: boolean;
  title?: string;
  message?: string;
  show: (payload: ErrorModalPayload) => void;
  hide: () => void;
  clear: () => void;
};

export const useErrorModalStore = create<ErrorModalState>((set) => ({
  isVisible: false,
  title: undefined,
  message: undefined,
  show: ({ message, title }) => set({ isVisible: true, message, title }),
  hide: () => set({ isVisible: false }),
  clear: () => set({ isVisible: false, title: undefined, message: undefined }),
}));
