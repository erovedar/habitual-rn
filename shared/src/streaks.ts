// The one place streak math lives. Both server and mobile import this
// instead of re-deriving it — see CLAUDE.md. Computed on read from a plain
// list of completion dates rather than maintained incrementally, so a
// deleted or backfilled check-in can never leave a stale counter behind.

import { compareLocalDates, diffDays, type LocalDate } from './date';

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletedDate: LocalDate | null;
}

const EMPTY: StreakSummary = {
  currentStreak: 0,
  longestStreak: 0,
  totalCompletions: 0,
  lastCompletedDate: null,
};

/**
 * @param completedDates Local dates a habit was completed on, in any order.
 *   Duplicates are tolerated (deduplicated internally) even though the DB's
 *   UNIQUE(habit_id, local_date) constraint should already prevent them.
 * @param asOf The date to evaluate "current" against — always pass the
 *   caller's actual today, in the caller's own local time. Never resolved
 *   internally, so this function is pure and deterministic.
 */
export function computeStreaks(completedDates: LocalDate[], asOf: LocalDate): StreakSummary {
  if (completedDates.length === 0) return EMPTY;

  const dates = Array.from(new Set(completedDates)).sort(compareLocalDates);

  const runLengths: number[] = [];
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (diffDays(dates[i], dates[i - 1]) === 1) {
      run += 1;
    } else {
      runLengths.push(run);
      run = 1;
    }
  }
  runLengths.push(run);

  const longestStreak = Math.max(...runLengths);
  const lastCompletedDate = dates[dates.length - 1];
  const lastRunLength = runLengths[runLengths.length - 1];

  // A streak stays "alive" through the day it hasn't been logged yet:
  // completed today (gap 0) or completed yesterday and not yet checked in
  // today (gap 1) both still count as current. A gap of 2+ means a day was
  // skipped entirely, so the streak is broken.
  const gapFromAsOf = diffDays(asOf, lastCompletedDate);
  const currentStreak = gapFromAsOf <= 1 ? lastRunLength : 0;

  return {
    currentStreak,
    longestStreak,
    totalCompletions: dates.length,
    lastCompletedDate,
  };
}
