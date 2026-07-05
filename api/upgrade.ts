import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensurePlayer, ensureTables, getSql } from './_db';
import { getAuthPlayerId } from './_auth';
import { getUpgradeCost } from '../shared/unlocks';
import { getErrorMessage } from './_errors';

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
    const sql = getSql();

    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

    const pid = getRequiredPlayerId(req, res);
    if (!pid) return;
    await ensurePlayer(pid);

    const { action, towerType } = req.body || {} as { action?: string; towerType?: string };
    if (action !== 'upgrade') return res.status(400).json({ error: 'bad action' });
    if (!towerType || typeof towerType !== 'string') return res.status(400).json({ error: 'towerType required' });

    const [walletRows, levelRows, shardRows] = await Promise.all([
      sql`SELECT coins FROM player_wallet WHERE player_id=${pid}`,
      sql`SELECT level FROM tower_levels WHERE player_id=${pid} AND tower_type=${towerType}`,
      sql`SELECT shards FROM inventory_shards WHERE player_id=${pid} AND tower_type=${towerType}`,
    ]);

    const coins = Number(walletRows[0]?.coins ?? 0);
    const currentLevel = Number(levelRows[0]?.level ?? 1);
    const shards = Number(shardRows[0]?.shards ?? 0);
    const cost = getUpgradeCost(currentLevel);

    if (coins < cost.coins) return res.status(400).json({ error: 'COINS_NOT_ENOUGH', need: cost.coins, have: coins });
    if (shards < cost.fragments) return res.status(400).json({ error: 'SHARDS_NOT_ENOUGH', need: cost.fragments, have: shards });

    const nextLevel = currentLevel + 1;
    await sql`UPDATE player_wallet SET coins = coins - ${cost.coins}, updated_at=NOW() WHERE player_id=${pid}`;
    await sql`INSERT INTO inventory_shards (player_id, tower_type, shards) VALUES (${pid}, ${towerType}, ${shards - cost.fragments})
      ON CONFLICT (player_id, tower_type) DO UPDATE SET shards = ${shards - cost.fragments}`;
    await sql`INSERT INTO tower_levels (player_id, tower_type, level) VALUES (${pid}, ${towerType}, ${nextLevel})
      ON CONFLICT (player_id, tower_type) DO UPDATE SET level=${nextLevel}`;

    return res.json({ ok: true, towerType, level: nextLevel, cost });
  } catch (e: unknown) {
    console.error(e);
    return res.status(500).json({ error: getErrorMessage(e) });
  }
}
