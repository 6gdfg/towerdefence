import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getErrorMessage } from './_errors.js';

function getDbUrlFromEnv() {
  const env = process.env;
  const direct = envValue('POSTGRES_URL')
    || envValue('DATABASE_URL')
    || envValue('DATABASE_URL_UNPOOLED')
    || envValue('POSTGRES_PRISMA_URL')
    || envValue('POSTGRES_URL_NON_POOLING')
    || envValue('POSTGRES_URL_NO_SSL')
    || envValue('NEON_DATABASE_URL');
  if (direct) return direct;

  const host = envValue('PGHOST') || envValue('POSTGRES_HOST') || envValue('PGHOST_UNPOOLED');
  const user = envValue('PGUSER') || envValue('POSTGRES_USER');
  const password = envValue('PGPASSWORD') || envValue('POSTGRES_PASSWORD');
  const database = envValue('PGDATABASE') || envValue('POSTGRES_DATABASE');
  const port = envValue('PGPORT') || '5432';

  if (!host || !user || !password || !database) return '';

  const hasPort = /:\d+$/.test(host);
  const portPart = hasPort ? '' : `:${port}`;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}${portPart}/${encodeURIComponent(database)}?sslmode=require`;
}

function envValue(key: string) {
  const value = process.env[key];
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^['"]|['"]$/g, '');
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const dbUrl = getDbUrlFromEnv();
  if (!dbUrl) {
    return res.status(200).json({
      status: 'ok',
      config: {
        hasDbUrl: false,
        dbConnected: false,
        dbError: 'No Postgres connection string found',
      },
    });
  }

  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(dbUrl);
    await sql`SELECT 1 as test`;
    return res.status(200).json({
      status: 'ok',
      config: {
        hasDbUrl: true,
        dbConnected: true,
        dbError: null,
      },
    });
  } catch (error: unknown) {
    return res.status(200).json({
      status: 'ok',
      config: {
        hasDbUrl: true,
        dbConnected: false,
        dbError: getErrorMessage(error),
      },
    });
  }
}
