import * as SecureStore from 'expo-secure-store';

import { clearSession, loadSession, saveSession } from './token-storage';

jest.mock('expo-secure-store');

const session = {
  user: { id: 'u1', email: null, displayName: 'Guest', createdAt: '2026-01-01T00:00:00Z' },
  tokens: { accessToken: 'access-1', refreshToken: 'refresh-1' },
};

describe('token-storage', () => {
  it('round-trips a saved session', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(session));

    await saveSession(session);
    const loaded = await loadSession();

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(expect.any(String), JSON.stringify(session));
    expect(loaded).toEqual(session);
  });

  it('treats corrupted stored data as no session instead of throwing', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('{not valid json');

    await expect(loadSession()).resolves.toBeNull();
  });

  it('returns null when nothing is stored', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    await expect(loadSession()).resolves.toBeNull();
  });

  it('clearSession removes the stored key', async () => {
    await clearSession();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(expect.any(String));
  });
});
