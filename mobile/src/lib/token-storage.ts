import * as SecureStore from 'expo-secure-store';
import type { AuthResponse } from '@habitual/shared';

// Persists the whole AuthResponse (user + tokens) as one JSON blob so a
// relaunch can restore the signed-in user without a GET /auth/me endpoint,
// which doesn't exist yet (see CHANGELOG.md).
const STORAGE_KEY = 'habitual.auth.session';

export type StoredSession = AuthResponse;

export async function loadSession(): Promise<StoredSession | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
