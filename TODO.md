# To-do

## Hosting / infra

- [ ] Set up Neon (free Postgres) for production, replacing Render's free Postgres so the
      database doesn't expire after 90 days.
  - Create a Neon project + database.
  - Point production `DATABASE_URL` at Neon's connection string (no code changes needed — same
    Postgres wire protocol `pg`/`node-pg-migrate` already speak).
  - Run `npm run migrate:up` against Neon to apply the existing migrations.
  - Deploy `server/` to Render's free web service tier, wired to the Neon `DATABASE_URL`.
