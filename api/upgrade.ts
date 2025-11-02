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
    sql`CREATE TABLE IF NOT EXISTS tower_levels (player_id TEXT, tower_type TEXT, level INTEGER DEFAULT 1, PRIMARY KEY (player_id, tower_type))`,
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

function getCost(currentLevel: number) {
  const lv = Math.max(1, Math.floor(currentLevel || 1));
  const fragments = 5 + 3 * (lv - 1);
  const coins = 100 * lv;
  return { fragments, coins };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureTables();
    const sql = getSql();
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const pid = getAuthPlayerId(req) || (typeof req.body?.playerId === 'string' ? req.body.playerId : null);
    if (!pid) return res.status(400).json({ error: 'playerId required' });
    await ensurePlayer(pid);

    const { action, towerType } = req.body || {} as { action?: string; towerType?: string };
    if (action !== 'upgrade') return res.status(400).json({ error: 'bad action' });
    if (!towerType) return res.status(400).json({ error: 'towerType required' });

    const [walletRows, levelRows, shardRows] = await Promise.all([
      sql`SELECT coins FROM player_wallet WHERE player_id=${pid}`,
      sql`SELECT level FROM tower_levels WHERE player_id=${pid} AND tower_type=${towerType}`,
      sql`SELECT shards FROM inventory_shards WHERE player_id=${pid} AND tower_type=${towerType}`,
    ]);
    const coins = Number(walletRows[0]?.coins ?? 0);
    const currentLevel = Number(levelRows[0]?.level ?? 1);
    const shards = Number(shardRows[0]?.shards ?? 0);

    const cost = getCost(currentLevel);
    if (coins < cost.coins) return res.status(400).json({ error: 'COINS_NOT_ENOUGH', need: cost.coins, have: coins });
    if (shards < cost.fragments) return res.status(400).json({ error: 'SHARDS_NOT_ENOUGH', need: cost.fragments, have: shards });

    const nextLevel = currentLevel + 1;
    // apply updates
    await sql`UPDATE player_wallet SET coins = coins - ${cost.coins} WHERE player_id=${pid}`;
    await sql`INSERT INTO inventory_shards (player_id, tower_type, shards) VALUES (${pid}, ${towerType}, ${shards - cost.fragments})
      ON CONFLICT (player_id, tower_type) DO UPDATE SET shards = ${shards - cost.fragments}`;
    await sql`INSERT INTO tower_levels (player_id, tower_type, level) VALUES (${pid}, ${towerType}, ${nextLevel})
      ON CONFLICT (player_id, tower_type) DO UPDATE SET level=${nextLevel}`;

    return res.json({ ok: true, towerType, level: nextLevel, cost });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
