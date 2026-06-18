import type { LeaveStatus } from '@/api/types';

export const CRIMSON = {
  cr: '#8B1F2F',
  cr2: '#A02030',
  cr3: '#5A0F1A',
  cr4: '#3D0A12',
} as const;

export const STATUS_COLOR = {
  green: '#16A34A',
  greenBg: '#DCFCE7',
  amber: '#D97706',
  amberBg: '#FEF3C7',
  red: '#DC2626',
  redBg: '#FEE2E2',
  gray: '#9CA3AF',
  grayBg: '#F3F4F6',
} as const;

export type LeaveTypeMeta = {
  icon: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  requiresDoc: boolean;
};

const TAHUNAN: LeaveTypeMeta = {
  icon: '🏖️',
  label: 'Tahunan',
  color: '#0E7490',
  bg: 'rgba(14,116,144,0.10)',
  border: 'rgba(14,116,144,0.25)',
  requiresDoc: false,
};

const SAKIT: LeaveTypeMeta = {
  icon: '🩺',
  label: 'Sakit',
  color: '#B45309',
  bg: 'rgba(180,83,9,0.10)',
  border: 'rgba(180,83,9,0.25)',
  requiresDoc: true,
};

const MELAHIRKAN: LeaveTypeMeta = {
  icon: '👶',
  label: 'Melahirkan',
  color: '#A21CAF',
  bg: 'rgba(162,28,175,0.10)',
  border: 'rgba(162,28,175,0.25)',
  requiresDoc: true,
};

const MENIKAH: LeaveTypeMeta = {
  icon: '💍',
  label: 'Menikah',
  color: CRIMSON.cr,
  bg: 'rgba(139,31,47,0.10)',
  border: 'rgba(139,31,47,0.25)',
  requiresDoc: false,
};

const DUKA: LeaveTypeMeta = {
  icon: '🕊️',
  label: 'Duka',
  color: '#475569',
  bg: 'rgba(71,85,105,0.10)',
  border: 'rgba(71,85,105,0.25)',
  requiresDoc: false,
};

const FALLBACK: LeaveTypeMeta = {
  icon: '📄',
  label: 'Cuti',
  color: CRIMSON.cr,
  bg: 'rgba(139,31,47,0.10)',
  border: 'rgba(139,31,47,0.25)',
  requiresDoc: false,
};

const META_BY_CODE: Record<string, LeaveTypeMeta> = {
  ANNUAL: TAHUNAN,
  TAHUNAN: TAHUNAN,
  SICK: SAKIT,
  SAKIT: SAKIT,
  MATERNITY: MELAHIRKAN,
  MELAHIRKAN: MELAHIRKAN,
  MARRIAGE: MENIKAH,
  MENIKAH: MENIKAH,
  BEREAVEMENT: DUKA,
  DUKA: DUKA,
};

export const getLeaveMeta = (code?: string | null): LeaveTypeMeta => {
  if (!code) return FALLBACK;
  return META_BY_CODE[code.toUpperCase()] ?? FALLBACK;
};

export type LeaveStatusKind = 'pending' | 'approved' | 'rejected' | 'cancelled';

export const normalizeStatus = (status: LeaveStatus | string): LeaveStatusKind => {
  const s = String(status).toUpperCase();
  if (s === 'APPROVED') return 'approved';
  if (s === 'REJECTED') return 'rejected';
  if (s === 'CANCELLED' || s === 'CANCELED') return 'cancelled';
  return 'pending';
};

export type StatusMeta = {
  label: string;
  short: string;
  color: string;
  bg: string;
};

export const STATUS_META: Record<LeaveStatusKind, StatusMeta> = {
  pending: {
    label: 'Menunggu Persetujuan',
    short: 'Menunggu',
    color: STATUS_COLOR.amber,
    bg: STATUS_COLOR.amberBg,
  },
  approved: {
    label: 'Disetujui',
    short: 'Disetujui',
    color: STATUS_COLOR.green,
    bg: STATUS_COLOR.greenBg,
  },
  rejected: {
    label: 'Ditolak',
    short: 'Ditolak',
    color: STATUS_COLOR.red,
    bg: STATUS_COLOR.redBg,
  },
  cancelled: {
    label: 'Dibatalkan',
    short: 'Dibatalkan',
    color: STATUS_COLOR.gray,
    bg: STATUS_COLOR.grayBg,
  },
};

export const getStatusMeta = (status: LeaveStatus | string): StatusMeta =>
  STATUS_META[normalizeStatus(status)];
