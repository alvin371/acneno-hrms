import { apiClient } from '@/api/client';
import type {
  ApprovalActionResponse,
  LeaveApprovalActionResponse,
  LeaveApprovalDetailResponse,
  LeaveApprovalTaskListResponse,
  OvertimeApprovalDetailResponse,
  OvertimeApprovalTaskListResponse,
} from '@/api/types';

type ApprovalListParams = {
  status?: 'pending' | 'all';
  limit?: number;
};

// ─── Leave approvals ──────────────────────────────────────────────────────────

export const getLeaveApprovals = async (params?: ApprovalListParams) => {
  const response = await apiClient.get<LeaveApprovalTaskListResponse>('/leave/approvals', { params });
  return response.data;
};

export const getLeaveApprovalDetail = async (stepId: number) => {
  const response = await apiClient.get<LeaveApprovalDetailResponse>(`/leave/approvals/${stepId}`);
  return response.data;
};

export const approveLeave = async (stepId: number, payload?: { notes?: string }) => {
  const response = await apiClient.post<LeaveApprovalActionResponse>(
    `/leave/approvals/${stepId}/approve`,
    payload ?? {}
  );
  return response.data;
};

export const rejectLeave = async (stepId: number, payload: { notes?: string }) => {
  const response = await apiClient.post<LeaveApprovalActionResponse>(
    `/leave/approvals/${stepId}/reject`,
    payload
  );
  return response.data;
};

export const getLeaveApprovalHistory = async (limit?: number) => {
  const response = await apiClient.get<LeaveApprovalTaskListResponse>('/leave/approvals/history', {
    params: limit ? { limit } : undefined,
  });
  return response.data;
};

// ─── Overtime approvals ───────────────────────────────────────────────────────

export const getOvertimeApprovals = async (params?: ApprovalListParams) => {
  const response = await apiClient.get<OvertimeApprovalTaskListResponse>('/overtime/approvals', { params });
  return response.data;
};

export const getOvertimeApprovalDetail = async (stepId: number) => {
  const response = await apiClient.get<OvertimeApprovalDetailResponse>(`/overtime/approvals/${stepId}`);
  return response.data;
};

export const approveOvertime = async (stepId: number, payload?: { notes?: string }) => {
  const response = await apiClient.post<ApprovalActionResponse>(
    `/overtime/approvals/${stepId}/approve`,
    payload ?? {}
  );
  return response.data;
};

export const rejectOvertime = async (stepId: number, payload: { notes?: string }) => {
  const response = await apiClient.post<ApprovalActionResponse>(
    `/overtime/approvals/${stepId}/reject`,
    payload
  );
  return response.data;
};

export const getOvertimeApprovalInbox = async () => {
  const response = await apiClient.get<OvertimeApprovalTaskListResponse>('/overtime/approvals/inbox');
  return response.data;
};

export const getOvertimeApprovalInboxCount = async () => {
  const response = await apiClient.get<{ count: number }>('/overtime/approvals/inbox/count');
  return response.data;
};

export const getOvertimeApprovalHistory = async (limit?: number) => {
  const response = await apiClient.get<OvertimeApprovalTaskListResponse>('/overtime/approvals/history', {
    params: limit ? { limit } : undefined,
  });
  return response.data;
};
