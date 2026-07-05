import type { VercelRequest, VercelResponse } from '@vercel/node';
import { splitShardInventory } from '../shared/shards.js';
import { LEVEL_UNLOCK_REQUIREMENTS } from '../shared/unlocks.js';
import { CHEST_REWARD_CONFIG, REPEAT_CLEAR_COIN_MULTIPLIER, getRepeatClearChestChance, getStarRewardConfig } from '../shared/rewards.js';
import { createId, ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { getErrorMessage } from './_errors.js';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseLevelNumber(levelId: string) {
  const levelNum = Number(String(levelId || '').replace(/^L/i, ''));
  return Number.isNaN(levelNum) ? null : levelNum;
}

type ProgressRow = { level_id: string; max_star: number | string };
type WalletRow = { coins?: number | string; magic_keys?: number | string };
type ShardRow = { tower_type: string; shards: number | string };
type TowerLevelRow = { tower_type: string; level: number | string };
type UnlockedItemRow = { item_id: string };

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

      const [prog, wallet, shards, levels, chests, unlockedRows] = await Promise.all([
        sql`SELECT level_id, max_star FROM player_progress WHERE player_id=${playerId}`,
        sql`SELECT coins, magic_keys FROM player_wallet WHERE player_id=${playerId}`,
        sql`SELECT tower_type, shards FROM inventory_shards WHERE player_id=${playerId}`,
        sql`SELECT tower_type, level FROM tower_levels WHERE player_id=${playerId}`,
        sql`SELECT chest_id, status, awarded_at, unlock_start_at, unlock_ready_at, duration_seconds, chest_type FROM chests WHERE player_id=${playerId} ORDER BY awarded_at DESC LIMIT 50`,
        sql`SELECT item_id FROM unlocked_items WHERE player_id=${playerId} AND unlocked=true`,
      ]);

      const stars: Record<string, number> = {};
      (prog as ProgressRow[]).forEach(r => stars[r.level_id] = Number(r.max_star));
      const coins = Number((wallet as WalletRow[])[0]?.coins ?? 0);
      const magicKeys = Number((wallet as WalletRow[])[0]?.magic_keys ?? 0);
      const shardInv: Record<string, number> = {};
      (shards as ShardRow[]).forEach(r => shardInv[r.tower_type] = Number(r.shards));
      const splitShards = splitShardInventory(shardInv);
      const towerLv: Record<string, number> = {};
      (levels as TowerLevelRow[]).forEach(r => towerLv[r.tower_type] = Number(r.level));
      const unlockedItems = (unlockedRows as UnlockedItemRow[]).map(r => r.item_id);

      let unlocked = 1;
      for (let i = 1; i <= 52; i++) {
        const star = stars[`L${i}`];
        if (star !== undefined && star > 0) {
          unlocked = i + 1;
        } else {
          break;
        }
      }

      return res.json({ stars, coins, magicKeys, shards: shardInv, ...splitShards, towerLevels: towerLv, chests, unlocked, unlockedItems });
    }

    if (req.method === 'POST') {
      const pid = getRequiredPlayerId(req, res);
      if (!pid) return;
      await ensurePlayer(pid);

      const { action } = req.body || {};

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

      if (action === 'setStar') {
        const { levelId, star } = req.body as { levelId?: string; star?: number };
        const parsedStar = Number(star);
        if (!levelId || ![1, 2, 3].includes(parsedStar)) return res.status(400).json({ error: 'params' });

        const cur = await sql`SELECT max_star FROM player_progress WHERE player_id=${pid} AND level_id=${levelId}`;
        const prev = Number((cur as ProgressRow[])[0]?.max_star ?? 0);
        const next = Math.max(prev, parsedStar);

        await sql`INSERT INTO player_progress (player_id, level_id, max_star) VALUES (${pid}, ${levelId}, ${next})
          ON CONFLICT (player_id, level_id) DO UPDATE SET max_star=excluded.max_star, updated_at=NOW()`;

        const newUnlocks: string[] = [];
        const levelNum = parseLevelNumber(levelId);
        if (levelNum !== null) {
          for (const rule of LEVEL_UNLOCK_REQUIREMENTS) {
            if (rule.level === levelNum && next >= rule.star) {
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
        const chestType = rewardConfig.chestType;
        const newRecord = next > prev;
        const repeatOneStar = !newRecord && parsedStar === 1;
        const baseRewardCoins = randInt(rewardConfig.coins.min, rewardConfig.coins.max);
        const rewardCoins = (newRecord || repeatOneStar)
          ? baseRewardCoins
          : Math.max(1, Math.floor(baseRewardCoins * REPEAT_CLEAR_COIN_MULTIPLIER));
        const repeatChestChance = repeatOneStar ? 1 : getRepeatClearChestChance(levelNum);
        const chestAwarded = newRecord || repeatOneStar || Math.random() < repeatChestChance;

        if (levelNum === 4 && parsedStar >= 1 && prev === 0) {
          rewardMagicKeys = 1;
        }

        await sql`UPDATE player_wallet SET coins = coins + ${rewardCoins}, magic_keys = magic_keys + ${rewardMagicKeys}, updated_at=NOW()
          WHERE player_id=${pid}`;

        let chestId: string | null = null;
        if (chestAwarded) {
          const chestConfig = CHEST_REWARD_CONFIG[chestType];
          const chestCoinReward = randInt(chestConfig.coins.min, chestConfig.coins.max);
          chestId = createId('c');
          await sql`INSERT INTO chests (chest_id, player_id, status, duration_seconds, chest_type, coin_reward)
            VALUES (${chestId}, ${pid}, 'locked', ${chestConfig.unlockSeconds}, ${chestType}, ${chestCoinReward})`;
        }

        return res.json({
          ok: true,
          star: next,
          rewardCoins,
          rewardMagicKeys,
          chestId,
          chestType: chestAwarded ? chestType : null,
          chestAwarded,
          repeatChestChance,
          previousStar: prev,
          newRecord,
          newUnlocks,
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
