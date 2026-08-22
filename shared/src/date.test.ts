import { describe, expect, it } from 'vitest';
import { addDays, compareLocalDates, diffDays, isValidLocalDate } from './date';

describe('isValidLocalDate', () => {
  it('accepts real calendar dates', () => {
    expect(isValidLocalDate('2026-08-21')).toBe(true);
    expect(isValidLocalDate('2024-02-29')).toBe(true); // leap year
  });

  it('rejects malformed or non-existent dates', () => {
    expect(isValidLocalDate('2026-8-21')).toBe(false);
    expect(isValidLocalDate('2026-13-01')).toBe(false);
    expect(isValidLocalDate('2023-02-29')).toBe(false); // not a leap year
    expect(isValidLocalDate('not-a-date')).toBe(false);
  });
});

describe('addDays / diffDays', () => {
  it('is a plain +1/-1 day roundtrip', () => {
    expect(addDays('2026-08-21', 1)).toBe('2026-08-22');
    expect(addDays('2026-08-21', -1)).toBe('2026-08-20');
    expect(diffDays('2026-08-22', '2026-08-21')).toBe(1);
  });

  it('crosses month boundaries', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
  });

  it('crosses a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(diffDays('2027-01-01', '2026-12-31')).toBe(1);
  });

  it('handles a leap-year Feb 29 correctly', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    // non-leap year: Feb has only 28 days
    expect(addDays('2023-02-28', 1)).toBe('2023-03-01');
  });

  it('is unaffected by DST transitions, because it never reads local time', () => {
    // US spring-forward 2026-03-08, fall-back 2026-11-01 — a wall-clock
    // implementation could misfire here; UTC-epoch-day arithmetic cannot.
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(diffDays('2026-11-02', '2026-10-31')).toBe(2);
  });
});

describe('compareLocalDates', () => {
  it('orders ascending', () => {
    const dates = ['2026-08-22', '2026-08-20', '2026-08-21'];
    expect([...dates].sort(compareLocalDates)).toEqual([
      '2026-08-20',
      '2026-08-21',
      '2026-08-22',
    ]);
  });
});
