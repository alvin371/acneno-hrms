type AttendanceActionStateInput = {
  canCheck: boolean;
  hasCheckIn: boolean;
  hasCheckOut: boolean;
  isPending: boolean;
};

export const getCheckInActionState = ({
  canCheck,
  hasCheckIn,
  isPending,
}: AttendanceActionStateInput) => ({
  disabled: !canCheck || isPending,
  label: hasCheckIn ? '✓ Sudah Masuk' : isPending ? 'Memproses...' : '→ Masuk',
});

export const getCheckOutActionState = ({
  canCheck,
  hasCheckOut,
  isPending,
}: AttendanceActionStateInput) => ({
  disabled: !canCheck || isPending,
  label: hasCheckOut ? '✓ Sudah Pulang' : isPending ? 'Memproses...' : '→ Pulang',
});
