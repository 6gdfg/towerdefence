import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { getErrorMessage } from './_errors';
import { getDbUrl } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
    const hasDbUrl = !!getDbUrl();
    const hasAuthSecret = !!(env.AUTH_SECRET || env.AUTHSECRET || env.authsecret || env.JWT_SECRET);

    let dbConnected = false;
    let dbError = null;

    if (hasDbUrl) {
      try {
        const sql = neon(getDbUrl());
        await sql`SELECT 1 as test`;
        dbConnected = true;
      } catch (e: unknown) {
        dbError = getErrorMessage(e);
      }
    }

    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      config: {
        hasDbUrl,
        hasAuthSecret,
        dbConnected,
        dbError
      },
      env: {
        nodeVersion: process.version,
        platform: process.platform
      }
    });
  } catch (e: unknown) {
    return res.status(500).json({
      status: 'error',
      error: getErrorMessage(e),
      stack: e instanceof Error ? e.stack : undefined
    });
  }
}

