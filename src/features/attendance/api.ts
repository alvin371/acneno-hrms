import { apiClient } from '@/api/client';
import type {
  AttendanceCheckResponse,
  AttendanceDashboardResponse,
  AttendanceRecord,
  AttendanceRecap,
  AttendanceRecapAllEntry,
  AttendanceReport,
  AttendanceStatusResponse,
  OutOfTownCheckPayload,
  WifiProof,
} from '@/api/types';

export type OfficeProofResponse = {
  ok: boolean;
};

export type AttendancePayload = {
  lat: number;
  lng: number;
  gpsAccuracy: number;
  distanceMeters: number;
  wifiProof?: WifiProof;
  method?: 'office' | 'trip';
  tripLocation?: string;
};

export type AttendanceReasonPayload = {
  reason?: string;
  attachment_path?: string;
};

export const requestOfficeProof = async (wifiProof: WifiProof) => {
  const response = await apiClient.post<OfficeProofResponse>(
    '/attendance/office-proof',
    { wifiProof }
  );
  return response.data;
};

export const getAttendanceStatus = async (params: {
  lat: number;
  lng: number;
  accuracy: number;
  bssid?: string;
  ssid?: string;
  bssids?: string;
  ssids?: string;
}) => {
  const response = await apiClient.get<AttendanceStatusResponse>('/attendance/status', { params });
  return response.data;
};

export const checkIn = async (payload: AttendancePayload) => {
  const response = await apiClient.post<AttendanceCheckResponse>('/attendance/check-in', payload);
  return response.data;
};

export const checkOut = async (payload: AttendancePayload) => {
  const response = await apiClient.post<AttendanceCheckResponse>('/attendance/check-out', payload);
  return response.data;
};

export const outOfTownCheckIn = async (payload: OutOfTownCheckPayload) => {
  const response = await apiClient.post<AttendanceCheckResponse>(
    '/attendance/out-of-town/check-in',
    payload
  );
  return response.data;
};

export const outOfTownCheckOut = async (payload: OutOfTownCheckPayload) => {
  const response = await apiClient.post<AttendanceCheckResponse>(
    '/attendance/out-of-town/check-out',
    payload
  );
  return response.data;
};

export const getAttendanceHistory = async () => {
  const response = await apiClient.get<{ data: AttendanceRecord[] }>('/attendance/history');
  return response.data.data;
};

export const getAttendanceDashboard = async (month?: string) => {
  const response = await apiClient.get<AttendanceDashboardResponse>('/attendance/dashboard', {
    params: month ? { month } : undefined,
  });
  return response.data;
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

export const submitAttendanceReason = async (id: number, payload: AttendanceReasonPayload) => {
  const response = await apiClient.post(`/attendance/${id}/reason`, payload);
  return response.data;
};
