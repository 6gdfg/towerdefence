import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createId, ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { ApiError, getErrorMessage } from './_errors.js';
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

function rollPlantShardCount(luckLevel: number) {
  const luckSteps = Math.min(MAX_LUCK_SHARD_LEVEL, luckLevel) - 1;
  const roll = Math.random() * 100;
  return roll < 3 * luckSteps ? 3 : roll < 10 * luckSteps ? 2 : 1;
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

async function harvestPlots(playerId: string, plotIndex: number | null) {
  const sql = getSql();
  const [readyRows, gardenRows, chestCountRows] = await Promise.all([
    sql`SELECT plot_index,seed_type,target_item,planted_at::text AS planted_at,ready_at FROM garden_plots
      WHERE player_id=${playerId} AND ready_at<=NOW() AND (${plotIndex}::integer IS NULL OR plot_index=${plotIndex}::integer)
      ORDER BY plot_index`,
    sql`SELECT luck_level FROM player_garden WHERE player_id=${playerId}`,
    sql`SELECT COUNT(*)::integer AS count FROM chests WHERE player_id=${playerId}`,
  ]);
  const ready = readyRows as PlotRow[];
  const plants = ready.filter(plot => plot.seed_type === 'plant');
  const chestPlots = ready.filter(plot => plot.seed_type === 'chest');
  const selectedChests = chestPlots.slice(0, Math.max(0, MAX_CHEST_INVENTORY - Number(chestCountRows[0]?.count ?? 0)));
  const selected = [...plants, ...selectedChests];
  if (!selected.length) throw new ApiError(400, chestPlots.length ? 'CHEST_INVENTORY_FULL' : 'NO_READY_PLOTS');
  const luck = Math.max(1, Math.min(MAX_LUCK_LEVEL, Number(gardenRows[0]?.luck_level ?? 1)));
  const shards: Record<string, number> = {};
  let recycledSeeds = 0;
  const chestTypes: Record<ChestType, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
  const rewards = selected.map(plot => {
    const base = { index: Number(plot.plot_index), plantedAt: String(plot.planted_at) };
    if (plot.seed_type === 'plant') {
      const targetItem = plot.target_item || randomItem(UPGRADEABLE_PLANTS);
      const amount = rollPlantShardCount(luck);
      const recycled = Math.random() < (49 + luck) / 100 ? 1 : 0;
      shards[targetItem] = (shards[targetItem] ?? 0) + amount;
      recycledSeeds += recycled;
      return { ...base, seedType: 'plant' as const, targetItem, amount, recycled };
    }
    const chestType = randomChestType();
    const config = getChestRewardConfig(chestType);
    chestTypes[chestType] += 1;
    return { ...base, seedType: 'chest' as const, chestType, chestId: createId('c'), seconds: config.unlockSeconds,
      coins: Math.floor(Math.random() * (config.coins.max - config.coins.min + 1)) + config.coins.min };
  });
  const results = await sql.transaction(tx => [
    tx`SELECT player_id FROM player_wallet WHERE player_id=${playerId} FOR UPDATE`,
    tx`SELECT player_id FROM player_garden WHERE player_id=${playerId} FOR UPDATE`,
    tx.query(`WITH offers AS (
        SELECT value FROM jsonb_array_elements($2::jsonb)
      ), eligible AS (
        SELECT plot.plot_index FROM garden_plots plot JOIN offers ON plot.plot_index=(value->>'index')::integer
          AND plot.planted_at=(value->>'plantedAt')::timestamptz AND plot.seed_type=value->>'seedType'
        WHERE plot.player_id=$1::text AND plot.ready_at<=NOW()
      ), consumed AS (
        DELETE FROM garden_plots WHERE player_id=$1::text AND plot_index IN (SELECT plot_index FROM eligible)
          AND (SELECT COUNT(*) FROM eligible)=$3::integer
          AND (SELECT COUNT(*) FROM chests WHERE player_id=$1::text)+$4::integer<=$5::integer
        RETURNING plot_index
      ), shards_saved AS (
        INSERT INTO inventory_shards(player_id,tower_type,shards)
        SELECT $1::text,value->>'targetItem',SUM((value->>'amount')::integer)::integer FROM offers
          JOIN consumed ON consumed.plot_index=(value->>'index')::integer WHERE value->>'seedType'='plant'
        GROUP BY value->>'targetItem'
        ON CONFLICT(player_id,tower_type) DO UPDATE SET shards=inventory_shards.shards+EXCLUDED.shards RETURNING tower_type
      ), recycled AS (
        UPDATE player_garden SET plant_seeds=plant_seeds+COALESCE((SELECT SUM((value->>'recycled')::integer)
          FROM offers JOIN consumed ON consumed.plot_index=(value->>'index')::integer WHERE value->>'seedType'='plant'),0),updated_at=NOW()
        WHERE player_id=$1::text AND EXISTS (SELECT 1 FROM consumed) RETURNING player_id
      ), awarded AS (
        INSERT INTO chests(chest_id,player_id,status,duration_seconds,chest_type,coin_reward)
        SELECT value->>'chestId',$1::text,'locked',(value->>'seconds')::integer,value->>'chestType',(value->>'coins')::bigint
        FROM offers JOIN consumed ON consumed.plot_index=(value->>'index')::integer WHERE value->>'seedType'='chest'
        RETURNING chest_id
      ) SELECT plot_index FROM consumed`,
    [playerId, JSON.stringify(rewards), selected.length, selectedChests.length, MAX_CHEST_INVENTORY]),
  ]) as unknown[][];
  if (results[2].length !== selected.length) throw new ApiError(409, '田地或宝箱库存已变化，请刷新后重试。');
  const first = rewards[0];
  return { ...(await gardenPayload(playerId)),
    harvest: first.seedType === 'plant'
      ? { seedType: 'plant', targetItem: first.targetItem, shards: first.amount, recycledSeed: first.recycled }
      : { seedType: 'chest', chestType: first.chestType, chestId: first.chestId },
    harvestSummary: { harvestedCount: selected.length, plantCount: plants.length, chestCount: selectedChests.length,
      shards, recycledSeeds, chestTypes, skippedChestCount: chestPlots.length-selectedChests.length } };
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
      const spent = await sql`WITH paid AS (
          UPDATE player_wallet SET coins=coins - ${PLOT_UNLOCK_COST}, updated_at=NOW()
          WHERE player_id=${playerId} AND coins >= ${PLOT_UNLOCK_COST} RETURNING player_id
        ) UPDATE player_garden SET unlocked_plots=unlocked_plots + 1,updated_at=NOW()
          FROM paid WHERE player_garden.player_id=paid.player_id RETURNING paid.player_id`;
      if (spent.length === 0) return res.status(400).json({ error: 'COINS_NOT_ENOUGH' });
      return res.json(await gardenPayload(playerId));
    }

    if (action === 'upgrade') {
      const upgradeType = req.body?.upgradeType;
      if (upgradeType !== 'efficiency' && upgradeType !== 'luck') return res.status(400).json({ error: 'invalid upgrade' });
      const column = upgradeType === 'efficiency' ? 'efficiency_level' : 'luck_level';
      const maxLevel = upgradeType === 'efficiency' ? MAX_EFFICIENCY_LEVEL : MAX_LUCK_LEVEL;
      const results = await sql.transaction(tx => [
        tx`SELECT player_id FROM player_wallet WHERE player_id=${playerId} FOR UPDATE`,
        tx`SELECT player_id FROM player_garden WHERE player_id=${playerId} FOR UPDATE`,
        tx.query(`WITH current_level AS (
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
        RETURNING garden.${column} AS level`, [playerId, maxLevel]),
      ]) as Array<Array<Record<string, unknown>>>;
      const upgraded = results[2];
      if (upgraded.length === 0) {
        const statusRows = await sql.query(`SELECT garden.${column} AS level, wallet.experience
          FROM player_garden garden JOIN player_wallet wallet ON wallet.player_id=garden.player_id
          WHERE garden.player_id=$1`, [playerId]);
        if (Number(statusRows[0]?.level ?? 1) >= maxLevel) return res.status(400).json({ error: 'MAX_LEVEL' });
        return res.status(400).json({ error: 'EXPERIENCE_NOT_ENOUGH' });
      }
      return res.json(await gardenPayload(playerId));
    }

    if (action === 'plant' || action === 'plantAll') {
      const plotIndex = action === 'plant' ? Math.floor(Number(req.body?.plotIndex)) : null;
      const seedType = req.body?.seedType;
      if ((plotIndex !== null && (!Number.isFinite(plotIndex) || plotIndex < 0)) || (seedType !== 'plant' && seedType !== 'chest')) {
        return res.status(400).json({ error: 'invalid planting request' });
      }
      const seedColumn = seedType === 'plant' ? 'plant_seeds' : 'chest_seeds';
      const baseGrowSeconds = seedType === 'plant' ? PLANT_GROW_SECONDS : CHEST_GROW_SECONDS;
      // Both single and bulk planting lock the same garden row. Debit only the
      // plots actually inserted, so concurrent requests cannot waste seeds.
      const results = await sql.transaction(tx => [
        tx`SELECT plant_seeds, chest_seeds, unlocked_plots FROM player_garden WHERE player_id=${playerId} FOR UPDATE`,
        tx.query(`WITH current_garden AS (
            SELECT * FROM player_garden WHERE player_id=$1
          ), empty_plots AS (
            SELECT generated.plot_index
            FROM current_garden CROSS JOIN LATERAL generate_series(0, unlocked_plots - 1) AS generated(plot_index)
            WHERE ($3::integer IS NULL OR generated.plot_index=$3::integer)
              AND NOT EXISTS (SELECT 1 FROM garden_plots WHERE player_id=$1 AND plot_index=generated.plot_index)
            ORDER BY generated.plot_index
            LIMIT (SELECT GREATEST(0, ${seedColumn}) FROM current_garden)
          ), planted AS (
            INSERT INTO garden_plots (player_id, plot_index, seed_type, target_item, ready_at)
            SELECT $1, empty_plots.plot_index, $2::text,
              CASE WHEN $2::text='plant' THEN $5::jsonb->>(floor(random() * jsonb_array_length($5::jsonb)))::integer ELSE NULL END,
              NOW() + GREATEST(1, round($4::integer * (1 - (GREATEST(1, LEAST($6::integer, efficiency_level)) - 1) * 0.01))) * INTERVAL '1 second'
            FROM empty_plots CROSS JOIN current_garden WHERE TRUE
            ON CONFLICT (player_id, plot_index) DO NOTHING RETURNING plot_index
          ), deducted AS (
            UPDATE player_garden SET ${seedColumn}=${seedColumn} - (SELECT COUNT(*) FROM planted), updated_at=NOW()
            WHERE player_id=$1 AND EXISTS (SELECT 1 FROM planted) RETURNING player_id
          ) SELECT plot_index FROM planted ORDER BY plot_index`,
        [playerId, seedType, plotIndex, baseGrowSeconds, JSON.stringify(UPGRADEABLE_PLANTS), MAX_EFFICIENCY_LEVEL]),
      ]) as [GardenRow[], { plot_index: number | string }[]];
      const garden = results[0][0];
      if (!garden || (plotIndex !== null && plotIndex >= Number(garden.unlocked_plots ?? BASE_PLOTS))) {
        return res.status(400).json({ error: 'plot locked' });
      }
      const seedCount = seedType === 'plant' ? Number(garden.plant_seeds ?? 0) : Number(garden.chest_seeds ?? 0);
      if (seedCount < 1) return res.status(400).json({ error: 'SEEDS_NOT_ENOUGH' });
      if (results[1].length === 0) return res.status(400).json({ error: plotIndex === null ? 'NO_EMPTY_PLOTS' : 'plot occupied' });
      return res.json({ ...(await gardenPayload(playerId)), plantingSummary: { seedType, plantedCount: results[1].length } });
    }

    if (action === 'harvestAll') return res.json(await harvestPlots(playerId, null));
    if (action === 'harvest') {
      const plotIndex = Math.floor(Number(req.body?.plotIndex));
      if (!Number.isFinite(plotIndex) || plotIndex < 0) return res.status(400).json({ error: 'invalid plot' });
      return res.json(await harvestPlots(playerId, plotIndex));
    }

    return res.status(400).json({ error: 'bad action' });
  } catch (error: unknown) {
    if (!(error instanceof ApiError)) console.error(error);
    return res.status(error instanceof ApiError ? error.status : 500).json({ error: getErrorMessage(error) });
  }
}
