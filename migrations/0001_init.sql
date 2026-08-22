-- 0001_init.sql
-- Core identity tables. Password is just one row in auth_identities, not a
-- column on users, so adding an OAuth provider later never touches this
-- schema or the token-issuance flow (see CLAUDE.md).

create extension if not exists "pgcrypto";

create table users (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  display_name text not null,
  timezone     text not null default 'UTC',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table auth_identities (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references users(id) on delete cascade,
  provider          text not null,        -- 'password' | 'google' | 'apple' | ...
  provider_user_id  text not null,        -- lowercased email for 'password'; provider subject id otherwise
  secret            text,                 -- bcrypt hash for 'password'; null for OAuth providers
  created_at        timestamptz not null default now(),
  constraint auth_identities_unique_identity unique (provider, provider_user_id)
);

create index auth_identities_user_id_idx on auth_identities(user_id);
