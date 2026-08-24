import type { AuthResponse, AuthTokens } from '@habitual/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

async function postJson<T>(path: string, body?: unknown, accessToken?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? 'unknown_error');
  }
  return data as T;
}

export function signup(email: string, password: string, displayName: string) {
  return postJson<AuthResponse>('/auth/signup', { email, password, displayName });
}

export function login(email: string, password: string) {
  return postJson<AuthResponse>('/auth/login', { email, password });
}

export function createAnonymousSession() {
  return postJson<AuthResponse>('/auth/anonymous');
}

export function refresh(refreshToken: string) {
  return postJson<AuthTokens>('/auth/refresh', { refreshToken });
}

export function upgrade(
  email: string,
  password: string,
  displayName: string,
  accessToken: string,
) {
  return postJson<{ user: AuthResponse['user'] }>(
    '/auth/upgrade',
    { email, password, displayName },
    accessToken,
  );
}
