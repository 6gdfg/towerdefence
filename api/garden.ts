import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createId, ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { getErrorMessage } from './_errors.js';
import { getChestRewardConfig, MAX_CHEST_INVENTORY, type ChestType } from '../shared/rewards.js';
import { NON_UPGRADEABLE_PLANT_ITEMS, PLANT_ITEM_IDS } from '../shared/unlocks.js';

const BASE_PLOTS = 8;
const PLOT_UNLOCK_COST = 2000;
const PLANT_GROW_SECONDS = 2 * 60 * 60;
const CHEST_GROW_SECONDS = 6 * 60 * 60;
const MAX_EFFICIENCY_LEVEL = 80;
const MAX_LUCK_LEVEL = 50;
const MAX_LUCK_SHARD_LEVEL = 11;

const UPGRADEABLE_PLANTS = PLANT_ITEM_IDS.filter(
  item => !(NON_UPGRADEABLE_PLANT_ITEMS as readonly string[]).includes(item),
);

type GardenRow = {
  plant_seeds?: number | string;
  chest_seeds?: number | string;
  unlocked_plots?: number | string;
  efficiency_level?: number | string;
  luck_level?: number | string;
};

type PlotRow = {
  plot_index: number | string;
  seed_type: 'plant' | 'chest';
  target_item?: string | null;
  planted_at: string | Date;
  ready_at: string | Date;
};

function getRequiredPlayerId(req: VercelRequest, res: VercelResponse) {
  const playerId = getAuthPlayerId(req);
  if (!playerId) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  return playerId;
}

function randomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomChestType(): ChestType {
  const roll = Math.random();
  if (roll < 0.8) return 'common';
  if (roll < 0.95) return 'rare';
  if (roll < 0.99) return 'epic';
  return 'legendary';
}

async function ensureGarden(playerId: string) {
  const sql = getSql();
  await sql`INSERT INTO player_garden (player_id, unlocked_plots) VALUES (${playerId}, ${BASE_PLOTS})
    ON CONFLICT (player_id) DO NOTHING`;
}

