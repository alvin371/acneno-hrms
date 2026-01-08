import { apiClient } from '@/api/client';
import type { LeaveQuota, LeaveRecord } from '@/api/types';

type LeavePayload = {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUri?: string | null;
};

export const getLeaves = async () => {
  const response = await apiClient.get<{ data: LeaveRecord[] }>('/leave');
  return response.data.data;
};

export const getLeaveQuota = async () => {
  const response = await apiClient.get<LeaveQuota>('/leave/quota');
  return response.data;
};

export const createLeave = async (payload: LeavePayload) => {
  if (payload.attachmentUri) {
    const formData = new FormData();
    formData.append('leave_type_id', String(payload.leaveTypeId));
    formData.append('start_date', payload.startDate);
    formData.append('end_date', payload.endDate);
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

  const response = await apiClient.post('/leave', {
    leave_type_id: payload.leaveTypeId,
    start_date: payload.startDate,
    end_date: payload.endDate,
    reason: payload.reason,
  });
  return response.data;
};
