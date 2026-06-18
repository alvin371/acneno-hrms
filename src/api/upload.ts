import { apiClient } from '@/api/client';
import type { UploadResponse } from '@/api/types';

export type UploadFilePayload = {
  uri: string;
  name?: string | null;
  type?: string | null;
  uploadType?: string;
};

export const uploadFile = async ({
  uri,
  name,
  type,
  uploadType = 'leave',
}: UploadFilePayload) => {
  const formData = new FormData();
  formData.append('type', uploadType);
  formData.append(
    'file',
    {
      uri,
      name: name || 'attachment',
      type: type || 'application/octet-stream',
    } as any
  );

  const response = await apiClient.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
