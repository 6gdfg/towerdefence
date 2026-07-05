import type { VercelRequest, VercelResponse } from '@vercel/node';

function envValue(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key];
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function hasDbUrl(env: NodeJS.ProcessEnv) {
  const direct = envValue(env, 'POSTGRES_URL')
    || envValue(env, 'DATABASE_URL')
    || envValue(env, 'DATABASE_URL_UNPOOLED')
    || envValue(env, 'POSTGRES_PRISMA_URL')
    || envValue(env, 'POSTGRES_URL_NON_POOLING')
    || envValue(env, 'POSTGRES_URL_NO_SSL')
    || envValue(env, 'NEON_DATABASE_URL');

  const hasParts = Boolean(
    (envValue(env, 'PGHOST') || envValue(env, 'POSTGRES_HOST') || envValue(env, 'PGHOST_UNPOOLED'))
      && (envValue(env, 'PGUSER') || envValue(env, 'POSTGRES_USER'))
      && (envValue(env, 'PGPASSWORD') || envValue(env, 'POSTGRES_PASSWORD'))
      && (envValue(env, 'PGDATABASE') || envValue(env, 'POSTGRES_DATABASE')),
  );

  return Boolean(direct || hasParts);
}

function hasAuthSecret(env: NodeJS.ProcessEnv) {
  return Boolean(
    envValue(env, 'AUTH_SECRET')
      || envValue(env, 'AUTHSECRET')
      || envValue(env, 'authsecret')
      || envValue(env, 'JWT_SECRET'),
  );
}

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const env = process.env;

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    config: {
      hasDbUrl: hasDbUrl(env),
      hasAuthSecret: hasAuthSecret(env),
    },
    env: {
      nodeVersion: process.version,
      platform: process.platform,
    },
  });
}
