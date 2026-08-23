import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Pool } from 'pg';
import type { AuthTokens } from '@habitual/shared';
import { insertRefreshToken } from './auth.repo.js';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, jwtSecret(), { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): string {
  const payload = jwt.verify(token, jwtSecret());
  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw new Error('malformed token payload');
  }
  return payload.sub;
}

function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Issues a fresh access/refresh pair and persists the refresh token's hash.
// Call this for signup, login, anonymous session creation, and refresh
// rotation alike — it's the one place a session comes into existence.
export async function issueTokens(pool: Pool, userId: string): Promise<AuthTokens> {
  const refreshToken = generateRefreshToken();
  await insertRefreshToken(pool, {
    userId,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return { accessToken: signAccessToken(userId), refreshToken };
}
