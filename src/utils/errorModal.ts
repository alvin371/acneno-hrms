import { useErrorModalStore } from '@/store/errorModalStore';

export const showErrorModal = (message: string, title?: string) => {
  if (!message) {
    return;
  }

  useErrorModalStore.getState().show({ message, title });
};

export const hideErrorModal = () => {
  useErrorModalStore.getState().hide();
};
