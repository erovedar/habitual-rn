import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { Router } from 'express';
import type { Pool } from 'pg';
import { loginSchema, refreshSchema, signupSchema, upgradeSchema } from '@habitual/shared';
import type { AuthResponse } from '@habitual/shared';
import { requireAuth } from '../middleware/requireAuth.js';
import { HttpError } from '../lib/httpError.js';
import {
  createAuthIdentity,
  createUser,
  findAuthIdentity,
  findUserById,
  findValidRefreshToken,
  revokeRefreshToken,
  setUserProfile,
  userHasProvider,
} from './auth.repo.js';
import { hashRefreshToken, issueTokens } from './token.js';

const BCRYPT_ROUNDS = 12;

export function authRouter(pool: Pool): Router {
  const router = Router();

  router.post('/signup', async (req, res, next) => {
    try {
      const body = signupSchema.parse(req.body);
      const existing = await findAuthIdentity(pool, 'password', body.email);
      if (existing) throw new HttpError(409, 'email_taken');

      const user = await createUser(pool, { email: body.email, displayName: body.displayName });
      const secret = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
      await createAuthIdentity(pool, {
        userId: user.id,
        provider: 'password',
        providerUserId: body.email,
        secret,
      });
      const tokens = await issueTokens(pool, user.id);
      const response: AuthResponse = { user, tokens };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      const body = loginSchema.parse(req.body);
      const identity = await findAuthIdentity(pool, 'password', body.email);
      if (!identity || !identity.secret) throw new HttpError(401, 'invalid_credentials');

      const valid = await bcrypt.compare(body.password, identity.secret);
      if (!valid) throw new HttpError(401, 'invalid_credentials');

      const user = await findUserById(pool, identity.user_id);
      if (!user) throw new HttpError(401, 'invalid_credentials');

      const tokens = await issueTokens(pool, user.id);
      const response: AuthResponse = { user, tokens };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  });

  // No body: every call creates a brand-new guest account. The client is
  // responsible for calling this at most once (on first launch) and
  // persisting the resulting tokens — that's what makes the guest "session"
  // durable across app restarts without a credential to log back in with.
  router.post('/anonymous', async (_req, res, next) => {
    try {
      const user = await createUser(pool, { email: null, displayName: 'Guest' });
      await createAuthIdentity(pool, {
        userId: user.id,
        provider: 'anonymous',
        providerUserId: crypto.randomUUID(),
        secret: null,
      });
      const tokens = await issueTokens(pool, user.id);
      const response: AuthResponse = { user, tokens };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  });

  router.post('/refresh', async (req, res, next) => {
    try {
      const body = refreshSchema.parse(req.body);
      const tokenHash = hashRefreshToken(body.refreshToken);
      const found = await findValidRefreshToken(pool, tokenHash);
      if (!found) throw new HttpError(401, 'invalid_refresh_token');

      await revokeRefreshToken(pool, found.id);
      const tokens = await issueTokens(pool, found.userId);
      res.status(200).json(tokens);
    } catch (err) {
      next(err);
    }
  });

  // Attaches a password identity to the caller's existing user_id, so a
  // guest's habits/check-ins carry over untouched — see 0002_auth_tokens.sql.
  router.post('/upgrade', requireAuth, async (req, res, next) => {
    try {
      const body = upgradeSchema.parse(req.body);
      const userId = req.userId!;

      if (await userHasProvider(pool, userId, 'password')) {
        throw new HttpError(409, 'already_has_password');
      }
      const existing = await findAuthIdentity(pool, 'password', body.email);
      if (existing) throw new HttpError(409, 'email_taken');

      const secret = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
      await createAuthIdentity(pool, {
        userId,
        provider: 'password',
        providerUserId: body.email,
        secret,
      });
      const user = await setUserProfile(pool, userId, {
        email: body.email,
        displayName: body.displayName,
      });
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
