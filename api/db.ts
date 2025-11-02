import { neon } from '@neondatabase/serverless';

function getDbUrl() {
  if (typeof process === 'undefined' || !process.env) return '';
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || '';
}

let _sql: any = null;
export const sql = new Proxy({} as any, {
  get(_target, prop) {
    if (!_sql) {
      const CONN = getDbUrl();
      if (!CONN) throw new Error('No DB URL configured');
      _sql = neon(CONN);
    }
    return _sql[prop];
  },
  apply(_target, _thisArg, args) {
    if (!_sql) {
      const CONN = getDbUrl();
      if (!CONN) throw new Error('No DB URL configured');
      _sql = neon(CONN);
    }
    return _sql(...args);
  }
});

// Cache to avoid running ensureTables on every request
let tablesEnsured = false;

export async function ensureTables() {
  if (tablesEnsured) return;

  try {
    // Run all CREATE TABLE statements in parallel for better performance
    await Promise.all([
      sql`CREATE TABLE IF NOT EXISTS players (
        player_id TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS user_accounts (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        player_id TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS player_progress (
        player_id TEXT,
        level_id TEXT,
        max_star INTEGER CHECK (max_star BETWEEN 0 AND 3),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (player_id, level_id)
      )`,
      sql`CREATE TABLE IF NOT EXISTS player_wallet (
        player_id TEXT PRIMARY KEY,
        coins BIGINT DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      sql`CREATE TABLE IF NOT EXISTS inventory_shards (
        player_id TEXT,
        tower_type TEXT,
        shards BIGINT DEFAULT 0,
        PRIMARY KEY (player_id, tower_type)
      )`,
      sql`CREATE TABLE IF NOT EXISTS tower_levels (
        player_id TEXT,
        tower_type TEXT,
        level INTEGER DEFAULT 1,
        PRIMARY KEY (player_id, tower_type)
      )`,
      sql`CREATE TABLE IF NOT EXISTS chests (
        chest_id TEXT PRIMARY KEY,
        player_id TEXT,
        status TEXT CHECK (status IN ('locked','unlocking','ready','opened')) DEFAULT 'locked',
        awarded_at TIMESTAMPTZ DEFAULT NOW(),
        unlock_start_at TIMESTAMPTZ,
        unlock_ready_at TIMESTAMPTZ,
        duration_seconds INTEGER DEFAULT 7200,
        open_result JSONB
      )`
    ]);

    tablesEnsured = true;
  } catch (error) {
    console.error('Error ensuring tables:', error);
    throw error;
  }
}

export async function ensurePlayer(playerId: string) {
  await ensureTables();
  await sql`INSERT INTO players (player_id) VALUES (${playerId}) ON CONFLICT (player_id) DO NOTHING`;
  await sql`INSERT INTO player_wallet (player_id, coins) VALUES (${playerId}, 0) ON CONFLICT (player_id) DO NOTHING`;
}

