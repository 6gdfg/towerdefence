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

let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured) return;
  const sql = getSql();
  await Promise.all([
    sql`CREATE TABLE IF NOT EXISTS players (player_id TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW())`,
    sql`CREATE TABLE IF NOT EXISTS player_wallet (player_id TEXT PRIMARY KEY, coins BIGINT DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW())`,
    sql`CREATE TABLE IF NOT EXISTS inventory_shards (player_id TEXT, tower_type TEXT, shards BIGINT DEFAULT 0, PRIMARY KEY (player_id, tower_type))`,
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

const BASE_PLANT_TYPES = ['sunflower','bottleGrass','fourLeafClover','machineGun','sniper'];
const REWARD_POOL: Array<{ id: string; weight: number }> = [
  { id: 'sunflower', weight: 12 },
  { id: 'bottleGrass', weight: 10 },
  { id: 'fourLeafClover', weight: 8 },
  { id: 'machineGun', weight: 9 },
  { id: 'sniper', weight: 9 },
  { id: 'element:gold', weight: 6 },
  { id: 'element:fire', weight: 6 },
  { id: 'element:electric', weight: 6 },
  { id: 'element:ice', weight: 7 },
  { id: 'element:wind', weight: 5 },
];

function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function pickRewardId(): string {
  const totalWeight = REWARD_POOL.reduce((sum, item) => sum + item.weight, 0);
  let roll = randInt(1, totalWeight);
  for (const item of REWARD_POOL) {
    roll -= item.weight;
    if (roll <= 0) return item.id;
  }
  return REWARD_POOL[REWARD_POOL.length - 1]?.id ?? BASE_PLANT_TYPES[0];
}

function resolvePlayerId(req: VercelRequest): string | null {
  return getAuthPlayerId(req) || (typeof (req.body?.playerId) === 'string' ? req.body.playerId : null);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureTables();
    const sql = getSql();
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const { action, chestId } = req.body || {};
    const playerId = resolvePlayerId(req);
    if (!playerId) return res.status(400).json({ error: 'playerId required' });
    await ensurePlayer(playerId);

    if (action === 'startUnlock') {
      const now = new Date();
      // 获取箱子的解锁时长（秒）
      const chestRows = await sql`SELECT duration_seconds FROM chests WHERE chest_id=${chestId} AND player_id=${playerId} AND status='locked'`;
      if (chestRows.length === 0) return res.status(400).json({ error: 'invalid chest' });
      const durationSeconds = (chestRows[0] as any).duration_seconds || 3600;
      const ready = new Date(now.getTime() + durationSeconds * 1000);
      const r = await sql`UPDATE chests SET status='unlocking', unlock_start_at=${now.toISOString()}, unlock_ready_at=${ready.toISOString()} WHERE chest_id=${chestId} AND player_id=${playerId} AND status='locked' RETURNING chest_id`;
      if (r.length === 0) return res.status(400).json({ error: 'invalid chest' });
      return res.json({ ok: true, readyAt: ready.toISOString() });
    }

    if (action === 'skip') {
      const rows = await sql`SELECT unlock_ready_at, status FROM chests WHERE chest_id=${chestId} AND player_id=${playerId}`;
      const c = rows[0];
      if (!c) return res.status(404).json({ error: 'not found' });
      if (c.status !== 'unlocking' || !c.unlock_ready_at) {
        return res.status(400).json({ error: 'cannot skip' });
      }
      const now = Date.now();
      const readyAtMs = new Date(c.unlock_ready_at).getTime();
      const remainingMs = readyAtMs - now;
      if (remainingMs <= 0) {
        return res.json({ ok: true, cost: 0, ready: true });
      }
      const minutes = Math.max(1, Math.ceil(remainingMs / 60000));
      const cost = minutes * 20;
      const walletRows = await sql`SELECT coins FROM player_wallet WHERE player_id=${playerId}`;
      const coins = Number(walletRows[0]?.coins ?? 0);
      if (coins < cost) return res.status(400).json({ error: 'COINS_NOT_ENOUGH', need: cost, have: coins });

      const nowIso = new Date().toISOString();
      await sql`UPDATE player_wallet SET coins = coins - ${cost}, updated_at=NOW() WHERE player_id=${playerId}`;
      await sql`UPDATE chests SET unlock_ready_at=${nowIso}, unlock_start_at=${nowIso} WHERE chest_id=${chestId} AND player_id=${playerId}`;
      return res.json({ ok: true, cost, readyAt: nowIso });
    }

    if (action === 'open') {
      const rows = await sql`SELECT * FROM chests WHERE chest_id=${chestId} AND player_id=${playerId}`;
      const c = rows[0];
      if (!c) return res.status(404).json({ error: 'not found' });
      if (c.status !== 'unlocking' || !c.unlock_ready_at || new Date(c.unlock_ready_at).getTime() > Date.now()) {
        return res.status(400).json({ error: 'not ready' });
      }

      // 根据箱子类型决定奖励
      const chestType = c.chest_type || 'common';
      let shardCount = 0;
      let coinReward = c.coin_reward || 0;

      // 普通箱子: 3-10碎片
      // 稀有箱子: 5-15碎片
      // 史诗箱子: 20-30碎片
      if (chestType === 'common') {
        shardCount = randInt(3, 10);
      } else if (chestType === 'rare') {
        shardCount = randInt(5, 15);
      } else if (chestType === 'epic') {
        shardCount = randInt(20, 30);
      }

      // 生成随机碎片分配
      const shardPacks: Array<{ tower: string; amount: number }> = [];
      for (let i = 0; i < shardCount; i++) {
        const rewardId = pickRewardId();
        shardPacks.push({ tower: rewardId, amount: 1 });
      }

      // 按塔类型汇总
      const sum: Record<string, number> = {};
      shardPacks.forEach(p => { sum[p.tower] = (sum[p.tower] || 0) + p.amount; });

      // 应用到背包
      for (const [tower, amt] of Object.entries(sum)) {
        await sql`INSERT INTO inventory_shards (player_id, tower_type, shards) VALUES (${playerId}, ${tower}, ${amt})
          ON CONFLICT (player_id, tower_type) DO UPDATE SET shards = inventory_shards.shards + EXCLUDED.shards`;
      }

      // 发放金币奖励
      if (coinReward > 0) {
        await sql`UPDATE player_wallet SET coins = coins + ${coinReward}, updated_at=NOW() WHERE player_id=${playerId}`;
      }

      // 开完箱后直接删除该箱子
      await sql`DELETE FROM chests WHERE chest_id=${chestId}`;
      return res.json({ ok: true, shards: sum, coins: coinReward, chestType });
    }

    return res.status(400).json({ error: 'bad action' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
