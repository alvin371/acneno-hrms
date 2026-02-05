import { apiClient } from '@/api/client';
import type { OvertimeDetail, OvertimeRecord, OvertimeType, UploadResponse } from '@/api/types';

type OvertimePayload = {
  overtimeTypeId: number;
  overtimeDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  attachment: string;
};

type CreateOvertimeResponse = {
  id: number;
  requestNo: string;
  status: string;
  statusRaw: string;
  durationHours: number;
};

type CancelOvertimeResponse = {
  message: string;
  id: number;
  status: string;
};

export const getOvertimeTypes = async () => {
  const response = await apiClient.get<{ data: OvertimeType[] }>('/overtime/types');
  return response.data.data;
};

export const getOvertimes = async (params?: { status?: string; month?: string }) => {
  const response = await apiClient.get<{ data: OvertimeRecord[] }>('/overtime', { params });
  return response.data.data;
};

export const getOvertimeDetail = async (id: number) => {
  const response = await apiClient.get<OvertimeDetail>(`/overtime/${id}`);
  return response.data;
};

export const createOvertime = async (payload: OvertimePayload) => {
  const response = await apiClient.post<CreateOvertimeResponse>('/overtime', {
    overtime_type_id: payload.overtimeTypeId,
    overtime_date: payload.overtimeDate,
    start_time: payload.startTime,
    end_time: payload.endTime,
    reason: payload.reason,
    attachment: payload.attachment,
  });
  return response.data;
};

export const cancelOvertime = async (id: number) => {
  const response = await apiClient.post<CancelOvertimeResponse>(`/overtime/${id}/cancel`);
  return response.data;
};

type UploadFilePayload = {
  uri: string;
  name?: string | null;
  type?: string | null;
};

export const uploadOvertimeAttachment = async (file: UploadFilePayload) => {
  const formData = new FormData();
  formData.append('type', 'leave'); // TODO: change back to 'overtime' once backend supports it
  formData.append('file', {
    uri: file.uri,
    name: file.name || 'attachment',
    type: file.type || 'application/octet-stream',
  } as any);

  const response = await apiClient.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
