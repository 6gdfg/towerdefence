import type { VercelRequest, VercelResponse } from '@vercel/node';
import { splitShardInventory } from '../shared/shards.js';
import { CHEST_REWARD_CONFIG, MAX_CHEST_INVENTORY, getEndlessModeReward } from '../shared/rewards.js';
import { createId, ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { getErrorMessage } from './_errors.js';
import { recordPlayerTaskEvent } from './tasks.js';
import { getEndlessModeMinimumDurationSeconds } from '../shared/endless.js';
import { endlessRankingSettlementQueries, settleEndlessRanking } from './_endlessRanking.js';
import { settleCampaignClear } from './_campaignSettlement.js';
import { findCampaignDraft, startCampaignRun, validateCampaignClear } from './_campaignRuns.js';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
        if (!findCampaignDraft(levelId, 'EZ')) return res.status(400).json({ error: 'invalid level' });

        const results = await sql.transaction(tx => [
          tx`SELECT player_id FROM player_wallet WHERE player_id=${pid} FOR UPDATE`,
          tx`WITH unlocked AS (
              INSERT INTO player_progress(player_id,level_id,max_star)
              SELECT player_id,${levelId},0 FROM player_wallet WHERE player_id=${pid} AND magic_keys>=1
              ON CONFLICT(player_id,level_id) DO NOTHING RETURNING player_id
            ) UPDATE player_wallet SET magic_keys=magic_keys-1,updated_at=NOW()
              FROM unlocked WHERE player_wallet.player_id=unlocked.player_id RETURNING magic_keys`,
        ]) as Array<Array<Record<string, unknown>>>;
        if (!results[1].length) return res.status(400).json({ error: 'already unlocked or not enough keys' });
        return res.json({ ok: true, remainingKeys: Number(results[1][0].magic_keys) });
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
        const validated = await validateCampaignClear(pid, req.body ?? {});
        if ('error' in validated) return res.status(validated.status).json({ error: validated.error });
        if ('cached' in validated) return res.json(validated.cached);
        const settled = await settleCampaignClear(validated.request);
        if (!settled.duplicate) {
          try {
            await recordPlayerTaskEvent(pid, 'levelClear');
          } catch (taskError) {
            console.error('Failed to record level clear task', taskError);
          }
        }
        return res.json(settled.response);
      }

      if (action === 'startCampaignRun') {
        const started = await startCampaignRun(pid, req.body ?? {});
        if ('error' in started) return res.status(started.status).json({ error: started.error });
        return res.json({ ok: true, runId: started.runId });
      }

      return res.status(400).json({ error: 'bad action' });
    }

    return res.status(405).json({ error: 'method' });
  } catch (e: unknown) {
    console.error(e);
    return res.status(500).json({ error: getErrorMessage(e) });
  }
}
