import type { VercelRequest, VercelResponse } from '@vercel/node';
import { splitShardInventory } from '../shared/shards.js';
import { LEVEL_UNLOCK_REQUIREMENTS } from '../shared/unlocks.js';
import { CHEST_REWARD_CONFIG, MAX_CHEST_INVENTORY, REPEAT_CLEAR_COIN_MULTIPLIER, getEndlessModeReward, getRepeatClearChestRewardConfig, getStarRewardConfig, type ChestType } from '../shared/rewards.js';
import { createId, ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { getErrorMessage } from './_errors.js';
import { recordPlayerTaskEvent } from './tasks.js';
import { getEndlessModeMinimumDurationSeconds } from '../shared/endless.js';
import { endlessRankingSettlementQueries, settleEndlessRanking } from './_endlessRanking.js';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseLevelNumber(levelId: string) {
  const levelNum = Number(String(levelId || '').replace(/^L/i, ''));
  return Number.isNaN(levelNum) ? null : levelNum;
}

function readDbBoolean(value: unknown) {
  return value === true || value === 'true' || value === 1;
}

function readNotificationPayload(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== 'string') return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

type ProgressRow = { level_id: string; max_star: number | string; in_full_health_clear?: boolean | string | number | null; at_cleared?: boolean | string | number | null };
type WalletRow = { coins?: number | string; magic_keys?: number | string; diamonds?: number | string; experience?: number | string };
type ShardRow = { tower_type: string; shards: number | string };
type TowerLevelRow = { tower_type: string; level: number | string };
type UnlockedItemRow = { item_id: string };
type NotificationRow = { notification_id: string; notification_type: string; payload: unknown };
type EndlessClaimRow = {
  waves_cleared: number | string;
  reward_coins: number | string;
  chest_types: unknown;
  chest_inventory_full: boolean | string | number;
  claim_status: string;
  elapsed_seconds?: number | string;
};

function endlessRewardResponse(row: EndlessClaimRow) {
  return {
    ok: true,
    wavesCleared: Number(row.waves_cleared),
    rewardCoins: Number(row.reward_coins),
    chestTypes: Array.isArray(row.chest_types) ? row.chest_types as string[] : [],
    chestInventoryFull: readDbBoolean(row.chest_inventory_full),
  };
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

    if (req.method === 'GET') {
      const playerId = getRequiredPlayerId(req, res);
      if (!playerId) return;
      await ensurePlayer(playerId);
      await settleEndlessRanking();

      const [prog, wallet, shards, levels, chests, unlockedRows] = await Promise.all([
        sql`SELECT level_id, max_star, in_full_health_clear, at_cleared FROM player_progress WHERE player_id=${playerId}`,
        sql`SELECT coins, magic_keys, diamonds, experience FROM player_wallet WHERE player_id=${playerId}`,
        sql`SELECT tower_type, shards FROM inventory_shards WHERE player_id=${playerId}`,
        sql`SELECT tower_type, level FROM tower_levels WHERE player_id=${playerId}`,
        sql`SELECT chest_id, status, awarded_at, unlock_start_at, unlock_ready_at, duration_seconds, chest_type FROM chests WHERE player_id=${playerId} ORDER BY awarded_at DESC LIMIT 50`,
        sql`SELECT item_id FROM unlocked_items WHERE player_id=${playerId} AND unlocked=true`,
      ]);

      const stars: Record<string, number> = {};
      const fullHealthClears: Record<string, boolean> = {};
      const atClears: Record<string, boolean> = {};
      (prog as ProgressRow[]).forEach(r => stars[r.level_id] = Number(r.max_star));
      (prog as ProgressRow[]).forEach(r => {
        if (readDbBoolean(r.in_full_health_clear)) {
          fullHealthClears[r.level_id] = true;
        }
        if (readDbBoolean(r.at_cleared)) {
          atClears[r.level_id] = true;
        }
      });
      const coins = Number((wallet as WalletRow[])[0]?.coins ?? 0);
      const magicKeys = Number((wallet as WalletRow[])[0]?.magic_keys ?? 0);
      const diamonds = Number((wallet as WalletRow[])[0]?.diamonds ?? 0);
      const experience = Number((wallet as WalletRow[])[0]?.experience ?? 0);
      const shardInv: Record<string, number> = {};
      (shards as ShardRow[]).forEach(r => shardInv[r.tower_type] = Number(r.shards));
      const splitShards = splitShardInventory(shardInv);
      const towerLv: Record<string, number> = {};
      (levels as TowerLevelRow[]).forEach(r => towerLv[r.tower_type] = Number(r.level));
      const unlockedItems = (unlockedRows as UnlockedItemRow[]).map(r => r.item_id);

      let unlocked = 1;
      for (let i = 1; i <= 60; i++) {
        const star = stars[`L${i}`];
        if (star !== undefined && star > 0) {
          unlocked = i + 1;
        } else {
          break;
        }
      }

      return res.json({ stars, fullHealthClears, atClears, coins, magicKeys, diamonds, experience, shards: shardInv, ...splitShards, towerLevels: towerLv, chests, unlocked, unlockedItems });
    }

    if (req.method === 'POST') {
      const pid = getRequiredPlayerId(req, res);
      if (!pid) return;
      await ensurePlayer(pid);

      const { action } = req.body || {};

      if (action === 'deleteAccount') {
        if (req.body?.confirm !== true) return res.status(400).json({ error: 'confirmation required' });
        const existing = await sql`SELECT player_id FROM players WHERE player_id=${pid}`;
        if (existing.length === 0) return res.status(404).json({ error: 'account not found' });

        await sql.transaction(tx => [
          tx`DELETE FROM level_submissions WHERE player_id=${pid}`,
          tx`DELETE FROM player_daily_level_submission_limits WHERE player_id=${pid}`,
          tx`DELETE FROM player_release_reads WHERE player_id=${pid}`,
          tx`DELETE FROM player_notifications WHERE player_id=${pid}`,
          tx`DELETE FROM garden_plots WHERE player_id=${pid}`,
          tx`DELETE FROM player_garden WHERE player_id=${pid}`,
          tx`DELETE FROM player_study_progress WHERE player_id=${pid}`,
          tx`DELETE FROM player_task_progress WHERE player_id=${pid}`,
          tx`DELETE FROM chests WHERE player_id=${pid}`,
          tx`DELETE FROM shop_purchases WHERE player_id=${pid}`,
          tx`DELETE FROM endless_mode_claims WHERE player_id=${pid}`,
          tx`DELETE FROM endless_weekly_records WHERE player_id=${pid}`,
          tx`DELETE FROM unlocked_items WHERE player_id=${pid}`,
          tx`DELETE FROM tower_levels WHERE player_id=${pid}`,
          tx`DELETE FROM inventory_shards WHERE player_id=${pid}`,
          tx`DELETE FROM player_progress WHERE player_id=${pid}`,
          tx`DELETE FROM player_wallet WHERE player_id=${pid}`,
          tx`DELETE FROM user_accounts WHERE player_id=${pid}`,
          tx`DELETE FROM players WHERE player_id=${pid}`,
        ]);
        return res.json({ ok: true });
      }

      if (action === 'getNextNotification') {
        await settleEndlessRanking();
        const rows = await sql`
          SELECT notification_id, notification_type, payload
          FROM player_notifications
          WHERE player_id=${pid} AND read_at IS NULL
          ORDER BY created_at ASC
          LIMIT 1
        `;
        const notification = rows[0] as NotificationRow | undefined;
        if (!notification) return res.json({ notification: null });
        return res.json({
          notification: {
            id: String(notification.notification_id),
            type: String(notification.notification_type),
            payload: readNotificationPayload(notification.payload),
          },
        });
      }

      if (action === 'markNotificationRead') {
        const notificationId = typeof req.body?.notificationId === 'string' ? req.body.notificationId.trim() : '';
        if (!notificationId || notificationId.length > 120) return res.status(400).json({ error: 'invalid notification id' });
        const deleted = await sql`
          DELETE FROM player_notifications
          WHERE notification_id=${notificationId} AND player_id=${pid}
          RETURNING notification_id
        `;
        return res.json({ ok: true, marked: deleted.length > 0 });
      }

      if (action === 'unlockWithKey') {
        const { levelId } = req.body as { levelId?: string };
        if (!levelId) return res.status(400).json({ error: 'params' });

        const wallet = await sql`SELECT magic_keys FROM player_wallet WHERE player_id=${pid}`;
        const keys = Number((wallet as WalletRow[])[0]?.magic_keys ?? 0);
        if (keys < 1) return res.status(400).json({ error: 'not enough keys' });

        const prog = await sql`SELECT max_star FROM player_progress WHERE player_id=${pid} AND level_id=${levelId}`;
        if (Number((prog as ProgressRow[])[0]?.max_star ?? 0) > 0) {
          return res.status(400).json({ error: 'already unlocked' });
        }

        const spent = await sql`UPDATE player_wallet SET magic_keys = magic_keys - 1, updated_at=NOW()
          WHERE player_id=${pid} AND magic_keys >= 1 RETURNING magic_keys`;
        if (spent.length === 0) return res.status(400).json({ error: 'not enough keys' });

        await sql`INSERT INTO player_progress (player_id, level_id, max_star) VALUES (${pid}, ${levelId}, 0)
          ON CONFLICT (player_id, level_id) DO NOTHING`;

        return res.json({ ok: true, remainingKeys: Number(spent[0].magic_keys ?? 0) });
      }

      if (action === 'startEndlessRun') {
        const runId = createId('endless');
        await sql`INSERT INTO endless_mode_claims (player_id, run_id)
          VALUES (${pid}, ${runId})
          ON CONFLICT (player_id) DO UPDATE SET run_id=excluded.run_id,
            claim_status='active', started_at=NOW(), waves_cleared=0, reward_coins=0,
            chest_types='[]'::jsonb, chest_inventory_full=FALSE`;
        return res.json({ ok: true, runId });
      }

      if (action === 'abandonEndlessRun') {
        const runId = typeof req.body?.runId === 'string' ? req.body.runId : '';
        await sql`DELETE FROM endless_mode_claims WHERE player_id=${pid} AND run_id=${runId} AND claim_status='active'`;
        return res.json({ ok: true });
      }

      if (action === 'claimEndlessReward') {
        const runId = typeof req.body?.runId === 'string' ? req.body.runId.trim() : '';
        if (!/^endless_[0-9a-f-]{36}$/i.test(runId)) {
          return res.status(400).json({ error: 'invalid runId' });
        }
        const parsedWaves = Number(req.body?.wavesCleared);
        if (!Number.isInteger(parsedWaves) || parsedWaves < 0 || parsedWaves > 1000000) {
          return res.status(400).json({ error: 'invalid wavesCleared' });
        }

        const existingRows = await sql`SELECT waves_cleared, reward_coins, chest_types, chest_inventory_full, claim_status,
            EXTRACT(EPOCH FROM (NOW() - started_at)) AS elapsed_seconds
          FROM endless_mode_claims WHERE player_id=${pid} AND run_id=${runId}`;
        const existing = existingRows[0] as EndlessClaimRow | undefined;
        if (!existing) return res.status(409).json({ error: '无尽记录已失效，请勿同时开启多局无尽游戏' });
        if (existing.claim_status === 'complete') {
          return res.json({ ...endlessRewardResponse(existing), alreadyClaimed: true });
        }
        if (getEndlessModeMinimumDurationSeconds(parsedWaves) > Number(existing.elapsed_seconds) + 1) {
          return res.status(400).json({ error: 'invalid run duration' });
        }

        const reward = getEndlessModeReward(parsedWaves);
        const chestOffers = reward.chestTypes.map(chestType => {
          const config = CHEST_REWARD_CONFIG[chestType];
          return { chest_id: createId('c'), chest_type: chestType,
            duration_seconds: config.unlockSeconds, coin_reward: randInt(config.coins.min, config.coins.max) };
        });
        // Serialize the weekly rollover before locking the wallet. Claim, rewards
        // and the best score commit together, so retries cannot grant twice.
        const results = await sql.transaction(tx => [
          ...endlessRankingSettlementQueries(tx),
          tx`SELECT player_id FROM player_wallet WHERE player_id=${pid} FOR UPDATE`,
          tx`WITH capacity AS (
              SELECT GREATEST(0, ${MAX_CHEST_INVENTORY} - COUNT(*)) AS slots FROM chests WHERE player_id=${pid}
            ), offers AS (
              SELECT value, ordinality FROM jsonb_array_elements(${JSON.stringify(chestOffers)}::jsonb) WITH ORDINALITY
            ), allocated AS (
              SELECT COALESCE(jsonb_agg(value->'chest_type' ORDER BY ordinality), '[]'::jsonb) AS chest_types
              FROM offers WHERE ordinality <= (SELECT slots FROM capacity)
            ), finished AS (
              UPDATE endless_mode_claims SET claim_status='complete', waves_cleared=${reward.wavesCleared},
                reward_coins=${reward.coins}, chest_types=allocated.chest_types,
                chest_inventory_full=(${reward.chestTypes.length} > (SELECT slots FROM capacity))
              FROM allocated WHERE player_id=${pid} AND run_id=${runId} AND claim_status='active'
              RETURNING endless_mode_claims.*
            ), credited AS (
              UPDATE player_wallet SET coins=coins+finished.reward_coins, updated_at=NOW()
              FROM finished WHERE player_wallet.player_id=finished.player_id RETURNING player_wallet.player_id
            ), awarded AS (
              INSERT INTO chests (chest_id, player_id, status, duration_seconds, chest_type, coin_reward)
              SELECT value->>'chest_id', finished.player_id, 'locked', (value->>'duration_seconds')::integer,
                value->>'chest_type', (value->>'coin_reward')::bigint
              FROM offers CROSS JOIN finished CROSS JOIN credited
              WHERE ordinality <= (SELECT slots FROM capacity) RETURNING chest_id
            ), ranked AS (
              INSERT INTO endless_weekly_records (player_id, best_waves, achieved_at)
              SELECT player_id, waves_cleared, transaction_timestamp() FROM finished WHERE waves_cleared > 0
              ON CONFLICT (player_id) DO UPDATE SET best_waves=EXCLUDED.best_waves, achieved_at=EXCLUDED.achieved_at
                WHERE endless_weekly_records.best_waves < EXCLUDED.best_waves
              RETURNING player_id
            )
            SELECT waves_cleared, reward_coins, chest_types, chest_inventory_full, claim_status FROM finished
            UNION ALL
            SELECT waves_cleared, reward_coins, chest_types, chest_inventory_full, claim_status
              FROM endless_mode_claims WHERE player_id=${pid} AND run_id=${runId} AND claim_status='complete'
              AND NOT EXISTS (SELECT 1 FROM finished)`,
        ]) as unknown[];
        const settled = (results[results.length - 1] as EndlessClaimRow[])[0];
        if (!settled) return res.status(409).json({ error: '无尽记录已失效，请勿同时开启多局无尽游戏' });
        return res.json(endlessRewardResponse(settled));
      }

      if (action === 'setStar') {
        const { levelId, star, fullHealth, difficulty, challengeDiamonds } = req.body as { levelId?: string; star?: number; fullHealth?: boolean; difficulty?: string; challengeDiamonds?: number };
        const parsedStar = Number(star);
        if (!levelId || ![1, 2, 3].includes(parsedStar)) return res.status(400).json({ error: 'params' });
        const isAtClear = difficulty === 'AT';
        const fullHealthClear = parsedStar === 3 && Boolean(fullHealth);
        const challengeDiamondReward = Math.round(Math.max(0, Math.min(3, Number(challengeDiamonds) || 0)) * 2) / 2;

        const cur = await sql`SELECT max_star, in_full_health_clear, at_cleared FROM player_progress WHERE player_id=${pid} AND level_id=${levelId}`;
        const prev = Number((cur as ProgressRow[])[0]?.max_star ?? 0);
        const next = Math.max(prev, parsedStar);
        const hadFullHealthClear = readDbBoolean((cur as ProgressRow[])[0]?.in_full_health_clear);
        const hadAtClear = readDbBoolean((cur as ProgressRow[])[0]?.at_cleared);
        const nextFullHealthClear = hadFullHealthClear || fullHealthClear;
        const newFullHealthClear = fullHealthClear && !hadFullHealthClear;
        const nextAtClear = hadAtClear || isAtClear;

        await sql`INSERT INTO player_progress (player_id, level_id, max_star, in_full_health_clear, at_cleared) VALUES (${pid}, ${levelId}, ${next}, ${nextFullHealthClear}, ${nextAtClear})
          ON CONFLICT (player_id, level_id) DO UPDATE SET max_star=excluded.max_star, in_full_health_clear=(player_progress.in_full_health_clear OR excluded.in_full_health_clear), at_cleared=(player_progress.at_cleared OR excluded.at_cleared), updated_at=NOW()`;

        const newUnlocks: string[] = [];
        const levelNum = parseLevelNumber(levelId);
        if (levelNum !== null) {
          for (const rule of LEVEL_UNLOCK_REQUIREMENTS) {
            const difficultyMatched = isAtClear
              ? rule.difficulty === 'AT'
              : rule.difficulty === difficulty;
            if (rule.level === levelNum && difficultyMatched) {
              const existed = await sql`SELECT unlocked FROM unlocked_items WHERE player_id=${pid} AND item_id=${rule.itemId}`;
              const isUnlocked = Boolean(existed[0]?.unlocked);
              if (!isUnlocked) {
                await sql`INSERT INTO unlocked_items (player_id, item_id, unlocked, unlocked_at)
                  VALUES (${pid}, ${rule.itemId}, TRUE, NOW())
                  ON CONFLICT (player_id, item_id) DO UPDATE SET unlocked=TRUE, unlocked_at=NOW()`;
                newUnlocks.push(rule.itemId);
              }
            }
          }
        }

        let rewardMagicKeys = 0;
        const rewardConfig = getStarRewardConfig(parsedStar);
        const atFirstClear = isAtClear && !hadAtClear;
        const newRecord = isAtClear ? atFirstClear : next > prev;
        const repeatOneStar = !newRecord && parsedStar === 1;
        const baseRewardCoins = atFirstClear
          ? randInt(5000, 8000)
          : randInt(rewardConfig.coins.min, rewardConfig.coins.max);
        const rewardCoins = (newRecord || repeatOneStar)
          ? baseRewardCoins
          : Math.max(1, Math.floor(baseRewardCoins * REPEAT_CLEAR_COIN_MULTIPLIER));
        const repeatChestConfig = getRepeatClearChestRewardConfig(difficulty, parsedStar);
        const repeatChestTypes: ChestType[] = [
          ...repeatChestConfig.guaranteed,
          ...repeatChestConfig.bonus
            .filter(reward => Math.random() < reward.chance)
            .map(reward => reward.chestType),
        ];
        const requestedChestTypes: ChestType[] = atFirstClear
          ? ['epic', 'epic', 'legendary']
          : newRecord
            ? [rewardConfig.chestType]
            : repeatChestTypes;
        const diamondReward = challengeDiamondReward + (atFirstClear ? 1 : 0);

        if (levelNum === 4 && parsedStar >= 1 && prev === 0) {
          rewardMagicKeys = 1;
        }

        await sql`UPDATE player_wallet SET coins = coins + ${rewardCoins}, magic_keys = magic_keys + ${rewardMagicKeys}, diamonds = diamonds + ${diamondReward}, updated_at=NOW()
          WHERE player_id=${pid}`;

        try {
          await recordPlayerTaskEvent(pid, 'levelClear');
        } catch (taskError) {
          console.error('Failed to record level clear task', taskError);
        }

        const chestCountRows = await sql`SELECT COUNT(*)::int AS count FROM chests WHERE player_id=${pid}`;
        const chestCount = Number(chestCountRows[0]?.count ?? 0);
        const chestCapacity = Math.max(0, MAX_CHEST_INVENTORY - chestCount);
        const chestTypes = requestedChestTypes.slice(0, chestCapacity);
        let chestId: string | null = null;
        for (const awardedChestType of chestTypes) {
          const chestConfig = CHEST_REWARD_CONFIG[awardedChestType];
          const chestCoinReward = randInt(chestConfig.coins.min, chestConfig.coins.max);
          const nextChestId = createId('c');
          if (!chestId) chestId = nextChestId;
          await sql`INSERT INTO chests (chest_id, player_id, status, duration_seconds, chest_type, coin_reward)
            VALUES (${nextChestId}, ${pid}, 'locked', ${chestConfig.unlockSeconds}, ${awardedChestType}, ${chestCoinReward})`;
        }
        return res.json({
          ok: true,
          star: next,
          rewardCoins,
          rewardMagicKeys,
          diamondReward,
          chestId,
          chestType: chestTypes[0] ?? null,
          chestTypes,
          chestAwarded: chestTypes.length > 0,
          chestInventoryFull: requestedChestTypes.length > chestTypes.length,
          previousStar: prev,
          newRecord,
          atFirstClear,
          atCleared: nextAtClear,
          newUnlocks,
          fullHealthClear: nextFullHealthClear,
          newFullHealthClear,
        });
      }

      return res.status(400).json({ error: 'bad action' });
    }

    return res.status(405).json({ error: 'method' });
  } catch (e: unknown) {
    console.error(e);
    return res.status(500).json({ error: getErrorMessage(e) });
  }
}
