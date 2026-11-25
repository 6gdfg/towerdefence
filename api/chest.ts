import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createId, ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { ApiError, getErrorMessage } from './_errors.js';
import { recordPlayerTaskEvent } from './tasks.js';
import { getChestRewardConfig, isChestType, pickChestShardReward, type ChestType } from '../shared/rewards.js';
import { splitShardInventory } from '../shared/shards.js';
import { ELEMENT_ITEM_IDS, PLANT_ITEM_IDS } from '../shared/unlocks.js';

const LEGENDARY_CRAFT_COST = {
  epic: 2,
  rare: 5,
  common: 10,
} as const;

const SEED_DROP_CHANCE: Record<ChestType, number> = {
  common: 0.2,
  rare: 0.5,
  epic: 0.8,
  legendary: 1,
};

type ChestDurationRow = {
  duration_seconds?: number | string;
};

type ChestStatusRow = {
  chest_id: string;
  status: string;
  unlock_ready_at?: string | number | Date | null;
  chest_type?: string | null;
  coin_reward?: number | string | null;
};

type ChestMaterialRow = {
  chest_id: string;
  chest_type?: string | null;
};

type UnlockedItemRow = {
  item_id: string;
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickLockedItem(candidates: readonly string[], unlocked: Set<string>): string | null {
  const locked = candidates.filter(itemId => !unlocked.has(itemId));
  if (locked.length === 0) return null;
  return locked[Math.floor(Math.random() * locked.length)];
}

function getRequiredPlayerId(req: VercelRequest, res: VercelResponse) {
  const playerId = getAuthPlayerId(req);
  if (!playerId) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  return playerId;
}

async function grantChestRewards(playerId: string, chests: ChestStatusRow[]) {
  const sql = getSql();
  const shards: Record<string, number> = {};
  const chestTypes: Record<ChestType, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
  let coins = 0;
  let magicKeys = 0;
  let plantSeeds = 0;
  let chestSeeds = 0;

  const hasLegendary = chests.some(chest => chest.chest_type === 'legendary');
  const unlockedRows = hasLegendary
    ? await sql`SELECT item_id FROM unlocked_items WHERE player_id=${playerId} AND unlocked=true`
    : [];
  const unlockedSet = new Set((unlockedRows as UnlockedItemRow[]).map(row => row.item_id));
  const newUnlocks: string[] = [];

  for (const chest of chests) {
    const chestType: ChestType = isChestType(chest.chest_type) ? chest.chest_type : 'common';
    const config = getChestRewardConfig(chestType);
    const storedCoins = Number(chest.coin_reward || 0);
    coins += storedCoins > 0 ? storedCoins : randInt(config.coins.min, config.coins.max);
    magicKeys += Math.random() < config.magicKeyChance ? 1 : 0;
    plantSeeds += Math.random() < SEED_DROP_CHANCE[chestType]
      ? (chestType === 'legendary' ? randInt(3, 5) : 1)
      : 0;
    chestSeeds += Math.random() < SEED_DROP_CHANCE[chestType]
      ? (chestType === 'legendary' ? randInt(3, 5) : 1)
      : 0;
    chestTypes[chestType] += 1;

    const shardCount = randInt(config.shardRolls.min, config.shardRolls.max);
    for (let i = 0; i < shardCount; i++) {
      const rewardId = pickChestShardReward();
      shards[rewardId] = (shards[rewardId] || 0) + 1;
    }

    if (chestType === 'legendary') {
      const plantUnlock = Math.random() < 0.2 ? pickLockedItem(PLANT_ITEM_IDS, unlockedSet) : null;
      if (plantUnlock) {
        unlockedSet.add(plantUnlock);
        newUnlocks.push(plantUnlock);
      }
      const elementUnlock = Math.random() < 0.1 ? pickLockedItem(ELEMENT_ITEM_IDS, unlockedSet) : null;
      if (elementUnlock) {
        unlockedSet.add(elementUnlock);
        newUnlocks.push(elementUnlock);
      }
    }
  }

  // All rewards depend on actually consuming the same ready chests. A stale
  // pre-read (including overlapping open/openAll requests) grants nothing.
  const results = await sql.transaction(tx => [
    tx`SELECT player_id FROM player_wallet WHERE player_id=${playerId} FOR UPDATE`,
    tx.query(`WITH eligible AS (
        SELECT chest_id FROM chests WHERE player_id=$1::text AND chest_id IN (SELECT jsonb_array_elements_text($2::jsonb))
          AND (status='ready' OR (status='unlocking' AND unlock_ready_at <= NOW()))
      ), consumed AS (
        DELETE FROM chests WHERE player_id=$1::text AND chest_id IN (SELECT chest_id FROM eligible)
          AND (SELECT COUNT(*) FROM eligible)=$3::integer RETURNING chest_id
      ), credited AS (
        UPDATE player_wallet SET coins=coins+$4::bigint, magic_keys=magic_keys+$5::integer, updated_at=NOW()
        WHERE player_id=$1::text AND EXISTS (SELECT 1 FROM consumed) RETURNING player_id
      ), shards_saved AS (
        INSERT INTO inventory_shards(player_id,tower_type,shards)
        SELECT $1::text, key, value::integer FROM jsonb_each_text($6::jsonb), credited
        ON CONFLICT(player_id,tower_type) DO UPDATE SET shards=inventory_shards.shards+EXCLUDED.shards RETURNING tower_type
      ), unlocked AS (
        INSERT INTO unlocked_items(player_id,item_id,unlocked,unlocked_at)
        SELECT $1::text, value, TRUE, NOW() FROM jsonb_array_elements_text($7::jsonb), credited
        ON CONFLICT(player_id,item_id) DO UPDATE SET unlocked=TRUE, unlocked_at=NOW() RETURNING item_id
      ), seeds_saved AS (
        INSERT INTO player_garden(player_id,plant_seeds,chest_seeds,unlocked_plots)
        SELECT player_id,$8::integer,$9::integer,8 FROM credited WHERE $8::integer>0 OR $9::integer>0
        ON CONFLICT(player_id) DO UPDATE SET plant_seeds=player_garden.plant_seeds+EXCLUDED.plant_seeds,
          chest_seeds=player_garden.chest_seeds+EXCLUDED.chest_seeds,updated_at=NOW() RETURNING player_id
      ) SELECT chest_id FROM consumed`,
    [playerId, JSON.stringify(chests.map(chest => chest.chest_id)), chests.length, coins, magicKeys,
      JSON.stringify(shards), JSON.stringify(newUnlocks), plantSeeds, chestSeeds]),
  ]) as unknown[][];
  if (results[1].length !== chests.length) throw new ApiError(409, '宝箱状态已变化，请刷新后重试。');

  try {
    await recordPlayerTaskEvent(playerId, 'chestOpen');
  } catch (taskError) {
    console.error('Failed to record chest open task', taskError);
  }

  return {
    ok: true,
    shards,
    ...splitShardInventory(shards),
    coins,
    magicKeys,
    plantSeeds,
    chestSeeds,
    chestType: chests.length === 1
      ? (isChestType(chests[0].chest_type) ? chests[0].chest_type : 'common')
      : 'multiple',
    chestTypes,
    openedCount: chests.length,
    newUnlocks,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureTables();
    const sql = getSql();

    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

    const playerId = getRequiredPlayerId(req, res);
    if (!playerId) return;
    await ensurePlayer(playerId);

    const { action, chestId, currency } = req.body || {};

    if (action === 'craftLegendary') {
      const materialRows = await sql`SELECT chest_id, chest_type FROM chests
        WHERE player_id=${playerId} AND chest_type IN ('common','rare','epic')
        ORDER BY awarded_at ASC`;
      const byType: Record<'common' | 'rare' | 'epic', ChestMaterialRow[]> = {
        common: [],
        rare: [],
        epic: [],
      };

      (materialRows as ChestMaterialRow[]).forEach(row => {
        if (row.chest_type === 'common' || row.chest_type === 'rare' || row.chest_type === 'epic') {
          byType[row.chest_type].push(row);
        }
      });

      const counts = {
        common: byType.common.length,
        rare: byType.rare.length,
        epic: byType.epic.length,
      };
      const canCraft = counts.epic >= LEGENDARY_CRAFT_COST.epic
        && counts.rare >= LEGENDARY_CRAFT_COST.rare
        && counts.common >= LEGENDARY_CRAFT_COST.common;
      if (!canCraft) {
        return res.status(400).json({ error: 'CHESTS_NOT_ENOUGH', counts, required: LEGENDARY_CRAFT_COST });
      }

      const consumedIds = [
        ...byType.epic.slice(0, LEGENDARY_CRAFT_COST.epic),
        ...byType.rare.slice(0, LEGENDARY_CRAFT_COST.rare),
        ...byType.common.slice(0, LEGENDARY_CRAFT_COST.common),
      ].map(row => row.chest_id);
      const chestConfig = getChestRewardConfig('legendary');
      const chestCoinReward = randInt(chestConfig.coins.min, chestConfig.coins.max);
      const legendaryChestId = createId('c');

      const results = await sql.transaction(tx => [
        tx`SELECT player_id FROM player_wallet WHERE player_id=${playerId} FOR UPDATE`,
        tx`WITH eligible AS (
            SELECT chest_id FROM chests WHERE player_id=${playerId}
              AND chest_id IN (SELECT jsonb_array_elements_text(${JSON.stringify(consumedIds)}::jsonb))
          ), consumed AS (
            DELETE FROM chests WHERE player_id=${playerId} AND chest_id IN (SELECT chest_id FROM eligible)
              AND (SELECT COUNT(*) FROM eligible)=${consumedIds.length} RETURNING chest_id
          ) INSERT INTO chests (chest_id, player_id, status, duration_seconds, chest_type, coin_reward)
            SELECT ${legendaryChestId}, ${playerId}, 'locked', ${chestConfig.unlockSeconds}, 'legendary', ${chestCoinReward}
            WHERE (SELECT COUNT(*) FROM consumed)=${consumedIds.length} RETURNING chest_id`,
      ]) as unknown[][];
      if (!results[1].length) return res.status(409).json({ error: '宝箱材料已变化，请刷新后重试。' });

      return res.json({ ok: true, chestId: legendaryChestId, chestType: 'legendary', counts, required: LEGENDARY_CRAFT_COST });
    }

    if (action === 'openAll') {
      const rows = await sql`SELECT chest_id, status, unlock_ready_at, chest_type, coin_reward
        FROM chests
        WHERE player_id=${playerId}
          AND (status='ready' OR (status='unlocking' AND unlock_ready_at <= NOW()))
        ORDER BY awarded_at ASC`;
      if (rows.length === 0) return res.status(400).json({ error: 'NO_READY_CHESTS' });
      return res.json(await grantChestRewards(playerId, rows as ChestStatusRow[]));
    }

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

      const skipCurrency = currency === 'coins' ? 'coins' : 'diamonds';
      const cost = skipCurrency === 'coins'
        ? Math.max(1, Math.ceil(remainingMs / 60000)) * 20
        : Math.max(1, Math.ceil(remainingMs / (30 * 60 * 1000)));

      const results = await sql.transaction(tx => [
        tx`SELECT player_id FROM player_wallet WHERE player_id=${playerId} FOR UPDATE`,
        tx.query(`WITH current_chest AS (
            SELECT chest_id, GREATEST(0,CEIL(EXTRACT(EPOCH FROM (unlock_ready_at-NOW()))/$3::numeric))::integer*$4::integer AS cost
            FROM chests WHERE player_id=$1::text AND chest_id=$2::text AND status='unlocking'
          ), paid AS (
            UPDATE player_wallet SET ${skipCurrency}=${skipCurrency}-current_chest.cost,updated_at=NOW()
            FROM current_chest WHERE player_id=$1::text AND ${skipCurrency}>=current_chest.cost RETURNING current_chest.cost
          ) UPDATE chests SET status='ready',unlock_ready_at=NOW()
            FROM paid WHERE player_id=$1::text AND chest_id=$2::text RETURNING paid.cost,unlock_ready_at`,
        [playerId, chestId, skipCurrency === 'coins' ? 60 : 1800, skipCurrency === 'coins' ? 20 : 1]),
      ]) as Array<Array<Record<string, unknown>>>;
      const skipped = results[1][0];
      if (!skipped) return res.status(409).json({ error: '余额不足或宝箱已被处理，请刷新后重试。', need: cost });
      return res.json({ ok: true, cost: Number(skipped.cost), currency: skipCurrency, readyAt: skipped.unlock_ready_at });
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
      return res.json(await grantChestRewards(playerId, [c]));
    }

    return res.status(400).json({ error: 'bad action' });
  } catch (e: unknown) {
    if (!(e instanceof ApiError)) console.error(e);
    return res.status(e instanceof ApiError ? e.status : 500).json({ error: getErrorMessage(e) });
  }
}
