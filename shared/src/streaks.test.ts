import { describe, expect, it } from 'vitest';
import { computeStreaks } from './streaks';

describe('computeStreaks', () => {
  it('returns all zeros / null for no history', () => {
    expect(computeStreaks([], '2026-08-21')).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      lastCompletedDate: null,
    });
  });

  it('counts a single day as a streak of 1', () => {
    const r = computeStreaks(['2026-08-21'], '2026-08-21');
    expect(r.currentStreak).toBe(1);
    expect(r.longestStreak).toBe(1);
    expect(r.totalCompletions).toBe(1);
    expect(r.lastCompletedDate).toBe('2026-08-21');
  });

  it('counts a run of consecutive days', () => {
    const r = computeStreaks(
      ['2026-08-19', '2026-08-20', '2026-08-21'],
      '2026-08-21',
    );
    expect(r.currentStreak).toBe(3);
    expect(r.longestStreak).toBe(3);
  });

  it('is order-independent and dedupes duplicate dates', () => {
    const r = computeStreaks(
      ['2026-08-21', '2026-08-19', '2026-08-20', '2026-08-20'],
      '2026-08-21',
    );
    expect(r.currentStreak).toBe(3);
    expect(r.totalCompletions).toBe(3);
  });

  it('breaks the streak on a gap', () => {
    const r = computeStreaks(
      ['2026-08-15', '2026-08-16', '2026-08-19', '2026-08-20', '2026-08-21'],
      '2026-08-21',
    );
    expect(r.currentStreak).toBe(3); // 19-20-21
    expect(r.longestStreak).toBe(3); // ties: both runs are length 2 and 3 -> 3 wins
  });

  it('longest streak can exceed the current streak', () => {
    const r = computeStreaks(
      ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-10'],
      '2026-08-10',
    );
    expect(r.currentStreak).toBe(1);
    expect(r.longestStreak).toBe(4);
  });

  it('stays alive through today if the last check-in was yesterday (grace window)', () => {
    const r = computeStreaks(
      ['2026-08-19', '2026-08-20'],
      '2026-08-21', // today, not yet checked in
    );
    expect(r.currentStreak).toBe(2);
  });

  it('breaks once a full day has been skipped', () => {
    const r = computeStreaks(
      ['2026-08-18', '2026-08-19'],
      '2026-08-21', // two days since last check-in
    );
    expect(r.currentStreak).toBe(0);
    expect(r.longestStreak).toBe(2); // history is preserved even though current is broken
  });

  it('handles a streak spanning a DST fall-back boundary', () => {
    const r = computeStreaks(
      ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'],
      '2026-11-02',
    );
    expect(r.currentStreak).toBe(4);
  });

  it('handles a streak spanning a DST spring-forward boundary', () => {
    const r = computeStreaks(
      ['2026-03-07', '2026-03-08', '2026-03-09'],
      '2026-03-09',
    );
    expect(r.currentStreak).toBe(3);
  });

  it('handles a streak spanning a leap-year Feb 29', () => {
    const r = computeStreaks(
      ['2024-02-28', '2024-02-29', '2024-03-01'],
      '2024-03-01',
    );
    expect(r.currentStreak).toBe(3);
    expect(r.longestStreak).toBe(3);
  });

  it('handles a streak spanning a year boundary', () => {
    const r = computeStreaks(
      ['2026-12-30', '2026-12-31', '2027-01-01'],
      '2027-01-01',
    );
    expect(r.currentStreak).toBe(3);
  });
});
