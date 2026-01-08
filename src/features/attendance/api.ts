import { apiClient } from '@/api/client';
import type {
  AttendanceRecord,
  AttendanceRecap,
  AttendanceRecapAllEntry,
  AttendanceReport,
} from '@/api/types';

export type OfficeProofResponse = {
  ok: boolean;
};

export type WifiProof = {
  bssid?: string;
  ssid?: string;
};

export type AttendancePayload = {
  lat: number;
  lng: number;
  gpsAccuracy: number;
  distanceMeters: number;
  wifiProof?: WifiProof;
};

export const requestOfficeProof = async (wifiProof: WifiProof) => {
  const response = await apiClient.post<OfficeProofResponse>(
    '/attendance/office-proof',
    {
      wifiProof,
    }
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
  const response = await apiClient.get<{ data: AttendanceRecord[] }>(
    '/attendance/history'
  );
  return response.data.data;
};

export const getAttendanceRecap = async (month?: string) => {
  const response = await apiClient.get<AttendanceRecap>('/attendance/recap', {
    params: month ? { month } : undefined,
  });
  return response.data;
};

export const getAttendanceRecapAll = async (month: string) => {
  const response = await apiClient.get<{
    month: string;
    data: AttendanceRecapAllEntry[];
  }>('/attendance/recap-all', {
    params: { month },
  });
  return response.data;
};

export const getAttendanceReport = async (month: string) => {
  const response = await apiClient.get<AttendanceReport>('/attendance/report', {
    params: { month },
  });
  return response.data;
};
