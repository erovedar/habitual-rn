// Shared request-validation schemas: the server uses these to validate
// incoming bodies, and the mobile app can use the same schemas client-side
// so form validation never drifts from what the API actually accepts.
import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email();
export const passwordSchema = z.string().min(8).max(200);

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(1).max(100),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const reminderTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'expected 24-hour "HH:MM"');

export const createHabitSchema = z.object({
  name: z.string().trim().min(1).max(80),
  reminderTime: reminderTimeSchema,
  reminderEnabled: z.boolean().default(true),
});

export const updateHabitSchema = createHabitSchema.partial();

const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected "YYYY-MM-DD"');

export const checkinParamsSchema = z.object({
  habitId: z.string().uuid(),
  localDate: localDateSchema,
});
