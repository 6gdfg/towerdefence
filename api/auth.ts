import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

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

let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured) return;
  const sql = getSql();
  await Promise.all([
    sql`CREATE TABLE IF NOT EXISTS players (player_id TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW())`,
    sql`CREATE TABLE IF NOT EXISTS user_accounts (username TEXT PRIMARY KEY, password_hash TEXT NOT NULL, player_id TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())`,
    sql`CREATE TABLE IF NOT EXISTS player_wallet (player_id TEXT PRIMARY KEY, coins BIGINT DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW())`
  ]);
  tablesEnsured = true;
}

// === Inline Auth utilities ===
function getSecret() {
  if (typeof process === 'undefined' || !process.env) return 'dev-secret-change-me';
  return process.env.AUTH_SECRET || process.env.JWT_SECRET || 'dev-secret-change-me';
}

function issueToken(payload: any) {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

async function hashPassword(pw: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureTables();
    const sql = getSql();
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const { action } = req.body || {};

    if (action === 'register') {
      const { username, password } = req.body as { username?: string; password?: string };
      if (!username || !password) return res.status(400).json({ error: 'params' });
      // ensure username not exists
      const exist = await sql`SELECT username FROM user_accounts WHERE username=${username}`;
      if (exist.length > 0) return res.status(400).json({ error: 'USERNAME_TAKEN' });
      // create player
      const playerId = `p_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      await sql`INSERT INTO players (player_id) VALUES (${playerId}) ON CONFLICT (player_id) DO NOTHING`;
      // wallet init
      await sql`INSERT INTO player_wallet (player_id, coins) VALUES (${playerId}, 0) ON CONFLICT (player_id) DO NOTHING`;
      // store user
      const pwHash = await hashPassword(password);
      await sql`INSERT INTO user_accounts (username, password_hash, player_id) VALUES (${username}, ${pwHash}, ${playerId})`;
      // token
      const token = issueToken({ pid: playerId, u: username, exp: Date.now() + 30*24*60*60*1000 });
      return res.json({ ok: true, playerId, username, token });
    }

    if (action === 'login') {
      const { username, password } = req.body as { username?: string; password?: string };
      if (!username || !password) return res.status(400).json({ error: 'params' });
      const rows = await sql`SELECT password_hash, player_id FROM user_accounts WHERE username=${username}`;
      const row = rows[0];
      if (!row) return res.status(400).json({ error: 'BAD_CREDENTIALS' });
      const ok = await verifyPassword(password, row.password_hash);
      if (!ok) return res.status(400).json({ error: 'BAD_CREDENTIALS' });
      const token = issueToken({ pid: row.player_id, u: username, exp: Date.now() + 30*24*60*60*1000 });
      return res.json({ ok: true, playerId: row.player_id, username, token });
    }

    return res.status(400).json({ error: 'bad action' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

