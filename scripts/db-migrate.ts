import fs from 'node:fs';
import path from 'node:path';
import { getDbUrl, runDatabaseMigrations } from '../api/_db';

function loadLocalEnv() {
  const envPaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.vercel', '.env.production.local'),
    path.join(process.cwd(), '.vercel', '.env.preview.local'),
  ];

  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;

    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, '');
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

async function main() {
  loadLocalEnv();

  if (!getDbUrl()) {
    throw new Error('No Postgres connection string found. Set POSTGRES_URL from Vercel Storage or DATABASE_URL.');
  }

  await runDatabaseMigrations();
  console.info('Database migrations are up to date.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
