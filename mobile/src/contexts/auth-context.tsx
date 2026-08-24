import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AuthResponse, User } from '@habitual/shared';

import * as api from '@/lib/api-client';
import { ApiError } from '@/lib/api-client';
import { clearSession, loadSession, saveSession, type StoredSession } from '@/lib/token-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  upgradeGuest: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  authorizedFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<StoredSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Async helpers (authorizedFetch's 401 retry) need the latest session
  // without depending on a stale closure, hence the ref alongside state.
  const sessionRef = useRef<StoredSession | null>(null);

  function setSession(next: StoredSession | null) {
    sessionRef.current = next;
    setSessionState(next);
  }

  useEffect(() => {
    (async () => {
      const stored = await loadSession();
      if (stored) {
        setSession(stored);
        setIsLoading(false);
        return;
      }
      try {
        const fresh = await api.createAnonymousSession();
        await saveSession(fresh);
        setSession(fresh);
      } catch (err) {
        // Offline or server unreachable on first launch: fall through with no
        // session. login.tsx/signup.tsx remain reachable so the user isn't
        // stuck once connectivity returns.
        console.error('Failed to start a guest session', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function signIn(email: string, password: string) {
    const result = await api.login(email, password);
    await saveSession(result);
    setSession(result);
  }

  async function signUp(email: string, password: string, displayName: string) {
    const result = await api.signup(email, password, displayName);
    await saveSession(result);
    setSession(result);
  }

  async function upgradeGuest(email: string, password: string, displayName: string) {
    const current = sessionRef.current;
    if (!current) throw new Error('No active session to upgrade');
    const { user } = await api.upgrade(email, password, displayName, current.tokens.accessToken);
    const next: AuthResponse = { user, tokens: current.tokens };
    await saveSession(next);
    setSession(next);
  }

  async function signOut() {
    await clearSession();
    setSession(null);
    // The app never sits in a signed-out state on its own screens — dropping
    // straight into a new guest session mirrors first-launch behavior.
    const fresh = await api.createAnonymousSession();
    await saveSession(fresh);
    setSession(fresh);
  }

  async function authorizedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const current = sessionRef.current;
    if (!current) throw new Error('Not signed in');

    const doFetch = (accessToken: string) =>
      fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });

    let res = await doFetch(current.tokens.accessToken);

    if (res.status === 401) {
      try {
        const newTokens = await api.refresh(current.tokens.refreshToken);
        const next: AuthResponse = { user: current.user, tokens: newTokens };
        await saveSession(next);
        setSession(next);
        res = await doFetch(newTokens.accessToken);
      } catch {
        const fresh = await api.createAnonymousSession();
        await saveSession(fresh);
        setSession(fresh);
        throw new ApiError(401, 'session_reset');
      }
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, data?.error ?? 'unknown_error');
    return data as T;
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        isLoading,
        signIn,
        signUp,
        upgradeGuest,
        signOut,
        authorizedFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