async function gardenPayload(playerId: string) {
  const sql = getSql();
  const [gardenRows, plotRows, walletRows, chestCountRows] = await Promise.all([
    sql`SELECT plant_seeds, chest_seeds, unlocked_plots, efficiency_level, luck_level FROM player_garden WHERE player_id=${playerId}`,
    sql`SELECT plot_index, seed_type, target_item, planted_at, ready_at FROM garden_plots WHERE player_id=${playerId} ORDER BY plot_index`,
    sql`SELECT coins, diamonds, experience FROM player_wallet WHERE player_id=${playerId}`,
    sql`SELECT COUNT(*)::int AS count FROM chests WHERE player_id=${playerId}`,
  ]);
  const garden = gardenRows[0] as GardenRow | undefined;
  const efficiencyLevel = Math.max(1, Math.min(MAX_EFFICIENCY_LEVEL, Number(garden?.efficiency_level ?? 1)));
  const luckLevel = Math.max(1, Math.min(MAX_LUCK_LEVEL, Number(garden?.luck_level ?? 1)));
  const shardLuckLevel = Math.min(MAX_LUCK_SHARD_LEVEL, luckLevel);
  const luckSteps = shardLuckLevel - 1;
  return {
    plantSeeds: Number(garden?.plant_seeds ?? 0),
    chestSeeds: Number(garden?.chest_seeds ?? 0),
    unlockedPlots: Number(garden?.unlocked_plots ?? BASE_PLOTS),
    unlockCost: PLOT_UNLOCK_COST,
    chestCount: Number(chestCountRows[0]?.count ?? 0),
    maxChests: MAX_CHEST_INVENTORY,
    efficiencyLevel,
    luckLevel,
    maxEfficiencyLevel: MAX_EFFICIENCY_LEVEL,
    maxLuckLevel: MAX_LUCK_LEVEL,
    efficiencyReductionPct: efficiencyLevel - 1,
    shardChances: { one: 100 - 10 * luckSteps, two: 7 * luckSteps, three: 3 * luckSteps },
    seedRecyclePct: 49 + luckLevel,
    growthSeconds: { plant: PLANT_GROW_SECONDS, chest: CHEST_GROW_SECONDS },
    plots: (plotRows as PlotRow[]).map(plot => ({
      index: Number(plot.plot_index),
      seedType: plot.seed_type,
      targetItem: plot.target_item ?? null,
      plantedAt: new Date(plot.planted_at).toISOString(),
      readyAt: new Date(plot.ready_at).toISOString(),
    })),
    wallet: {
      coins: Number(walletRows[0]?.coins ?? 0),
      diamonds: Number(walletRows[0]?.diamonds ?? 0),
      experience: Number(walletRows[0]?.experience ?? 0),
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureTables();
    const playerId = getRequiredPlayerId(req, res);
    if (!playerId) return;
    await ensurePlayer(playerId);
    await ensureGarden(playerId);
    const sql = getSql();

    if (req.method === 'GET') return res.json(await gardenPayload(playerId));
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

    const action = req.body?.action;
    if (action === 'unlockPlot') {
      const spent = await sql`UPDATE player_wallet SET coins=coins - ${PLOT_UNLOCK_COST}, updated_at=NOW()
        WHERE player_id=${playerId} AND coins >= ${PLOT_UNLOCK_COST} RETURNING coins`;
      if (spent.length === 0) return res.status(400).json({ error: 'COINS_NOT_ENOUGH' });
      await sql`UPDATE player_garden SET unlocked_plots=unlocked_plots + 1, updated_at=NOW() WHERE player_id=${playerId}`;
      return res.json(await gardenPayload(playerId));
    }

    if (action === 'upgrade') {
      const upgradeType = req.body?.upgradeType;
      if (upgradeType !== 'efficiency' && upgradeType !== 'luck') return res.status(400).json({ error: 'invalid upgrade' });
      const column = upgradeType === 'efficiency' ? 'efficiency_level' : 'luck_level';
      const maxLevel = upgradeType === 'efficiency' ? MAX_EFFICIENCY_LEVEL : MAX_LUCK_LEVEL;
      const upgraded = await sql.query(`WITH current_level AS (
          SELECT player_id, ${column} AS level FROM player_garden WHERE player_id=$1
        ), paid AS (
          UPDATE player_wallet wallet
          SET experience=wallet.experience - (3 + current_level.level), updated_at=NOW()
          FROM current_level
          WHERE wallet.player_id=current_level.player_id
            AND current_level.level < $2
            AND wallet.experience >= 3 + current_level.level
          RETURNING wallet.player_id
        )
        UPDATE player_garden garden
        SET ${column}=garden.${column} + 1, updated_at=NOW()
        FROM current_level, paid
        WHERE garden.player_id=current_level.player_id
        RETURNING garden.${column} AS level`, [playerId, maxLevel]);
      if (upgraded.length === 0) {
        const statusRows = await sql.query(`SELECT garden.${column} AS level, wallet.experience
          FROM player_garden garden JOIN player_wallet wallet ON wallet.player_id=garden.player_id
          WHERE garden.player_id=$1`, [playerId]);
        if (Number(statusRows[0]?.level ?? 1) >= maxLevel) return res.status(400).json({ error: 'MAX_LEVEL' });
        return res.status(400).json({ error: 'EXPERIENCE_NOT_ENOUGH' });
      }
      return res.json(await gardenPayload(playerId));
    }

    if (action === 'plant') {
      const plotIndex = Math.floor(Number(req.body?.plotIndex));
      const seedType = req.body?.seedType;
      if (!Number.isFinite(plotIndex) || plotIndex < 0 || (seedType !== 'plant' && seedType !== 'chest')) {
        return res.status(400).json({ error: 'invalid planting request' });
      }
      const gardenRows = await sql`SELECT plant_seeds, chest_seeds, unlocked_plots, efficiency_level, luck_level FROM player_garden WHERE player_id=${playerId}`;
      const garden = gardenRows[0] as GardenRow | undefined;
      if (!garden || plotIndex >= Number(garden.unlocked_plots ?? BASE_PLOTS)) return res.status(400).json({ error: 'plot locked' });
      const seedCount = seedType === 'plant' ? Number(garden.plant_seeds ?? 0) : Number(garden.chest_seeds ?? 0);
      if (seedCount < 1) return res.status(400).json({ error: 'SEEDS_NOT_ENOUGH' });
      const occupied = await sql`SELECT 1 FROM garden_plots WHERE player_id=${playerId} AND plot_index=${plotIndex}`;
      if (occupied.length > 0) return res.status(400).json({ error: 'plot occupied' });

      const targetItem = seedType === 'plant' ? randomItem(UPGRADEABLE_PLANTS) : null;
      const baseGrowSeconds = seedType === 'plant' ? PLANT_GROW_SECONDS : CHEST_GROW_SECONDS;
      const efficiencyLevel = Math.max(1, Math.min(MAX_EFFICIENCY_LEVEL, Number(garden.efficiency_level ?? 1)));
      const growSeconds = Math.max(1, Math.round(baseGrowSeconds * (1 - (efficiencyLevel - 1) * 0.01)));
      const readyAt = new Date(Date.now() + growSeconds * 1000).toISOString();
      const deducted = seedType === 'plant'
        ? await sql`UPDATE player_garden SET plant_seeds=plant_seeds - 1, updated_at=NOW() WHERE player_id=${playerId} AND plant_seeds > 0 RETURNING plant_seeds`
        : await sql`UPDATE player_garden SET chest_seeds=chest_seeds - 1, updated_at=NOW() WHERE player_id=${playerId} AND chest_seeds > 0 RETURNING chest_seeds`;
      if (deducted.length === 0) return res.status(400).json({ error: 'SEEDS_NOT_ENOUGH' });
      await sql`INSERT INTO garden_plots (player_id, plot_index, seed_type, target_item, ready_at)
        VALUES (${playerId}, ${plotIndex}, ${seedType}, ${targetItem}, ${readyAt})`;
      return res.json(await gardenPayload(playerId));
    }

    if (action === 'harvest') {
      const plotIndex = Math.floor(Number(req.body?.plotIndex));
      if (!Number.isFinite(plotIndex) || plotIndex < 0) return res.status(400).json({ error: 'invalid plot' });
      const readyPlots = await sql`SELECT seed_type FROM garden_plots
        WHERE player_id=${playerId} AND plot_index=${plotIndex} AND ready_at <= NOW()`;
      if (readyPlots.length === 0) return res.status(400).json({ error: 'plot not ready' });
      if (readyPlots[0].seed_type === 'chest') {
        const chestCountRows = await sql`SELECT COUNT(*)::int AS count FROM chests WHERE player_id=${playerId}`;
        if (Number(chestCountRows[0]?.count ?? 0) >= MAX_CHEST_INVENTORY) {
          return res.status(400).json({ error: 'CHEST_INVENTORY_FULL' });
        }
      }
      const harvested = await sql`DELETE FROM garden_plots
        WHERE player_id=${playerId} AND plot_index=${plotIndex} AND ready_at <= NOW()
        RETURNING seed_type, target_item`;
      if (harvested.length === 0) return res.status(400).json({ error: 'plot not ready' });

      const seedType = harvested[0].seed_type;
      if (seedType === 'plant') {
        const gardenRows = await sql`SELECT luck_level FROM player_garden WHERE player_id=${playerId}`;
        const luckLevel = Math.max(1, Math.min(MAX_LUCK_LEVEL, Number(gardenRows[0]?.luck_level ?? 1)));
        const luckSteps = Math.min(MAX_LUCK_SHARD_LEVEL, luckLevel) - 1;
        const roll = Math.random() * 100;
        const shardCount = roll < 3 * luckSteps ? 3 : roll < 10 * luckSteps ? 2 : 1;
        const targetItem = String(harvested[0].target_item || randomItem(UPGRADEABLE_PLANTS));
        await sql`INSERT INTO inventory_shards (player_id, tower_type, shards) VALUES (${playerId}, ${targetItem}, ${shardCount})
          ON CONFLICT (player_id, tower_type) DO UPDATE SET shards=inventory_shards.shards + ${shardCount}`;
        const recycledSeed = Math.random() < (49 + luckLevel) / 100 ? 1 : 0;
        if (recycledSeed > 0) {
          await sql`UPDATE player_garden SET plant_seeds=plant_seeds + 1, updated_at=NOW() WHERE player_id=${playerId}`;
        }
        return res.json({ ...(await gardenPayload(playerId)), harvest: { seedType, targetItem, shards: shardCount, recycledSeed } });
      }

      const chestType = randomChestType();
      const chestConfig = getChestRewardConfig(chestType);
      const coinReward = Math.floor(Math.random() * (chestConfig.coins.max - chestConfig.coins.min + 1)) + chestConfig.coins.min;
      const chestId = createId('c');
      await sql`INSERT INTO chests (chest_id, player_id, status, duration_seconds, chest_type, coin_reward)
        VALUES (${chestId}, ${playerId}, 'locked', ${chestConfig.unlockSeconds}, ${chestType}, ${coinReward})`;
      return res.json({ ...(await gardenPayload(playerId)), harvest: { seedType, chestType, chestId } });
    }

    return res.status(400).json({ error: 'bad action' });
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
