import type { OvertimeStatus, OvertimeStatusRaw } from '@/api/types';

export const statusToVariant = (
  status: OvertimeStatus | OvertimeStatusRaw
): 'pending' | 'approved' | 'rejected' | 'cancelled' => {
  switch (status) {
    case 'Approved':
    case 'APPROVED':
      return 'approved';
    case 'Rejected':
    case 'REJECTED':
      return 'rejected';
    case 'Cancelled':
    case 'CANCELLED':
      return 'cancelled';
    case 'Pending':
    case 'SUBMITTED':
    case 'IN_REVIEW':
    default:
      return 'pending';
  }
};

export const formatDurationHours = (hours: number) => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (wholeHours === 0) return `${minutes} mins`;
  if (minutes === 0) return `${wholeHours} hrs`;
  return `${wholeHours} hrs ${minutes} mins`;
};
