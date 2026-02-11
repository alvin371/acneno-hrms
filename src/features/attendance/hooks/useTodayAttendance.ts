import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAttendanceHistory } from '@/features/attendance/api';
import { isSameDay, parseServerDateTime } from '@/features/attendance/utils';

export const useTodayAttendance = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['attendance-history'],
    queryFn: getAttendanceHistory,
  });

  return useMemo(() => {
    if (!data) {
      return { checkInTime: null, checkOutTime: null, isLoading };
    }

    const today = new Date();
    let checkInTime: Date | null = null;
    let checkOutTime: Date | null = null;

    for (const record of data) {
      const parsed = parseServerDateTime(record.created_at);
      if (!parsed || !isSameDay(parsed, today)) {
        continue;
      }
      if (record.type === 'IN') {
        // Take first (earliest) IN record
        if (!checkInTime || parsed < checkInTime) {
          checkInTime = parsed;
        }
      }
      if (record.type === 'OUT') {
        // Take last (latest) OUT record
        if (!checkOutTime || parsed > checkOutTime) {
          checkOutTime = parsed;
        }
      }
    }

    return { checkInTime, checkOutTime, isLoading };
  }, [data, isLoading]);
};
