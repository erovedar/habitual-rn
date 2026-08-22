import type { LocalDate } from './date';

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export const HABIT_LIMIT = 5;

export interface Habit {
  id: string;
  userId: string;
  name: string;
  reminderTime: string; // "HH:MM", 24-hour, device-local
  reminderEnabled: boolean;
  archivedAt: string | null;
  createdAt: string;
}

export interface DailyLog {
  id: string;
  habitId: string;
  localDate: LocalDate;
  completedAt: string;
}

export type { LocalDate } from './date';
export type { StreakSummary } from './streaks';
