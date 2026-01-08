import { apiClient } from '@/api/client';
import type { PerformanceRecord } from '@/api/types';

type PerformancePayload = {
  cycle: string;
  achievements: string;
  challenges: string;
  selfScore: number;
  notes?: string;
};

export const getPerformance = async () => {
  const response = await apiClient.get<PerformanceRecord[]>('/performance');
  return response.data;
};

export const createPerformance = async (payload: PerformancePayload) => {
  const response = await apiClient.post('/performance', payload);
  return response.data;
};
