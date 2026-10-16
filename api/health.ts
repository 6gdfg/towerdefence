import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getErrorMessage } from './_errors.js';

function envValue(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key];
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function getDbUrlFromEnv(env: NodeJS.ProcessEnv) {
  const direct = envValue(env, 'POSTGRES_URL')
    || envValue(env, 'DATABASE_URL')
    || envValue(env, 'DATABASE_URL_UNPOOLED')
    || envValue(env, 'POSTGRES_PRISMA_URL')
    || envValue(env, 'POSTGRES_URL_NON_POOLING')
    || envValue(env, 'POSTGRES_URL_NO_SSL')
    || envValue(env, 'NEON_DATABASE_URL');

  if (direct) return direct;

  const host = envValue(env, 'PGHOST') || envValue(env, 'POSTGRES_HOST') || envValue(env, 'PGHOST_UNPOOLED');
  const user = envValue(env, 'PGUSER') || envValue(env, 'POSTGRES_USER');
  const password = envValue(env, 'PGPASSWORD') || envValue(env, 'POSTGRES_PASSWORD');
  const database = envValue(env, 'PGDATABASE') || envValue(env, 'POSTGRES_DATABASE');
  const port = envValue(env, 'PGPORT') || '5432';

  if (!host || !user || !password || !database) return '';

  const hasPort = /:\d+$/.test(host);
  const portPart = hasPort ? '' : `:${port}`;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}${portPart}/${encodeURIComponent(database)}?sslmode=require`;
}

function hasDbUrl(env: NodeJS.ProcessEnv) {
  return Boolean(getDbUrlFromEnv(env));
}

function hasAuthSecret(env: NodeJS.ProcessEnv) {
  return Boolean(
    envValue(env, 'AUTH_SECRET')
      || envValue(env, 'AUTHSECRET')
      || envValue(env, 'authsecret')
      || envValue(env, 'JWT_SECRET'),
  );
}

function shouldCheckDatabase(req: VercelRequest) {
  const value = req.query.db;
  return value === '1' || value === 'true';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const env = process.env;
  const config: {
    hasDbUrl: boolean;
    hasAuthSecret: boolean;
    dbConnected?: boolean;
    dbError?: string | null;
  } = {
    hasDbUrl: hasDbUrl(env),
    hasAuthSecret: hasAuthSecret(env),
  };

  if (shouldCheckDatabase(req)) {
    const dbUrl = getDbUrlFromEnv(env);
    if (!dbUrl) {
      config.dbConnected = false;
      config.dbError = 'No Postgres connection string found';
    } else {
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(dbUrl);
        await sql`SELECT 1 as test`;
        config.dbConnected = true;
        config.dbError = null;
      } catch (error: unknown) {
        config.dbConnected = false;
        config.dbError = getErrorMessage(error);
      }
    }
  }

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    config,
    env: {
      nodeVersion: process.version,
      platform: process.platform,
    },
  });
}
