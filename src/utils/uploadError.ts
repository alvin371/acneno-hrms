import { getErrorMessage } from '@/api/error';

const getNormalizedMessage = (error: unknown) =>
  getErrorMessage(error).trim().toLowerCase();

export const getFriendlyUploadErrorMessage = (
  error: unknown,
  target: 'attendanceSelfie' | 'profilePhoto'
) => {
  const rawMessage = getNormalizedMessage(error);
  const itemLabel =
    target === 'attendanceSelfie' ? 'foto selfie' : 'foto profil';

  if (
    rawMessage.includes('network') ||
    rawMessage.includes('internet') ||
    rawMessage.includes('timeout') ||
    rawMessage.includes('socket')
  ) {
    return `Upload ${itemLabel} gagal karena koneksi internet bermasalah. Coba lagi saat koneksi stabil.`;
  }

  if (
    rawMessage.includes('too large') ||
    rawMessage.includes('file size') ||
    rawMessage.includes('payload too large') ||
    rawMessage.includes('413')
  ) {
    return `Ukuran ${itemLabel} terlalu besar. Pilih foto yang lebih kecil lalu coba lagi.`;
  }

  if (
    rawMessage.includes('unsupported') ||
    rawMessage.includes('invalid file') ||
    rawMessage.includes('invalid image') ||
    rawMessage.includes('mime') ||
    rawMessage.includes('format') ||
    rawMessage.includes('extension') ||
    rawMessage.includes('415')
  ) {
    return `Format ${itemLabel} tidak didukung. Gunakan foto JPG atau PNG yang valid.`;
  }

  if (rawMessage.includes('unauthorized') || rawMessage.includes('401')) {
    return 'Sesi Anda sudah berakhir. Silakan login kembali lalu coba lagi.';
  }

  return `Upload ${itemLabel} belum berhasil. Silakan coba lagi.`;
};

export const getFriendlyAttendanceErrorMessage = (error: unknown) => {
  const rawMessage = getNormalizedMessage(error);

  if (
    rawMessage.includes('network') ||
    rawMessage.includes('internet') ||
    rawMessage.includes('timeout') ||
    rawMessage.includes('socket')
  ) {
    return 'Absensi gagal dikirim karena koneksi internet bermasalah. Coba lagi saat koneksi stabil.';
  }

  if (
    rawMessage.includes('foto dinas luar belum diambil') ||
    rawMessage.includes('photo') ||
    rawMessage.includes('selfie')
  ) {
    return 'Ambil foto selfie terlebih dahulu sebelum mengirim absensi dinas luar.';
  }

  if (
    rawMessage.includes('lokasi dinas luar wajib diisi') ||
    rawMessage.includes('dinaslocation') ||
    rawMessage.includes('location')
  ) {
    return 'Lokasi dinas luar belum diisi. Lengkapi lokasi tugas Anda terlebih dahulu.';
  }

  if (
    rawMessage.includes('validation not available yet') ||
    rawMessage.includes('validation')
  ) {
    return 'Validasi absensi belum siap. Refresh halaman lalu coba lagi.';
  }

  return 'Absensi belum berhasil dikirim. Silakan periksa data Anda dan coba lagi.';
};
