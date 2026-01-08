import { apiClient } from '@/api/client';

export type PinVerifyResponse = {
  ok: boolean;
  locked?: boolean;
  lockedUntil?: string;
};

export const setupPin = async (pin: string) => {
  const response = await apiClient.post<{ ok: boolean }>('/pin/setup', { pin });
  return response.data;
};

export const verifyPin = async (pin: string) => {
  const response = await apiClient.post<PinVerifyResponse>('/pin/verify', { pin });
  return response.data;
};

export const resetPin = async (password: string) => {
  const response = await apiClient.post<{ ok: boolean }>('/pin/reset', {
    password,
  });
  return response.data;
};
