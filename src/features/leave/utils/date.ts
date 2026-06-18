export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export const MONTHS_FULL = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const DOWS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const DOWS_FULL = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const parseDate = (input: string | Date): Date => {
  if (input instanceof Date) return input;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  return new Date(input);
};

export const fmtDate = (input: string | Date): string => {
  const d = parseDate(input);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export const fmtDateLong = (input: string | Date): string => {
  const d = parseDate(input);
  return `${d.getUTCDate()} ${MONTHS_FULL[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export const fmtDowShort = (input: string | Date): string => {
  const d = parseDate(input);
  return DOWS[d.getUTCDay()];
};

export const fmtDowFull = (input: string | Date): string => {
  const d = parseDate(input);
  return DOWS_FULL[d.getUTCDay()];
};

export const fmtRange = (start: string | Date, end: string | Date): string =>
  `${fmtDate(start)} → ${fmtDate(end)}`;

export const daysBetween = (start: string | Date, end: string | Date): number => {
  const s = parseDate(start).getTime();
  const e = parseDate(end).getTime();
  return Math.floor((e - s) / 86400000) + 1;
};

export const monthKey = (input: string | Date): string => {
  const d = parseDate(input);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const monthLabel = (input: string | Date): string => {
  const d = parseDate(input);
  return `${MONTHS_FULL[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export const fmtTimestamp = (input: string | Date): string => {
  try {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return String(input);
    const day = d.getDate();
    const month = MONTHS_FULL[d.getMonth()];
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${h}:${min}`;
  } catch {
    return String(input);
  }
};

export const fmtRelative = (input: string | Date): string => {
  const target = parseDate(input).getTime();
  const now = Date.now();
  const diff = Math.floor((now - target) / 1000);
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return fmtDate(input);
};
