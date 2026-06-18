import { apiClient } from '@/api/client';
import { authClient } from '@/api/authClient';
import type { AuthResponse, AuthTokens, User } from '@/api/types';

export const login = async (identifier: string, password: string) => {
  const normalizedIdentifier = identifier.trim();
  const response = await authClient.post<AuthResponse>('/auth/login', {
    identifier: normalizedIdentifier,
    ...(normalizedIdentifier.includes('@')
      ? { email: normalizedIdentifier }
      : { username: normalizedIdentifier }),
    password,
  });
  return response.data;
};

export const refreshTokens = async (refreshToken: string) => {
  const response = await authClient.post<AuthTokens>('/auth/refresh', {
    refreshToken,
  });
  return response.data;
};

export type ProfileUpdatePayload = {
  name?: string;
  email?: string;
  profilePicture?: string;
  keterangan?: string;
  phone?: string;
  phone_number?: string;
};

export const updateProfile = async (payload: ProfileUpdatePayload) => {
  const response = await apiClient.patch<User>('/profile', payload);
  return response.data;
};

export type PasswordChangePayload = {
  oldPassword: string;
  newPassword: string;
  passwordConfirmation: string;
};

export const changePassword = async (payload: PasswordChangePayload) => {
  const response = await apiClient.post<{ ok: boolean }>('/profile/password', payload);
  return response.data;
};
