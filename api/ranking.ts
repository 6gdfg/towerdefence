import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureTables, getSql } from './_db.js';
import { getErrorMessage } from './_errors.js';
import { settleEndlessRanking } from './_endlessRanking.js';
import { getEndlessRankingPeriod, RANKING_BOARDS, type RankingBoard } from '../shared/ranking.js';

type RankingRow = {
  username?: string;
  value?: string | number;
  week_start?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await ensureTables();
    res.setHeader('Cache-Control', 'no-store');
    if (req.query.settle === '1') {
      const secret = process.env.CRON_SECRET;
      if (secret && req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'unauthorized' });
      await settleEndlessRanking();
      return res.json({ ok: true });
    }
    const board = (req.query.board ?? 'clears') as RankingBoard;
    if (!RANKING_BOARDS.some(entry => entry.id === board)) return res.status(400).json({ error: 'invalid ranking board' });
    await settleEndlessRanking();
    const sql = getSql();
    let result: RankingRow[];
    if (board === 'clears') {
      result = await sql`SELECT ua.username, COUNT(DISTINCT pp.level_id) AS value
        FROM user_accounts ua JOIN player_progress pp ON ua.player_id=pp.player_id AND pp.max_star > 0
        GROUP BY ua.player_id, ua.username ORDER BY value DESC, ua.username ASC LIMIT 100`;
    } else if (board === 'coins') {
      result = await sql`SELECT ua.username, wallet.coins AS value
        FROM user_accounts ua JOIN player_wallet wallet ON wallet.player_id=ua.player_id
        ORDER BY wallet.coins DESC, ua.username ASC LIMIT 100`;
    } else {
      result = await sql`SELECT ua.username, records.best_waves AS value, state.week_start::text AS week_start
        FROM endless_ranking_state state LEFT JOIN
          (endless_weekly_records records JOIN user_accounts ua ON records.player_id=ua.player_id) ON TRUE
        WHERE state.singleton=TRUE
        ORDER BY records.best_waves DESC, records.achieved_at ASC, records.player_id ASC LIMIT 100`;
    }
    const ranking = result.filter(row => typeof row.username === 'string').map((row, index) => ({
      rank: index + 1, username: row.username!, value: Number(row.value),
      ...(board === 'clears' ? { clearedLevels: Number(row.value) } : {}),
    }));
    const period = board === 'endless' && result[0]?.week_start
      ? getEndlessRankingPeriod(new Date(`${result[0].week_start}T00:00:00+08:00`)) : undefined;
    return res.json({ board, ranking, ...(period ? { period } : {}) });
  } catch (error: unknown) {
    console.error('Ranking error:', error);
    return res.status(500).json({ error: 'Failed to fetch ranking', details: getErrorMessage(error) });
  }
}
