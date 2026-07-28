import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { getErrorMessage } from './_errors.js';

function getRequiredPlayerId(req: VercelRequest, res: VercelResponse) {
  const playerId = getAuthPlayerId(req);
  if (!playerId) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  return playerId;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureTables();
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    if (req.body?.confirm !== true) return res.status(400).json({ error: 'confirmation required' });

    const playerId = getRequiredPlayerId(req, res);
    if (!playerId) return;
    const sql = getSql();
    const existing = await sql`SELECT player_id FROM players WHERE player_id=${playerId}`;
    if (existing.length === 0) return res.status(404).json({ error: 'account not found' });

    // Delete child rows first so this remains correct without relying on
    // database-level cascade rules as new player data tables are added.
    await sql.transaction(tx => [
      tx`DELETE FROM level_submissions WHERE player_id=${playerId}`,
      tx`DELETE FROM player_daily_level_submission_limits WHERE player_id=${playerId}`,
      tx`DELETE FROM player_release_reads WHERE player_id=${playerId}`,
      tx`DELETE FROM player_notifications WHERE player_id=${playerId}`,
      tx`DELETE FROM garden_plots WHERE player_id=${playerId}`,
      tx`DELETE FROM player_garden WHERE player_id=${playerId}`,
      tx`DELETE FROM player_study_progress WHERE player_id=${playerId}`,
      tx`DELETE FROM player_task_progress WHERE player_id=${playerId}`,
      tx`DELETE FROM chests WHERE player_id=${playerId}`,
      tx`DELETE FROM unlocked_items WHERE player_id=${playerId}`,
      tx`DELETE FROM tower_levels WHERE player_id=${playerId}`,
      tx`DELETE FROM inventory_shards WHERE player_id=${playerId}`,
      tx`DELETE FROM player_progress WHERE player_id=${playerId}`,
      tx`DELETE FROM player_wallet WHERE player_id=${playerId}`,
      tx`DELETE FROM user_accounts WHERE player_id=${playerId}`,
      tx`DELETE FROM players WHERE player_id=${playerId}`,
    ]);

    return res.json({ ok: true });
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
