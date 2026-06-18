import {
  getCheckInActionState,
  getCheckOutActionState,
} from '../attendanceActionState';

describe('attendanceActionState', () => {
  it('enables both actions when attendance is ready and there is no history', () => {
    expect(
      getCheckInActionState({
        canCheck: true,
        hasCheckIn: false,
        hasCheckOut: false,
        isPending: false,
      })
    ).toEqual({
      disabled: false,
      label: '→ Masuk',
    });

    expect(
      getCheckOutActionState({
        canCheck: true,
        hasCheckIn: false,
        hasCheckOut: false,
        isPending: false,
      })
    ).toEqual({
      disabled: false,
      label: '→ Pulang',
    });
  });

  it('keeps actions enabled when history exists and preserves status labels', () => {
    expect(
      getCheckInActionState({
        canCheck: true,
        hasCheckIn: true,
        hasCheckOut: false,
        isPending: false,
      })
    ).toEqual({
      disabled: false,
      label: '✓ Sudah Masuk',
    });

    expect(
      getCheckOutActionState({
        canCheck: true,
        hasCheckIn: true,
        hasCheckOut: true,
        isPending: false,
      })
    ).toEqual({
      disabled: false,
      label: '✓ Sudah Pulang',
    });
  });

  it('disables both actions when attendance is not ready', () => {
    expect(
      getCheckInActionState({
        canCheck: false,
        hasCheckIn: false,
        hasCheckOut: false,
        isPending: false,
      }).disabled
    ).toBe(true);

    expect(
      getCheckOutActionState({
        canCheck: false,
        hasCheckIn: false,
        hasCheckOut: false,
        isPending: false,
      }).disabled
    ).toBe(true);
  });

  it('disables only the pending action while preserving its label priority', () => {
    expect(
      getCheckInActionState({
        canCheck: true,
        hasCheckIn: false,
        hasCheckOut: false,
        isPending: true,
      })
    ).toEqual({
      disabled: true,
      label: 'Memproses...',
    });

    expect(
      getCheckOutActionState({
        canCheck: true,
        hasCheckIn: false,
        hasCheckOut: true,
        isPending: true,
      })
    ).toEqual({
      disabled: true,
      label: '✓ Sudah Pulang',
    });
  });
});
