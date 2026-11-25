import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { getUpgradeCost, NON_UPGRADEABLE_PLANT_ITEMS, PLANT_ITEM_IDS, ELEMENT_ITEM_IDS } from '../shared/unlocks.js';
import { getErrorMessage } from './_errors.js';

const UPGRADE_ITEMS: readonly string[] = [...PLANT_ITEM_IDS, ...ELEMENT_ITEM_IDS];

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
    if ((NON_UPGRADEABLE_PLANT_ITEMS as readonly string[]).includes(towerType)) return res.status(400).json({ error: 'not upgradeable' });
    if (!UPGRADE_ITEMS.includes(towerType)) return res.status(400).json({ error: 'invalid item' });
    const unlocked = await sql`SELECT item_id FROM unlocked_items WHERE player_id=${pid} AND item_id=${towerType} AND unlocked=TRUE`;
    if (!unlocked.length) return res.status(403).json({ error: 'item locked' });

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
    const results = await sql.transaction(tx => [
      tx`SELECT player_id FROM player_wallet WHERE player_id=${pid} FOR UPDATE`,
      tx`WITH eligible AS (
          SELECT player_id FROM player_wallet WHERE player_id=${pid} AND coins>=${cost.coins}
            AND COALESCE((SELECT level FROM tower_levels WHERE player_id=${pid} AND tower_type=${towerType}),1)=${currentLevel}
            AND EXISTS (SELECT 1 FROM unlocked_items WHERE player_id=${pid} AND item_id=${towerType} AND unlocked=TRUE)
        ), consumed AS (
          UPDATE inventory_shards SET shards=shards-${cost.fragments} WHERE player_id=${pid} AND tower_type=${towerType}
            AND shards>=${cost.fragments} AND EXISTS (SELECT 1 FROM eligible) RETURNING player_id
        ), paid AS (
          UPDATE player_wallet SET coins=coins-${cost.coins},updated_at=NOW()
          WHERE player_id=${pid} AND EXISTS (SELECT 1 FROM consumed) RETURNING player_id
        ) INSERT INTO tower_levels(player_id,tower_type,level) SELECT player_id,${towerType},${nextLevel} FROM paid
          ON CONFLICT(player_id,tower_type) DO UPDATE SET level=EXCLUDED.level RETURNING level`,
    ]) as unknown[][];
    if (!results[1].length) return res.status(409).json({ error: '升级材料或等级已变化，请刷新后重试。' });

    return res.json({ ok: true, towerType, level: nextLevel, cost });
  } catch (e: unknown) {
    console.error(e);
    return res.status(500).json({ error: getErrorMessage(e) });
  }
}
