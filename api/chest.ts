import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensurePlayer, ensureTables, getSql } from './_db';
import { getAuthPlayerId } from './_auth';
import { getErrorMessage } from './_errors';
import { getChestRewardConfig, isChestType, type ChestType } from '../shared/rewards';
import { splitShardInventory } from '../shared/shards';

const REWARD_POOL_BY_CHEST: Record<ChestType, Array<{ id: string; weight: number }>> = {
  common: [
    { id: 'sunflower', weight: 20 },
    { id: 'bottleGrass', weight: 18 },
    { id: 'fourLeafClover', weight: 8 },
    { id: 'rocket', weight: 6 },
    { id: 'element:fire', weight: 5 },
    { id: 'element:wind', weight: 4 },
  ],
  rare: [
    { id: 'sunflower', weight: 10 },
    { id: 'bottleGrass', weight: 10 },
    { id: 'fourLeafClover', weight: 10 },
    { id: 'rocket', weight: 10 },
    { id: 'machineGun', weight: 8 },
    { id: 'sunlightFlower', weight: 7 },
    { id: 'element:fire', weight: 8 },
    { id: 'element:wind', weight: 8 },
    { id: 'element:ice', weight: 8 },
    { id: 'element:electric', weight: 7 },
  ],
  epic: [
    { id: 'fourLeafClover', weight: 8 },
    { id: 'rocket', weight: 9 },
    { id: 'machineGun', weight: 10 },
    { id: 'sniper', weight: 10 },
    { id: 'sunlightFlower', weight: 10 },
    { id: 'element:gold', weight: 8 },
    { id: 'element:fire', weight: 8 },
    { id: 'element:electric', weight: 9 },
    { id: 'element:ice', weight: 9 },
    { id: 'element:wind', weight: 8 },
    { id: 'element:light', weight: 9 },
  ],
};

type ChestDurationRow = {
  duration_seconds?: number | string;
};

type ChestStatusRow = {
  status: string;
  unlock_ready_at?: string | number | Date | null;
  chest_type?: string | null;
  coin_reward?: number | string | null;
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRewardId(chestType: ChestType): string {
  const pool = REWARD_POOL_BY_CHEST[chestType];
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  let roll = randInt(1, totalWeight);
  for (const item of pool) {
    roll -= item.weight;
    if (roll <= 0) return item.id;
  }
  return pool[0].id;
}

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

    const playerId = getRequiredPlayerId(req, res);
    if (!playerId) return;
    await ensurePlayer(playerId);

    const { action, chestId } = req.body || {};
    if (!chestId || typeof chestId !== 'string') return res.status(400).json({ error: 'chestId required' });

    if (action === 'startUnlock') {
      const now = new Date();
      const chestRows = await sql`SELECT duration_seconds FROM chests WHERE chest_id=${chestId} AND player_id=${playerId} AND status='locked'`;
      if (chestRows.length === 0) return res.status(400).json({ error: 'invalid chest' });

      const durationSeconds = Number((chestRows as ChestDurationRow[])[0]?.duration_seconds || 3600);
      const ready = new Date(now.getTime() + durationSeconds * 1000);
      const r = await sql`UPDATE chests
        SET status='unlocking', unlock_start_at=${now.toISOString()}, unlock_ready_at=${ready.toISOString()}
        WHERE chest_id=${chestId} AND player_id=${playerId} AND status='locked'
        RETURNING chest_id`;
      if (r.length === 0) return res.status(400).json({ error: 'invalid chest' });

      return res.json({ ok: true, readyAt: ready.toISOString() });
    }

    if (action === 'skip') {
      const rows = await sql`SELECT unlock_ready_at, status FROM chests WHERE chest_id=${chestId} AND player_id=${playerId}`;
      const c = rows[0] as ChestStatusRow | undefined;
      if (!c) return res.status(404).json({ error: 'not found' });
      if (c.status !== 'unlocking' || !c.unlock_ready_at) {
        return res.status(400).json({ error: 'cannot skip' });
      }

      const readyAtMs = new Date(c.unlock_ready_at).getTime();
      const remainingMs = readyAtMs - Date.now();
      if (remainingMs <= 0) {
        return res.json({ ok: true, cost: 0, ready: true });
      }

      const minutes = Math.max(1, Math.ceil(remainingMs / 60000));
      const cost = minutes * 20;
      const spent = await sql`UPDATE player_wallet
        SET coins = coins - ${cost}, updated_at=NOW()
        WHERE player_id=${playerId} AND coins >= ${cost}
        RETURNING coins`;
      if (spent.length === 0) {
        const walletRows = await sql`SELECT coins FROM player_wallet WHERE player_id=${playerId}`;
        return res.status(400).json({ error: 'COINS_NOT_ENOUGH', need: cost, have: Number(walletRows[0]?.coins ?? 0) });
      }

      const nowIso = new Date().toISOString();
      await sql`UPDATE chests SET unlock_ready_at=${nowIso}, unlock_start_at=${nowIso} WHERE chest_id=${chestId} AND player_id=${playerId}`;

      return res.json({ ok: true, cost, readyAt: nowIso });
    }

    if (action === 'open') {
      const rows = await sql`SELECT * FROM chests WHERE chest_id=${chestId} AND player_id=${playerId}`;
      const c = rows[0] as ChestStatusRow | undefined;
      if (!c) return res.status(404).json({ error: 'not found' });

      const readyAtMs = c.unlock_ready_at ? new Date(c.unlock_ready_at).getTime() : 0;
      const canOpen = c.status === 'ready' || (c.status === 'unlocking' && readyAtMs <= Date.now());
      if (!canOpen) {
        return res.status(400).json({ error: 'not ready' });
      }

      const chestType: ChestType = isChestType(c.chest_type) ? c.chest_type : 'common';
      const chestConfig = getChestRewardConfig(chestType);
      const storedCoinReward = Number(c.coin_reward || 0);
      const coinReward = storedCoinReward > 0
        ? storedCoinReward
        : randInt(chestConfig.coins.min, chestConfig.coins.max);
      const shardCount = randInt(chestConfig.shardRolls.min, chestConfig.shardRolls.max);
      const magicKeyReward = Math.random() < chestConfig.magicKeyChance ? 1 : 0;

      const sum: Record<string, number> = {};
      for (let i = 0; i < shardCount; i++) {
        const rewardId = pickRewardId(chestType);
        sum[rewardId] = (sum[rewardId] || 0) + 1;
      }
      const splitShards = splitShardInventory(sum);

      for (const [tower, amt] of Object.entries(sum)) {
        await sql`INSERT INTO inventory_shards (player_id, tower_type, shards) VALUES (${playerId}, ${tower}, ${amt})
          ON CONFLICT (player_id, tower_type) DO UPDATE SET shards = inventory_shards.shards + EXCLUDED.shards`;
      }

      if (coinReward > 0 || magicKeyReward > 0) {
        await sql`UPDATE player_wallet
          SET coins = coins + ${coinReward}, magic_keys = magic_keys + ${magicKeyReward}, updated_at=NOW()
          WHERE player_id=${playerId}`;
      }

      await sql`DELETE FROM chests WHERE chest_id=${chestId} AND player_id=${playerId}`;

      return res.json({ ok: true, shards: sum, ...splitShards, coins: coinReward, magicKeys: magicKeyReward, chestType });
    }

    return res.status(400).json({ error: 'bad action' });
  } catch (e: unknown) {
    console.error(e);
    return res.status(500).json({ error: getErrorMessage(e) });
  }
}
