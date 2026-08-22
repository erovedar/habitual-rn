# Habitual — daily habit tracker

A cross-platform habit tracker: up to 5 habits per user, daily check-ins, streak tracking, and
local reminder notifications. Built as a portfolio project — see the implementation plan at
`/Users/erovedar/.claude/plans/i-am-creating-a-sharded-seahorse.md` for full architecture
rationale and the phased timeline.

## Stack

npm workspaces monorepo: `shared` (TypeScript, no framework), `server` (Express + `pg`, hand-written
SQL, no ORM), `mobile` (Expo + TypeScript). Postgres for storage, `node-pg-migrate` for schema
migrations. Auth is hand-rolled bcrypt + JWT — see "Auth" below for why, and how OAuth adds on
later without reworking it.

## Commands

```
npm install              # installs all workspaces
npm run db:up             # start local Postgres (docker compose)
npm run migrate:up        # apply pending migrations (needs DATABASE_URL in .env)
npm run typecheck         # tsc --noEmit across all workspaces
npm run test              # vitest across shared/server; jest (jest-expo) in mobile
npm run lint               # oxlint across all workspaces
```

## Setup

1. `cp .env.example .env`.
2. `npm run db:up` — starts Postgres in Docker on **port 5433**, not 5432. (This machine already
   runs a Homebrew Postgres@14 instance on 5432 via `brew services`; using 5433 avoids silently
   connecting to the wrong database. If you don't have that conflict, you can change the port back
   in `docker-compose.yml` and `.env`.)
3. `npm run migrate:up`.
4. `npm run --workspace server dev` and `npm run --workspace mobile start` (once the mobile
   workspace exists).

## Domain rules — read before touching data logic

- **Streaks are computed on read, never maintained incrementally.** The one implementation is
  `shared/src/streaks.ts`. Do not re-derive streak logic in a route handler, a repo file, or
  mobile code — import `computeStreaks` from `@habitual/shared` instead. An incrementally-updated
  counter drifts the moment a check-in is deleted or backfilled out of order; recomputing from the
  full history is cheap at this scale (max 5 habits/user) and can't drift.
- **`daily_logs.local_date` is a plain calendar date the client computed from device-local time at
  check-in** — never a `timestamptz` resolved server-side. This is what makes the streak math
  immune to DST and timezone shifts: there is no time-of-day component left for a timezone
  conversion to corrupt. All date arithmetic goes through `shared/src/date.ts`, which works in
  UTC-epoch-day integers specifically so it never reads the runtime's local timezone.
- **Password is just another row in `auth_identities`**, not a column on `users`. This is what
  makes OAuth (Google/Apple, planned for later) additive: a new provider adds rows to
  `auth_identities` and reuses the same `issueTokens()` used by password login — `users` and the
  token/session shape never change.
- **The 5-habit cap is enforced twice**: once in the `POST /habits` handler (for a friendly error
  response) and once via a Postgres trigger on `habits` (`enforce_habit_limit`, since a `CHECK`
  constraint can't do cross-row counting) as defense-in-depth.

## Testing

Vitest for `shared`/`server`, colocated (`foo.ts` / `foo.test.ts`). Keep tests basic and
necessary — cover the logic that's actually load-bearing, skip asserting the obvious. The one
deliberate exception is `shared/src/streaks.test.ts` and `date.test.ts`: DST boundaries, leap
years, and year boundaries are tested explicitly there because that's the one thing this project
needs to prove works, not routine edge-case padding.

## Layout

| Path | What it holds |
|---|---|
| `shared/src/streaks.ts`, `date.ts` | the one definition of streak/date math |
| `server/src/<resource>/*.repo.ts` | Postgres queries + snake_case ↔ camelCase mapping |
| `server/src/<resource>/*.routes.ts` | Express routers |
| `migrations/` | numbered, hand-written, idempotent SQL, applied via `node-pg-migrate` |
| `mobile/src/notifications/scheduler.ts` | local `expo-notifications` schedule/cancel bookkeeping |
