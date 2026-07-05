import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureTables, getSql } from './_db.js';
import { getErrorMessage } from './_errors.js';

type RankingRow = {
  username: string;
  cleared_levels: string | number;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await ensureTables();
    const sql = getSql();

    const result = await sql`
      SELECT
        ua.username,
        COUNT(DISTINCT pp.level_id) as cleared_levels
      FROM user_accounts ua
      LEFT JOIN player_progress pp ON ua.player_id = pp.player_id AND pp.max_star > 0
      WHERE pp.level_id IS NOT NULL
      GROUP BY ua.player_id, ua.username
      ORDER BY cleared_levels DESC, ua.username ASC
      LIMIT 100
    `;

    const ranking = (result as RankingRow[]).map((row, index) => ({
      rank: index + 1,
      username: row.username,
      clearedLevels: Number(row.cleared_levels),
    }));

    return res.status(200).json({ ranking });
  } catch (error: unknown) {
    console.error('Ranking error:', error);
    return res.status(500).json({ error: 'Failed to fetch ranking', details: getErrorMessage(error) });
  }
}
