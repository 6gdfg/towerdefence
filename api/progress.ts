import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

// === Inline DB utilities ===
function getDbUrl() {
  if (typeof process === 'undefined' || !process.env) return '';
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || '';
}

let _sql: any = null;
function getSql() {
  if (!_sql) {
    const CONN = getDbUrl();
    if (!CONN) throw new Error('No DB URL configured');
    _sql = neon(CONN);
  }
  return _sql;
}

const DEFAULT_UNLOCKED_ITEMS = ['sunflower', 'bottleGrass'] as const;
const UNLOCK_RULES: Array<{ level: number; star: 1|2|3; itemId: string }> = [
  { level: 1, star: 1, itemId: 'element:fire' },
  { level: 3, star: 3, itemId: 'fourLeafClover' },
  { level: 6, star: 3, itemId: 'element:wind' },
  { level: 15, star: 3, itemId: 'machineGun' },
  { level: 20, star: 3, itemId: 'element:ice' },
  { level: 23, star: 3, itemId: 'sniper' },
  { level: 27, star: 3, itemId: 'element:electric' },
  { level: 30, star: 3, itemId: 'element:gold' },
];

let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured) return;
  const sql = getSql();
  await Promise.all([
    sql`CREATE TABLE IF NOT EXISTS players (player_id TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW())`,
    sql`CREATE TABLE IF NOT EXISTS player_progress (player_id TEXT, level_id TEXT, max_star INTEGER CHECK (max_star BETWEEN 0 AND 3), updated_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY (player_id, level_id))`,
    sql`CREATE TABLE IF NOT EXISTS player_wallet (player_id TEXT PRIMARY KEY, coins BIGINT DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW())`,
    sql`CREATE TABLE IF NOT EXISTS inventory_shards (player_id TEXT, tower_type TEXT, shards BIGINT DEFAULT 0, PRIMARY KEY (player_id, tower_type))`,
    sql`CREATE TABLE IF NOT EXISTS tower_levels (player_id TEXT, tower_type TEXT, level INTEGER DEFAULT 1, PRIMARY KEY (player_id, tower_type))`,
    sql`CREATE TABLE IF NOT EXISTS chests (chest_id TEXT PRIMARY KEY, player_id TEXT, status TEXT CHECK (status IN ('locked','unlocking','ready','opened')) DEFAULT 'locked', awarded_at TIMESTAMPTZ DEFAULT NOW(), unlock_start_at TIMESTAMPTZ, unlock_ready_at TIMESTAMPTZ, duration_seconds INTEGER DEFAULT 3600, chest_type TEXT DEFAULT 'common' CHECK (chest_type IN ('common','rare','epic')), coin_reward INTEGER DEFAULT 0, open_result JSONB)`,
    sql`CREATE TABLE IF NOT EXISTS unlocked_items (player_id TEXT, item_id TEXT, unlocked BOOLEAN DEFAULT TRUE, unlocked_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY (player_id, item_id))`
  ]);
  tablesEnsured = true;
}

async function ensureDefaultUnlocks(playerId: string) {
  const sql = getSql();
  for (const item of DEFAULT_UNLOCKED_ITEMS) {
    await sql`INSERT INTO unlocked_items (player_id, item_id, unlocked) VALUES (${playerId}, ${item}, TRUE)
      ON CONFLICT (player_id, item_id) DO NOTHING`;
  }
}

async function ensurePlayer(playerId: string) {
  const sql = getSql();
  await ensureTables();
  await sql`INSERT INTO players (player_id) VALUES (${playerId}) ON CONFLICT (player_id) DO NOTHING`;
  await sql`INSERT INTO player_wallet (player_id, coins) VALUES (${playerId}, 0) ON CONFLICT (player_id) DO NOTHING`;
  await ensureDefaultUnlocks(playerId);
}

// === Inline Auth utilities ===
function getSecret() {
  if (typeof process === 'undefined' || !process.env) return 'dev-secret-change-me';
  return process.env.AUTH_SECRET || process.env.JWT_SECRET || 'dev-secret-change-me';
}

