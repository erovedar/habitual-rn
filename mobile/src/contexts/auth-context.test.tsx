import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as api from '@/lib/api-client';
import { ApiError } from '@/lib/api-client';
import * as tokenStorage from '@/lib/token-storage';

import { AuthProvider, useAuth } from './auth-context';

jest.mock('@/lib/api-client', () => ({
  ...jest.requireActual('@/lib/api-client'),
  createAnonymousSession: jest.fn(),
  login: jest.fn(),
  signup: jest.fn(),
  upgrade: jest.fn(),
  refresh: jest.fn(),
}));
jest.mock('@/lib/token-storage');

const guestSession = {
  user: { id: 'guest-1', email: null, displayName: 'Guest', createdAt: '2026-01-01T00:00:00Z' },
  tokens: { accessToken: 'access-1', refreshToken: 'refresh-1' },
};

// renderHook is async (it awaits its internal act()) and must be awaited by
// callers — omitting `await` silently destructures a Promise instead of
// throwing, so this helper stays async rather than a thin sync wrapper.
async function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

beforeEach(() => {
  jest.clearAllMocks();
  (tokenStorage.loadSession as jest.Mock).mockResolvedValue(null);
  (tokenStorage.saveSession as jest.Mock).mockResolvedValue(undefined);
  (tokenStorage.clearSession as jest.Mock).mockResolvedValue(undefined);
});

describe('AuthProvider', () => {
  it('silently starts a guest session on first launch when nothing is stored', async () => {
    (api.createAnonymousSession as jest.Mock).mockResolvedValue(guestSession);
    const { result } = await renderAuth();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(api.createAnonymousSession).toHaveBeenCalledTimes(1);
    expect(result.current.user).toEqual(guestSession.user);
    expect(tokenStorage.saveSession).toHaveBeenCalledWith(guestSession);
  });

  it('restores a stored session on relaunch instead of creating a new guest', async () => {
    (tokenStorage.loadSession as jest.Mock).mockResolvedValue(guestSession);
    const { result } = await renderAuth();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(api.createAnonymousSession).not.toHaveBeenCalled();
    expect(result.current.user).toEqual(guestSession.user);
  });

  it('authorizedFetch refreshes once on a 401 and retries with the new token', async () => {
    (tokenStorage.loadSession as jest.Mock).mockResolvedValue(guestSession);
    const newTokens = { accessToken: 'access-2', refreshToken: 'refresh-2' };
    (api.refresh as jest.Mock).mockResolvedValue(newTokens);

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false, json: async () => ({ error: 'expired' }) })
      .mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({ ok: true }) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = await renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let data: unknown;
    await act(async () => {
      data = await result.current.authorizedFetch('/habits');
    });

    expect(data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondCallHeaders = fetchMock.mock.calls[1][1].headers as Record<string, string>;
    expect(secondCallHeaders.Authorization).toBe('Bearer access-2');
    expect(tokenStorage.saveSession).toHaveBeenCalledWith({ ...guestSession, tokens: newTokens });
  });

  it('drops back to a fresh guest session if the refresh itself fails', async () => {
    (tokenStorage.loadSession as jest.Mock).mockResolvedValue(guestSession);
    (api.refresh as jest.Mock).mockRejectedValue(new ApiError(401, 'invalid_refresh_token'));
    const freshGuest = { ...guestSession, user: { ...guestSession.user, id: 'guest-2' } };
    (api.createAnonymousSession as jest.Mock).mockResolvedValue(freshGuest);

    globalThis.fetch = jest
      .fn()
      .mockResolvedValue({ status: 401, ok: false, json: async () => ({ error: 'expired' }) }) as unknown as typeof fetch;

    const { result } = await renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.authorizedFetch('/habits')).rejects.toThrow(ApiError);
    });

    expect(result.current.user?.id).toBe('guest-2');
  });

  it('signOut clears the stored session and immediately starts a new guest session', async () => {
    (tokenStorage.loadSession as jest.Mock).mockResolvedValue(guestSession);
    const freshGuest = { ...guestSession, user: { ...guestSession.user, id: 'guest-3' } };
    (api.createAnonymousSession as jest.Mock).mockResolvedValue(freshGuest);

    const { result } = await renderAuth();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    expect(tokenStorage.clearSession).toHaveBeenCalledTimes(1);
    expect(result.current.user?.id).toBe('guest-3');
  });
});
