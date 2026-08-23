import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../auth/token.js';
import { HttpError } from '../lib/httpError.js';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) {
    next(new HttpError(401, 'unauthorized'));
    return;
  }
  try {
    req.userId = verifyAccessToken(token);
    next();
  } catch {
    next(new HttpError(401, 'unauthorized'));
  }
}
