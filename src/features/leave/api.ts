import { apiClient } from '@/api/client';
import type { LeaveQuota, LeaveRecord } from '@/api/types';

type LeavePayload = {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUri?: string | null;
};

export const getLeaves = async () => {
  const response = await apiClient.get<LeaveRecord[]>('/leave');
  return response.data;
};

export const getLeaveQuota = async () => {
  const response = await apiClient.get<LeaveQuota>('/leave/quota');
  return response.data;
};

export const createLeave = async (payload: LeavePayload) => {
  if (payload.attachmentUri) {
    const formData = new FormData();
    formData.append('leaveType', payload.leaveType);
    formData.append('startDate', payload.startDate);
    formData.append('endDate', payload.endDate);
    formData.append('reason', payload.reason);
    formData.append('attachment', {
      uri: payload.attachmentUri,
      name: 'attachment',
      type: 'application/octet-stream',
    } as any);

    const response = await apiClient.post('/leave', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  const response = await apiClient.post('/leave', payload);
  return response.data;
};
