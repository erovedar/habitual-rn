import type { LocalDate } from './date.js';

export interface User {
  id: string;
  email: string | null; // null for a guest/anonymous account that hasn't signed up yet
  displayName: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
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
