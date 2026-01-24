import { apiClient } from '@/api/client';
import type {
  PerformanceSubmission,
  PerformanceSubmissionDetail,
  PerformanceTemplate,
} from '@/api/types';

type SubmissionPayload = {
  templateId: number;
  items: Array<{
    templateItemId: number;
    actualValue: number;
  }>;
};

export const getActiveTemplate = async (periodYear?: number) => {
  const response = await apiClient.get<{ data: PerformanceTemplate }>(
    '/performance/templates/active',
    {
      params: periodYear ? { period_year: periodYear } : undefined,
    }
  );
  return response.data.data;
};

export const getPerformanceSubmissions = async (periodYear?: number) => {
  const response = await apiClient.get<{ data: PerformanceSubmission[] }>(
    '/performance/submissions',
    {
      params: periodYear ? { period_year: periodYear } : undefined,
    }
  );
  return response.data.data;
};

export const getPerformanceSubmission = async (id: number) => {
  const response = await apiClient.get<{ data: PerformanceSubmissionDetail }>(
    `/performance/submissions/${id}`
  );
  return response.data.data;
};

export const createPerformanceSubmission = async (payload: SubmissionPayload) => {
  const response = await apiClient.post('/performance/submissions', {
    template_id: payload.templateId,
    items: payload.items.map((item) => ({
      template_item_id: item.templateItemId,
      actual_value: item.actualValue,
    })),
  });
  return response.data;
};
