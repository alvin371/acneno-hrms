import { apiClient } from '@/api/client';
import type { Profile } from '@/api/types';

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
  phone_number?: string;
};

export const getProfile = async () => {
  const response = await apiClient.get<Profile>('/profile');
  return response.data;
};

export const updateProfile = async (payload: UpdateProfilePayload) => {
  const response = await apiClient.patch<Profile>('/profile', payload);
  return response.data;
};
