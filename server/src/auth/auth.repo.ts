import type { Pool } from 'pg';
import type { User } from '@habitual/shared';

interface UserRow {
  id: string;
  email: string | null;
  display_name: string;
  created_at: Date;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at.toISOString(),
  };
}

export async function createUser(
  pool: Pool,
  params: { email: string | null; displayName: string },
): Promise<User> {
  const { rows } = await pool.query<UserRow>(
    `insert into users (email, display_name) values ($1, $2)
     returning id, email, display_name, created_at`,
    [params.email, params.displayName],
  );
  return mapUser(rows[0]);
}

export async function findUserById(pool: Pool, userId: string): Promise<User | null> {
  const { rows } = await pool.query<UserRow>(
    `select id, email, display_name, created_at from users where id = $1`,
    [userId],
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

// Backfills email/displayName when a guest account upgrades to a full one.
export async function setUserProfile(
  pool: Pool,
  userId: string,
  params: { email: string; displayName: string },
): Promise<User> {
  const { rows } = await pool.query<UserRow>(
    `update users set email = $2, display_name = $3, updated_at = now()
     where id = $1
     returning id, email, display_name, created_at`,
    [userId, params.email, params.displayName],
  );
  return mapUser(rows[0]);
}

interface AuthIdentityRow {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  secret: string | null;
}

export async function findAuthIdentity(
  pool: Pool,
  provider: string,
  providerUserId: string,
): Promise<AuthIdentityRow | null> {
  const { rows } = await pool.query<AuthIdentityRow>(
    `select id, user_id, provider, provider_user_id, secret
     from auth_identities where provider = $1 and provider_user_id = $2`,
    [provider, providerUserId],
  );
  return rows[0] ?? null;
}

export async function userHasProvider(
  pool: Pool,
  userId: string,
  provider: string,
): Promise<boolean> {
  const { rows } = await pool.query(
    `select 1 from auth_identities where user_id = $1 and provider = $2`,
    [userId, provider],
  );
  return rows.length > 0;
}

export async function createAuthIdentity(
  pool: Pool,
  params: { userId: string; provider: string; providerUserId: string; secret: string | null },
): Promise<void> {
  await pool.query(
    `insert into auth_identities (user_id, provider, provider_user_id, secret)
     values ($1, $2, $3, $4)`,
    [params.userId, params.provider, params.providerUserId, params.secret],
  );
}

export async function insertRefreshToken(
  pool: Pool,
  params: { userId: string; tokenHash: string; expiresAt: Date },
): Promise<void> {
  await pool.query(
    `insert into refresh_tokens (user_id, token_hash, expires_at)
     values ($1, $2, $3)`,
    [params.userId, params.tokenHash, params.expiresAt],
  );
}

export async function findValidRefreshToken(
  pool: Pool,
  tokenHash: string,
): Promise<{ id: string; userId: string } | null> {
  const { rows } = await pool.query<{ id: string; user_id: string }>(
    `select id, user_id from refresh_tokens
     where token_hash = $1 and revoked_at is null and expires_at > now()`,
    [tokenHash],
  );
  return rows[0] ? { id: rows[0].id, userId: rows[0].user_id } : null;
}

export async function revokeRefreshToken(pool: Pool, id: string): Promise<void> {
  await pool.query(`update refresh_tokens set revoked_at = now() where id = $1`, [id]);
}
