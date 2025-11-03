import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

function getDbUrl() {
  if (typeof process === 'undefined' || !process.env) return '';
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || '';
}

let _sql: any = null;
function getSql() {
  if (!_sql) {
    const CONN = getDbUrl();
    if (!CONN) throw new Error('No DB URL configured');
    _sql = neon(CONN);
  }
  return _sql;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = getSql();

    // 查询每个玩家的通关数（有记录的关卡数）
    const result = await sql`
      SELECT
        ua.username,
        COUNT(DISTINCT pp.level_id) as cleared_levels
      FROM user_accounts ua
      LEFT JOIN player_progress pp ON ua.player_id = pp.player_id
      WHERE pp.level_id IS NOT NULL
      GROUP BY ua.player_id, ua.username
      ORDER BY cleared_levels DESC, ua.username ASC
      LIMIT 100
    `;

    const ranking = result.map((row: any, index: number) => ({
      rank: index + 1,
      username: row.username,
      clearedLevels: parseInt(row.cleared_levels, 10)
    }));

    return res.status(200).json({ ranking });
  } catch (error: any) {
    console.error('Ranking error:', error);
    return res.status(500).json({ error: 'Failed to fetch ranking', details: error.message });
  }
}