function verifyToken(token?: string): any | null {
  if (!token) return null;
  const [b64, sig] = token.split('.') as [string, string];
  if (!b64 || !sig) return null;
  const expect = crypto.createHmac('sha256', getSecret()).update(b64).digest('base64url');
  if (expect !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function getAuthPlayerId(req: VercelRequest): string | null {
  const auth = req.headers['authorization'];
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim();
    const payload = verifyToken(token);
    if (payload?.pid) return String(payload.pid);
  }
  return null;
}

function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function resolvePlayerId(req: VercelRequest): string | null {
  return getAuthPlayerId(req) || (typeof req.query.playerId === 'string' ? req.query.playerId : (req.body?.playerId ?? null));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureTables();
    const sql = getSql();
    if (req.method === 'GET') {
      const playerId = resolvePlayerId(req);
      if (!playerId) return res.status(400).json({ error: 'playerId required' });
      await ensurePlayer(playerId);

      const [prog, wallet, shards, levels, chests, unlockedRows] = await Promise.all([
        sql`SELECT level_id, max_star FROM player_progress WHERE player_id=${playerId}`,
        sql`SELECT coins FROM player_wallet WHERE player_id=${playerId}`,
        sql`SELECT tower_type, shards FROM inventory_shards WHERE player_id=${playerId}`,
        sql`SELECT tower_type, level FROM tower_levels WHERE player_id=${playerId}`,
        sql`SELECT chest_id, status, awarded_at, unlock_start_at, unlock_ready_at, duration_seconds FROM chests WHERE player_id=${playerId} ORDER BY awarded_at DESC LIMIT 50`,
        sql`SELECT item_id FROM unlocked_items WHERE player_id=${playerId} AND unlocked=true`,
      ]);
      const stars: Record<string, number> = {};
      (prog as any[]).forEach((r: any) => stars[r.level_id] = r.max_star);
      const coins = (wallet as any[])[0]?.coins ?? 0;
      const shardInv: Record<string, number> = {};
      (shards as any[]).forEach((r: any) => shardInv[r.tower_type] = Number(r.shards));
      const towerLv: Record<string, number> = {};
      (levels as any[]).forEach((r: any) => towerLv[r.tower_type] = Number(r.level));
      const unlockedItems = (unlockedRows as any[]).map((r: any) => r.item_id);

      // 计算 unlocked：找到最大的已通关关卡编号 + 1
      let unlocked = 1; // 默认至少解锁第1关
      for (let i = 1; i <= 52; i++) {
        const levelId = `L${i}`;
        if (stars[levelId] && stars[levelId] > 0) {
          unlocked = Math.max(unlocked, i + 1); // 通关第i关，解锁第i+1关
        }
      }

      return res.json({ stars, coins, shards: shardInv, towerLevels: towerLv, chests, unlocked, unlockedItems });
    }

    if (req.method === 'POST') {
      const { action } = req.body || {};
      if (action === 'setStar') {
        const pid = resolvePlayerId(req);
        const { levelId, star } = req.body as { playerId?: string; levelId: string; star: 1|2|3 };
        if (!pid || !levelId || !star) return res.status(400).json({ error: 'params' });
        await ensurePlayer(pid);
        // upsert star
        const cur = await sql`SELECT max_star FROM player_progress WHERE player_id=${pid} AND level_id=${levelId}`;
        const prev = (cur as any[])[0]?.max_star ?? 0;
        const next = Math.max(prev, star);
        await sql`INSERT INTO player_progress (player_id, level_id, max_star) VALUES (${pid}, ${levelId}, ${next})
          ON CONFLICT (player_id, level_id) DO UPDATE SET max_star=excluded.max_star, updated_at=NOW()`;
        const newUnlocks: string[] = [];
        const levelNum = Number(String(levelId || '').replace(/^L/i, ''));
        if (!Number.isNaN(levelNum)) {
          for (const rule of UNLOCK_RULES) {
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

        // 每次通关都给奖励
        let rewardCoins = 0;
        let chestType = 'common';
        let chestCoinReward = 0;

        // 根据当前获得的星级给奖励
        if (star >= 1) {
          // 根据星级给予奖励
          if (star === 1) {
            rewardCoins = randInt(100, 200);
            chestType = 'common';
          } else if (star === 2) {
            rewardCoins = randInt(500, 1000);
            chestType = 'rare';
          } else if (star === 3) {
            rewardCoins = randInt(800, 1500);
            chestType = 'epic';
          }

          await sql`UPDATE player_wallet SET coins = coins + ${rewardCoins}, updated_at=NOW() WHERE player_id=${pid}`;

          // 每次通关都给宝箱（锁定状态，需要解锁）
          const chestId = `c_${Math.random().toString(36).slice(2)}_${Date.now()}`;
          await sql`INSERT INTO chests (chest_id, player_id, status, duration_seconds, chest_type, coin_reward)
            VALUES (${chestId}, ${pid}, 'locked', 3600, ${chestType}, ${chestCoinReward})`;

          return res.json({ ok: true, star: next, rewardCoins, chestId, chestType, previousStar: prev, newRecord: next > prev, newUnlocks });
        }

        return res.json({ ok: true, star: next, rewardCoins: 0, newUnlocks });
      }

      return res.status(400).json({ error: 'bad action' });
    }

    return res.status(405).json({ error: 'method' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
