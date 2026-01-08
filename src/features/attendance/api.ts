import { apiClient } from '@/api/client';
import type { AttendanceRecord } from '@/api/types';

export type OfficeProofResponse = {
  ok: boolean;
};

export type AttendancePayload = {
  lat: number;
  lng: number;
  gpsAccuracy: number;
  distanceMeters: number;
  wifiProof: string;
};

export const requestOfficeProof = async () => {
  const response = await apiClient.post<OfficeProofResponse>(
    '/attendance/office-proof'
  );
  return response.data;
};

export const checkIn = async (payload: AttendancePayload) => {
  const response = await apiClient.post('/attendance/check-in', payload);
  return response.data;
};

export const checkOut = async (payload: AttendancePayload) => {
  const response = await apiClient.post('/attendance/check-out', payload);
  return response.data;
};

export const getAttendanceHistory = async () => {
  const response = await apiClient.get<AttendanceRecord[]>(
    '/attendance/history'
  );
  return response.data;
};
