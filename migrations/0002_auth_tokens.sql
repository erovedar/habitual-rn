-- 0002_auth_tokens.sql
-- Lets a user exist before they have an email: guest/anonymous sessions are a
-- real `users` row (so habits/check-ins attach to a stable user_id from the
-- first launch) with a matching `auth_identities` row of provider
-- 'anonymous'. Converting a guest to a full account later just inserts a
-- 'password' identity for that same user_id and backfills email/display_name
-- — no data migration, per the auth_identities design in CLAUDE.md.

alter table users alter column email drop not null;
alter table users drop constraint users_email_key;
create unique index users_email_key on users(email) where email is not null;

-- Refresh tokens are stored hashed (sha256 of a high-entropy random value,
-- not bcrypt — there's no low-entropy secret here to slow-hash against).
-- Rotated on every use: refresh reads the row, revokes it, and inserts its
-- replacement in the same transaction, so a stolen-and-replayed refresh
-- token is detectable (the legitimate client's next refresh will fail
-- against an already-revoked token).
create table refresh_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index refresh_tokens_user_id_idx on refresh_tokens(user_id);
