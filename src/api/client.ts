import axios, { AxiosError, AxiosInstance } from 'axios';
import { env } from '@/config/env';
import { getErrorMessage } from './error';
import type { AuthTokens } from './types';
import { useAuthStore } from '@/store/authStore';
import { authClient } from './authClient';

const createClient = () =>
  axios.create({
    baseURL: env.API_BASE_URL,
    timeout: 15000,
  });

let refreshPromise: Promise<AuthTokens> | null = null;

const requestTokenRefresh = async (refreshToken: string) => {
  if (!refreshPromise) {
    refreshPromise = authClient
      .post<AuthTokens>('/auth/refresh', { refreshToken })
      .then((response) => response.data)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const apiClient: AxiosInstance = createClient();

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & {
      _retry?: boolean;
    });

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        await useAuthStore.getState().clearSession();
        return Promise.reject(error);
      }

      try {
        const tokens = await requestTokenRefresh(refreshToken);
        await useAuthStore.getState().setSession({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: useAuthStore.getState().user,
        });
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await useAuthStore.getState().clearSession();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(new Error(getErrorMessage(error)));
  }
);
