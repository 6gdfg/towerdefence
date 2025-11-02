import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
    const hasDbUrl = !!(env.DATABASE_URL || env.POSTGRES_URL || env.NEON_DATABASE_URL);
    const hasAuthSecret = !!(env.AUTH_SECRET || env.JWT_SECRET);

    let dbConnected = false;
    let dbError = null;

    if (hasDbUrl) {
      try {
        const dbUrl = env.DATABASE_URL || env.POSTGRES_URL || env.NEON_DATABASE_URL || '';
        const sql = neon(dbUrl);
        await sql`SELECT 1 as test`;
        dbConnected = true;
      } catch (e: any) {
        dbError = e?.message || String(e);
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
  } catch (e: any) {
    return res.status(500).json({
      status: 'error',
      error: e?.message || String(e),
      stack: e?.stack
    });
  }
}

