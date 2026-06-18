import type { UserSchedule } from '@/api/types';

type ScheduleLike = Pick<UserSchedule, 'start_time' | 'end_time'> | null | undefined;

export const formatScheduleRange = (
  schedule: ScheduleLike,
  fallback = '-'
) => {
  if (!schedule?.start_time || !schedule?.end_time) {
    return fallback;
  }

  return `${schedule.start_time} - ${schedule.end_time}`;
};
