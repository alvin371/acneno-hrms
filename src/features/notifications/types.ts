export type NotifType =
  | 'cuti_approved'
  | 'cuti_rejected'
  | 'absensi'
  | 'news_urgent'
  | 'news_info'
  | 'approval'
  | 'holiday';

export type NotifGroup = 'today' | 'yesterday' | 'week';

export interface InAppNotification {
  id: string;
  type: NotifType;
  group: NotifGroup;
  time: string;
  read: boolean;
  title: string;
  body: string;
  pill?: string;
  action?: string;
}

// Aligned with DESIGN.md semantic tokens
export const SUCCESS = '#047857';
export const WARNING = '#B45309';
export const DANGER  = '#BE123C';
export const INFO    = '#1D4ED8';
export const MAROON  = '#6B1A2B';

// Keep old aliases so callers that import them don't break
export const GREEN = SUCCESS;
export const AMBER = WARNING;
export const RED   = DANGER;
export const BLUE  = INFO;

interface NTypeEntry {
  iconName: string;
  color: string;
  bg: string;
  deep: string;
  label: string;
}

export const NTYPE: Record<NotifType, NTypeEntry> = {
  cuti_approved: { iconName: 'checkmark-circle-outline', color: SUCCESS,  bg: 'rgba(4,120,87,0.12)',    deep: 'Cuti',     label: 'Cuti' },
  cuti_rejected: { iconName: 'close-circle-outline',     color: DANGER,   bg: 'rgba(190,18,60,0.10)',   deep: 'Cuti',     label: 'Cuti' },
  absensi:       { iconName: 'time-outline',             color: WARNING,  bg: 'rgba(180,83,9,0.12)',    deep: 'Absensi',  label: 'Absensi' },
  news_urgent:   { iconName: 'megaphone-outline',        color: DANGER,   bg: 'rgba(190,18,60,0.10)',   deep: 'News',     label: 'News' },
  news_info:     { iconName: 'information-circle-outline', color: INFO,   bg: 'rgba(29,78,216,0.10)',   deep: 'News',     label: 'News' },
  approval:      { iconName: 'mail-open-outline',        color: MAROON,   bg: 'rgba(107,26,43,0.10)',   deep: 'Approval', label: 'Approval' },
  holiday:       { iconName: 'leaf-outline',             color: SUCCESS,  bg: 'rgba(4,120,87,0.12)',    deep: 'News',     label: 'Libur' },
};

export const FILTERS = [
  { id: 'all',      label: 'Semua' },
  { id: 'Cuti',     label: 'Cuti' },
  { id: 'Absensi',  label: 'Absensi' },
  { id: 'News',     label: 'News' },
  { id: 'Approval', label: 'Approval' },
] as const;

export const GROUPS: { id: NotifGroup; label: string }[] = [
  { id: 'today',     label: 'Hari ini' },
  { id: 'yesterday', label: 'Kemarin' },
  { id: 'week',      label: 'Lebih awal minggu ini' },
];
