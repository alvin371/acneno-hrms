import type { PerformanceTemplateItem } from '@/api/types';

export const formatScore = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2);

export const calculateScorePreview = (
  actualValue: number,
  targetValue: number,
  weight: number
): { scoreRatio: number; finalScore: number } => {
  if (targetValue === 0) return { scoreRatio: 0, finalScore: 0 };
  const scoreRatio = Math.min(actualValue / targetValue, 1);
  const finalScore = scoreRatio * weight;
  return { scoreRatio, finalScore };
};

export const calculateTotalScore = (
  formItems: Array<{ templateItemId: number | string; actualValue: number | string }>,
  templateItems: PerformanceTemplateItem[]
): number => {
  return formItems.reduce((total, formItem) => {
    const itemId =
      typeof formItem.templateItemId === 'string'
        ? parseInt(formItem.templateItemId, 10)
        : formItem.templateItemId;
    const templateItem = templateItems.find((t) => t.id === itemId);
    if (!templateItem) return total;
    const actualValue =
      typeof formItem.actualValue === 'string'
        ? parseFloat(formItem.actualValue) || 0
        : formItem.actualValue || 0;
    const { finalScore } = calculateScorePreview(
      actualValue,
      templateItem.target_value,
      templateItem.weight
    );
    return total + finalScore;
  }, 0);
};

export const statusToVariant = (
  status: string
): 'pending' | 'submitted' | 'approved' | 'rejected' | 'cancelled' => {
  switch (status.toUpperCase()) {
    case 'APPROVED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    case 'SUBMITTED':
      return 'submitted';
    case 'CANCELLED':
    case 'CANCELED':
      return 'cancelled';
    default:
      return 'pending';
  }
};
