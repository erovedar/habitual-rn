# Habitual

A cross-platform daily habit tracker: up to 5 habits per user, daily check-ins, streak tracking,
and local reminder notifications. Built as a portfolio project — the emphasis is on solid,
explainable architecture over feature breadth.

## Why Postgres, not MongoDB

Habit/streak data is inherently relational and date-series shaped: users → habits → daily
completions, with a `UNIQUE(habit_id, local_date)` constraint and gap-based streak queries.
Postgres fits this natively (constraints, triggers, correct-by-construction uniqueness); Mongo
would mean reinventing those guarantees in application code for no benefit.

## Highlights

- **Streaks are computed on read, never maintained incrementally** — a single pure function
  (`shared/src/streaks.ts`) derives current/longest streak from the full check-in history, so a
  deleted or backfilled check-in can never leave a stale counter behind.
- **Timezone-safe by construction** — `daily_logs.local_date` is a plain calendar date the client
  computed from device-local time, never a server-resolved timestamp. All date arithmetic
  (`shared/src/date.ts`) works in UTC-epoch-day integers, so streaks are provably immune to DST
  transitions, leap years, and year boundaries — covered by an explicit test suite for exactly
  those cases.
- **Auth is OAuth-ready without a rewrite** — password is just one row in `auth_identities`
  (`provider = 'password'`), not a column on `users`. Adding Google/Apple login later means adding
  rows to the same table and reusing the same token-issuance function; nothing about `users`,
  sessions, or how the client stores tokens has to change.
- **The 5-habit cap is enforced twice** — once in the API for a friendly error, and again via a
  Postgres trigger as defense-in-depth (a plain `CHECK` constraint can't do cross-row counting).
- **One codebase, one source of truth** — `shared/` is imported by both `server` and `mobile`, so
  streak/date logic is implemented exactly once and can't drift between client and server.

## Features

**v1 (in progress):**
- Email/password signup and login
- Create, edit, and soft-delete up to 5 habits, each with a daily reminder time
- Daily check-ins with idempotent toggle
- Current streak, longest streak, and a calendar/history view per habit
- Local, on-device reminder notifications (no server push infrastructure required)

**Planned (Phase 6+, not in v1):**
- OAuth login (Google, Apple) — additive on top of the existing `auth_identities` design
- Remote/server-driven push notifications (e.g. "your streak ends in 2 hours")
- Multi-device sync

## Stack

| Layer | Choice |
|---|---|
| Mobile | Expo (React Native) + TypeScript, Expo Router, TanStack Query |
| Server | Express + TypeScript, `pg` (hand-written SQL, no ORM) |
| Database | Postgres, schema managed via `node-pg-migrate` |
| Shared | One `shared/` workspace package for types, validation (zod), and streak/date logic |
| Notifications | `expo-notifications`, local calendar-triggered scheduling |
| Auth | bcrypt + JWT, stored in `expo-secure-store` on-device |

See `CLAUDE.md` for conventions and domain rules, and the implementation plan for the full
architecture rationale and phased timeline.

## Setup

1. `npm install`
2. `cp .env.example .env`
3. `npm run db:up` — starts Postgres in Docker. **Uses port 5433**, not 5432, because this
   environment already runs a native Postgres@14 on 5432; adjust `docker-compose.yml`/`.env` if
   that's not true for you.
4. `npm run migrate:up`
5. `npm run --workspace server dev` — starts the API on `:3000`
6. `npm run --workspace mobile start` — starts the Expo dev server

## Commands

```
npm run typecheck   # tsc --noEmit across all workspaces
npm run lint         # oxlint
npm run test          # vitest (shared/server); jest/jest-expo (mobile, once added)
npm run db:up / db:down
npm run migrate:up
```
