import { authClient } from '@/api/authClient';
import type { AuthResponse, AuthTokens } from '@/api/types';

export const login = async (username: string, password: string) => {
  const response = await authClient.post<AuthResponse>('/auth/login', {
    username,
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
