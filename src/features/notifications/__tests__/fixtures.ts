import type { InAppNotification } from '../types';

export const TEST_NOTIFS: InAppNotification[] = [
  {
    id: 'NT-01',
    type: 'cuti_approved',
    group: 'today',
    time: '08:12',
    read: false,
    title: 'Cuti Anda disetujui',
    body: 'Pengajuan cuti tahunan Anda telah disetujui.',
    pill: 'Disetujui',
  },
  {
    id: 'NT-02',
    type: 'absensi',
    group: 'today',
    time: '09:24',
    read: false,
    title: 'Berikan keterangan keterlambatan',
    body: 'Check-in tercatat terlambat dan memerlukan keterangan.',
    pill: 'Telat 23 mnt',
    action: 'Beri Keterangan',
  },
  {
    id: 'NT-03',
    type: 'approval',
    group: 'yesterday',
    time: '18:00',
    read: true,
    title: '3 pengajuan menunggu persetujuan',
    body: 'Terdapat beberapa pengajuan baru dari tim Anda.',
    pill: 'Untuk Manager',
    action: 'Tinjau',
  },
];
