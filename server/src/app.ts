import cors from 'cors';
import express, { type Express } from 'express';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  // auth/habits/checkins/summary routers mount here as they're built out
  // (Phase 1+) — see /Users/erovedar/.claude/plans/i-am-creating-a-sharded-seahorse.md

  app.use(errorHandler);
  return app;
}
