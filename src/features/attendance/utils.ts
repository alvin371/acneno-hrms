import type { AttendanceReport } from '@/api/types';

export const parseServerDateTime = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const shiftMonthKey = (monthKey: string, delta: number) => {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + delta);
  return toMonthKey(date);
};

export const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

export const formatTime = (value?: string | null) => {
  const parsed = parseServerDateTime(value);
  if (!parsed) {
    return '-';
  }
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const csvEscape = (value: string | number | boolean | null | undefined) => {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const buildAttendanceCsv = (report: AttendanceReport) => {
  const summary = report.summary;
  const summaryLines = [
    'Summary',
    `Month,${csvEscape(summary.month)}`,
    `Present Days,${csvEscape(summary.present_days)}`,
    `Late Count,${csvEscape(summary.late_count)}`,
    `Early Checkout Count,${csvEscape(summary.early_checkout_count)}`,
    `Absent Count,${csvEscape(summary.absent_count)}`,
    `Leave Days,${csvEscape(summary.leave_days)}`,
    `Start Time,${csvEscape(summary.start_time)}`,
    `End Time,${csvEscape(summary.end_time)}`,
    '',
  ];

  const header = [
    'Date',
    'Status',
    'First In',
    'Last Out',
    'Late',
    'Early Checkout',
    'Holiday',
  ];
  const rows = report.daily.map((day) =>
    [
      day.date,
      day.status,
      day.first_in ?? '',
      day.last_out ?? '',
      day.late ? 'Yes' : 'No',
      day.early_checkout ? 'Yes' : 'No',
      day.holiday_name ?? '',
    ]
      .map(csvEscape)
      .join(',')
  );

  return [...summaryLines, header.join(','), ...rows].join('\n');
};
