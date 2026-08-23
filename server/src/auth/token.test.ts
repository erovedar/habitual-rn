import { beforeAll, describe, expect, it } from 'vitest';
import { hashRefreshToken, signAccessToken, verifyAccessToken } from './token.js';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

describe('signAccessToken / verifyAccessToken', () => {
  it('round-trips the user id', () => {
    const token = signAccessToken('user-123');
    expect(verifyAccessToken(token)).toBe('user-123');
  });

  it('rejects a token signed with a different secret', () => {
    const token = signAccessToken('user-123');
    process.env.JWT_SECRET = 'a-different-secret';
    expect(() => verifyAccessToken(token)).toThrow();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('rejects a malformed token', () => {
    expect(() => verifyAccessToken('not-a-jwt')).toThrow();
  });
});

describe('hashRefreshToken', () => {
  it('is deterministic', () => {
    expect(hashRefreshToken('abc')).toBe(hashRefreshToken('abc'));
  });

  it('differs across inputs', () => {
    expect(hashRefreshToken('abc')).not.toBe(hashRefreshToken('abd'));
  });
});
