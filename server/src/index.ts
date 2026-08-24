import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// Loaded by explicit path (not cwd-relative) since this file's cwd varies:
// repo root under `npm run --workspace server dev`, `server/` when built and
// run directly. On Render, no .env file exists and this silently no-ops —
// real env vars come from the dashboard.
config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

// Dynamic import: ESM hoists static imports above this file's own top-level
// code, which would evaluate app.js (and pool.ts's process.env.DATABASE_URL
// read) before the config() call above ever ran.
const { createApp } = await import('./app.js');

const port = Number(process.env.PORT ?? 3000);
createApp().listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`habitual server listening on :${port}`);
});
