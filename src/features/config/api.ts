import { apiClient } from '@/api/client';
import type { ConfigResponse } from '@/api/types';

export const getConfig = async () => {
  const response = await apiClient.get<ConfigResponse>('/config');
  return response.data;
};
