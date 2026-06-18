import { apiClient } from '@/api/client';
import { uploadFile } from '@/api/upload';
import type {
  Holiday,
  LeaveDetail,
  LeaveQuotaResponse,
  LeaveRecord,
  LeaveTypesResponse,
} from '@/api/types';

type LeavePayload = {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason: string;
  attachment: string;
};

export const getLeaves = async () => {
  const response = await apiClient.get<{ data: LeaveRecord[] }>('/leave');
  return response.data.data;
};

export const getLeaveDetail = async (id: number) => {
  const response = await apiClient.get<LeaveDetail>(`/leave/${id}`);
  return response.data;
};

export const getLeaveQuota = async () => {
  const response = await apiClient.get<LeaveQuotaResponse>('/leave/quota');
  return response.data;
};

export const getLeaveTypes = async () => {
  const response = await apiClient.get<LeaveTypesResponse>('/leave/types');
  return response.data.data;
};

export const getHolidays = async (start?: string, end?: string) => {
  const response = await apiClient.get<{ data: Holiday[] }>('/holidays', {
    params: start && end ? { start, end } : undefined,
  });
  return response.data.data;
};

export const createLeave = async (payload: LeavePayload) => {
  const response = await apiClient.post('/leave', {
    leave_type_id: payload.leaveTypeId,
    start_date: payload.startDate,
    end_date: payload.endDate,
    reason: payload.reason,
    attachment: payload.attachment,
  });
  return response.data;
};

export const cancelLeave = async (id: number) => {
  const response = await apiClient.post<{
    message: string;
    id: number;
    status: string;
  }>(`/leave/${id}/cancel`);
  return response.data;
};

type UploadFilePayload = {
  uri: string;
  name?: string | null;
  type?: string | null;
};

export const uploadLeaveAttachment = async (file: UploadFilePayload) =>
  uploadFile({ ...file, uploadType: 'leave' });
