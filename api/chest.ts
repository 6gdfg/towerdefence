import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createId, ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { getErrorMessage } from './_errors.js';
import { recordPlayerTaskEvent } from './tasks.js';
import { getChestRewardConfig, isChestType, type ChestType } from '../shared/rewards.js';
import { splitShardInventory } from '../shared/shards.js';
import { ELEMENT_ITEM_IDS, PLANT_ITEM_IDS } from '../shared/unlocks.js';

const REWARD_POOL_BY_CHEST: Record<ChestType, Array<{ id: string; weight: number }>> = {
  common: [
    { id: 'sunflower', weight: 20 },
    { id: 'bottleGrass', weight: 18 },
    { id: 'doubleBottleGrass', weight: 6 },
    { id: 'flameBottleGrass', weight: 6 },
    { id: 'puffShroom', weight: 18 },
    { id: 'fourLeafClover', weight: 8 },
    { id: 'boomerangLeaf', weight: 5 },
    { id: 'pentagram', weight: 4 },
    { id: 'rocket', weight: 6 },
    { id: 'holyFlower', weight: 2 },
    { id: 'hotPepper', weight: 3 },
    { id: 'frostBlastShroom', weight: 3 },
    { id: 'cycloneShroom', weight: 6 },
    { id: 'windSailGrass', weight: 3 },
    { id: 'windWallGrass', weight: 3 },
    { id: 'magnetNeedle', weight: 4 },
    { id: 'siegeRamGrass', weight: 3 },
    { id: 'electricFlower', weight: 4 },
    { id: 'element:gold', weight: 4 },
    { id: 'element:fire', weight: 5 },
    { id: 'element:electric', weight: 4 },
    { id: 'element:ice', weight: 4 },
    { id: 'element:wind', weight: 4 },
    { id: 'element:light', weight: 4 },
  ],
  rare: [
    { id: 'sunflower', weight: 10 },
    { id: 'bottleGrass', weight: 10 },
    { id: 'doubleBottleGrass', weight: 10 },
    { id: 'flameBottleGrass', weight: 10 },
    { id: 'puffShroom', weight: 10 },
    { id: 'fourLeafClover', weight: 10 },
    { id: 'boomerangLeaf', weight: 9 },
    { id: 'pentagram', weight: 8 },
    { id: 'rocket', weight: 10 },
    { id: 'machineGun', weight: 8 },
    { id: 'sunlightFlower', weight: 7 },
    { id: 'holyFlower', weight: 6 },
    { id: 'hotPepper', weight: 8 },
    { id: 'frostBlastShroom', weight: 8 },
    { id: 'cycloneShroom', weight: 9 },
    { id: 'windSailGrass', weight: 7 },
    { id: 'windWallGrass', weight: 7 },
    { id: 'magnetNeedle', weight: 8 },
    { id: 'siegeRamGrass', weight: 7 },
    { id: 'electricFlower', weight: 8 },
    { id: 'element:gold', weight: 8 },
    { id: 'element:fire', weight: 8 },
    { id: 'element:electric', weight: 7 },
    { id: 'element:ice', weight: 8 },
    { id: 'element:wind', weight: 8 },
    { id: 'element:light', weight: 8 },
  ],
  epic: [
    { id: 'fourLeafClover', weight: 8 },
    { id: 'doubleBottleGrass', weight: 9 },
    { id: 'flameBottleGrass', weight: 9 },
    { id: 'pentagram', weight: 9 },
    { id: 'puffShroom', weight: 6 },
    { id: 'boomerangLeaf', weight: 9 },
    { id: 'rocket', weight: 9 },
    { id: 'machineGun', weight: 10 },
    { id: 'sniper', weight: 10 },
    { id: 'sunlightFlower', weight: 10 },
    { id: 'holyFlower', weight: 8 },
    { id: 'hotPepper', weight: 9 },
    { id: 'frostBlastShroom', weight: 9 },
    { id: 'cycloneShroom', weight: 9 },
    { id: 'windSailGrass', weight: 8 },
    { id: 'windWallGrass', weight: 8 },
    { id: 'magnetNeedle', weight: 9 },
    { id: 'siegeRamGrass', weight: 9 },
    { id: 'electricFlower', weight: 9 },
    { id: 'element:gold', weight: 8 },
    { id: 'element:fire', weight: 8 },
    { id: 'element:electric', weight: 9 },
    { id: 'element:ice', weight: 9 },
    { id: 'element:wind', weight: 8 },
    { id: 'element:light', weight: 9 },
  ],
  legendary: [
    { id: 'fourLeafClover', weight: 8 },
    { id: 'doubleBottleGrass', weight: 9 },
    { id: 'flameBottleGrass', weight: 9 },
    { id: 'pentagram', weight: 9 },
    { id: 'puffShroom', weight: 6 },
    { id: 'boomerangLeaf', weight: 9 },
    { id: 'rocket', weight: 9 },
    { id: 'machineGun', weight: 10 },
    { id: 'sniper', weight: 10 },
    { id: 'sunlightFlower', weight: 10 },
    { id: 'holyFlower', weight: 8 },
    { id: 'hotPepper', weight: 9 },
    { id: 'frostBlastShroom', weight: 9 },
    { id: 'cycloneShroom', weight: 9 },
    { id: 'windSailGrass', weight: 8 },
    { id: 'windWallGrass', weight: 8 },
    { id: 'magnetNeedle', weight: 9 },
    { id: 'siegeRamGrass', weight: 9 },
    { id: 'electricFlower', weight: 9 },
    { id: 'element:gold', weight: 8 },
    { id: 'element:fire', weight: 8 },
    { id: 'element:electric', weight: 9 },
    { id: 'element:ice', weight: 9 },
    { id: 'element:wind', weight: 8 },
    { id: 'element:light', weight: 9 },
  ],
};

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
      const rewardId = pickRewardId(chestType);
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

  await sql.transaction(tx => [
    ...Object.entries(shards).map(([tower, amount]) => tx`
      INSERT INTO inventory_shards (player_id, tower_type, shards) VALUES (${playerId}, ${tower}, ${amount})
      ON CONFLICT (player_id, tower_type) DO UPDATE SET shards=inventory_shards.shards + EXCLUDED.shards`),
    ...newUnlocks.map(itemId => tx`
      INSERT INTO unlocked_items (player_id, item_id, unlocked, unlocked_at)
      VALUES (${playerId}, ${itemId}, TRUE, NOW())
      ON CONFLICT (player_id, item_id) DO UPDATE SET unlocked=TRUE, unlocked_at=NOW()`),
    tx`UPDATE player_wallet
      SET coins=coins + ${coins}, magic_keys=magic_keys + ${magicKeys}, updated_at=NOW()
      WHERE player_id=${playerId}`,
    ...(plantSeeds > 0 || chestSeeds > 0 ? [tx`
      INSERT INTO player_garden (player_id, plant_seeds, chest_seeds, unlocked_plots)
      VALUES (${playerId}, ${plantSeeds}, ${chestSeeds}, 8)
      ON CONFLICT (player_id) DO UPDATE SET
        plant_seeds=player_garden.plant_seeds + EXCLUDED.plant_seeds,
        chest_seeds=player_garden.chest_seeds + EXCLUDED.chest_seeds,
        updated_at=NOW()`] : []),
    ...chests.map(chest => tx`DELETE FROM chests WHERE chest_id=${chest.chest_id} AND player_id=${playerId}`),
  ]);

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

      await sql.transaction(tx => [
        ...consumedIds.map(id => tx`DELETE FROM chests WHERE chest_id=${id} AND player_id=${playerId}`),
        tx`INSERT INTO chests (chest_id, player_id, status, duration_seconds, chest_type, coin_reward)
          VALUES (${legendaryChestId}, ${playerId}, 'locked', ${chestConfig.unlockSeconds}, 'legendary', ${chestCoinReward})`,
      ]);

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

      if (skipCurrency === 'coins') {
        const spent = await sql`UPDATE player_wallet
          SET coins = coins - ${cost}, updated_at=NOW()
          WHERE player_id=${playerId} AND coins >= ${cost}
          RETURNING coins`;
        if (spent.length === 0) {
          const walletRows = await sql`SELECT coins FROM player_wallet WHERE player_id=${playerId}`;
          return res.status(400).json({ error: 'COINS_NOT_ENOUGH', need: cost, have: Number(walletRows[0]?.coins ?? 0) });
        }
      } else {
        const spent = await sql`UPDATE player_wallet
          SET diamonds = diamonds - ${cost}, updated_at=NOW()
          WHERE player_id=${playerId} AND diamonds >= ${cost}
          RETURNING diamonds`;
        if (spent.length === 0) {
          const walletRows = await sql`SELECT diamonds FROM player_wallet WHERE player_id=${playerId}`;
          return res.status(400).json({ error: 'DIAMONDS_NOT_ENOUGH', need: cost, have: Number(walletRows[0]?.diamonds ?? 0) });
        }
      }

      const nowIso = new Date().toISOString();
      await sql`UPDATE chests SET unlock_ready_at=${nowIso}, unlock_start_at=${nowIso} WHERE chest_id=${chestId} AND player_id=${playerId}`;

      return res.json({ ok: true, cost, currency: skipCurrency, readyAt: nowIso });
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
    console.error(e);
    return res.status(500).json({ error: getErrorMessage(e) });
  }
}
