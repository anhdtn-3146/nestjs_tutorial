import { today } from './date.util';

describe('today', () => {
  it('uses the Asia/Bangkok date during the UTC date boundary', () => {
    const now = new Date('2026-08-19T18:00:00.000Z');

    expect(today(now)).toBe('2026-08-20');
  });

  it('keeps the previous business date before midnight in Asia/Bangkok', () => {
    const now = new Date('2026-08-19T16:59:59.999Z');

    expect(today(now)).toBe('2026-08-19');
  });
});
