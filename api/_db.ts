import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import { DEFAULT_UNLOCKED_ITEMS, INITIAL_PLAYER_COINS } from '../shared/unlocks.js';
import { DATABASE_MIGRATIONS } from './_migrations.js';

export type SqlRow = Record<string, unknown>;
type QueuedSqlQuery = unknown;
type TransactionSqlClient = ((strings: TemplateStringsArray, ...params: unknown[]) => QueuedSqlQuery) & {
  query: (queryWithPlaceholders: string, params?: unknown[]) => QueuedSqlQuery;
};
export type SqlClient = ((strings: TemplateStringsArray, ...params: unknown[]) => Promise<SqlRow[]>) & {
  query: (queryWithPlaceholders: string, params?: unknown[]) => Promise<SqlRow[]>;
  transaction: (queriesOrFn: (sql: TransactionSqlClient) => QueuedSqlQuery[]) => Promise<unknown>;
};

const MIGRATION_LOCK_KEY = 74774321;

function envValue(key: string) {
  const value = process.env[key];
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function buildDbUrlFromParts() {
  const host = envValue('PGHOST') || envValue('POSTGRES_HOST') || envValue('PGHOST_UNPOOLED');
  const user = envValue('PGUSER') || envValue('POSTGRES_USER');
  const password = envValue('PGPASSWORD') || envValue('POSTGRES_PASSWORD');
  const database = envValue('PGDATABASE') || envValue('POSTGRES_DATABASE');
  const port = envValue('PGPORT') || '5432';

  if (!host || !user || !password || !database) return '';

  const hasPort = /:\d+$/.test(host);
  const portPart = hasPort ? '' : `:${port}`;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}${portPart}/${encodeURIComponent(database)}?sslmode=require`;
}

export function getDbUrl() {
  if (typeof process === 'undefined' || !process.env) return '';
  return envValue('POSTGRES_URL')
    || envValue('DATABASE_URL')
    || envValue('DATABASE_URL_UNPOOLED')
    || envValue('POSTGRES_PRISMA_URL')
    || envValue('POSTGRES_URL_NON_POOLING')
    || envValue('POSTGRES_URL_NO_SSL')
    || envValue('NEON_DATABASE_URL')
    || buildDbUrlFromParts()
    || '';
}

let sqlClient: SqlClient | null = null;

export function getSql() {
  if (!sqlClient) {
    const conn = getDbUrl();
    if (!conn) throw new Error('No DB URL configured');
    sqlClient = neon(conn) as unknown as SqlClient;
  }
  return sqlClient;
}

let tablesEnsured = false;

export async function runDatabaseMigrations() {
  const sql = getSql();

  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  const appliedRows = await sql`SELECT id FROM schema_migrations`;
  const applied = new Set(appliedRows.map(row => String(row.id)));

  for (const migration of DATABASE_MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    await sql.transaction(tx => [
      tx`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK_KEY})`,
      ...migration.statements.map(statement => tx.query(statement)),
      tx`INSERT INTO schema_migrations (id, description) VALUES (${migration.id}, ${migration.description})
        ON CONFLICT (id) DO NOTHING`,
    ]);
  }
}

export async function ensureTables() {
  if (tablesEnsured) return;
  await runDatabaseMigrations();
  tablesEnsured = true;
}

export async function ensureDefaultUnlocks(playerId: string) {
  const sql = getSql();
  for (const item of DEFAULT_UNLOCKED_ITEMS) {
    await sql`INSERT INTO unlocked_items (player_id, item_id, unlocked) VALUES (${playerId}, ${item}, TRUE)
      ON CONFLICT (player_id, item_id) DO NOTHING`;
  }
}

export async function ensurePlayer(playerId: string) {
  const sql = getSql();
  await ensureTables();
  await sql`INSERT INTO players (player_id) VALUES (${playerId}) ON CONFLICT (player_id) DO NOTHING`;
  await sql`INSERT INTO player_wallet (player_id, coins, magic_keys) VALUES (${playerId}, ${INITIAL_PLAYER_COINS}, 0)
    ON CONFLICT (player_id) DO NOTHING`;
  await ensureDefaultUnlocks(playerId);
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}
