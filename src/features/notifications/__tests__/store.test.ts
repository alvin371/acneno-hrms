import { normalizeNotifPrefs } from '../store';

describe('normalizeNotifPrefs', () => {
  it('fills missing values with enabled weekday on-time defaults', () => {
    expect(normalizeNotifPrefs({})).toEqual({
      clockInEnabled: true,
      clockInOffset: 'on_time',
      clockOutEnabled: true,
      clockOutOffset: 'on_time',
      activeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    });
  });

  it('keeps valid expanded offsets and custom days', () => {
    expect(
      normalizeNotifPrefs({
        clockInEnabled: false,
        clockInOffset: '45_before',
        clockOutEnabled: true,
        clockOutOffset: '60_before',
        activeDays: ['sun', 'wed', 'sun', 'mon'],
      }),
    ).toEqual({
      clockInEnabled: false,
      clockInOffset: '45_before',
      clockOutEnabled: true,
      clockOutOffset: '60_before',
      activeDays: ['mon', 'wed', 'sun'],
    });
  });

  it('normalizes invalid stored offsets and day sets back to defaults', () => {
    expect(
      normalizeNotifPrefs({
        clockInEnabled: true,
        clockInOffset: 'invalid',
        clockOutEnabled: false,
        clockOutOffset: null,
        activeDays: ['invalid'],
      }),
    ).toEqual({
      clockInEnabled: true,
      clockInOffset: 'on_time',
      clockOutEnabled: false,
      clockOutOffset: 'on_time',
      activeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    });
  });
});
