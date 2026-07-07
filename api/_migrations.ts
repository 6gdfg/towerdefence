import { INITIAL_PLAYER_COINS, INITIAL_PLAYER_DIAMONDS } from '../shared/unlocks.js';

export type DatabaseMigration = {
  id: string;
  description: string;
  statements: string[];
};

export const DATABASE_MIGRATIONS: DatabaseMigration[] = [
  {
    id: '001_initial_td_schema',
    description: 'Create tower defence player, economy, chest, unlock, and ranking tables',
    statements: [
      `CREATE TABLE IF NOT EXISTS players (
        player_id TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS user_accounts (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        player_id TEXT NOT NULL REFERENCES players(player_id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS player_progress (
        player_id TEXT NOT NULL REFERENCES players(player_id),
        level_id TEXT NOT NULL,
        max_star INTEGER CHECK (max_star BETWEEN 0 AND 3),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (player_id, level_id)
      )`,
      `CREATE TABLE IF NOT EXISTS player_wallet (
        player_id TEXT PRIMARY KEY REFERENCES players(player_id),
        coins BIGINT DEFAULT ${INITIAL_PLAYER_COINS},
        magic_keys INTEGER DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS inventory_shards (
        player_id TEXT NOT NULL REFERENCES players(player_id),
        tower_type TEXT NOT NULL,
        shards BIGINT DEFAULT 0,
        PRIMARY KEY (player_id, tower_type)
      )`,
      `CREATE TABLE IF NOT EXISTS tower_levels (
        player_id TEXT NOT NULL REFERENCES players(player_id),
        tower_type TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        PRIMARY KEY (player_id, tower_type)
      )`,
      `CREATE TABLE IF NOT EXISTS chests (
        chest_id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL REFERENCES players(player_id),
        status TEXT CHECK (status IN ('locked','unlocking','ready','opened')) DEFAULT 'locked',
        awarded_at TIMESTAMPTZ DEFAULT NOW(),
        unlock_start_at TIMESTAMPTZ,
        unlock_ready_at TIMESTAMPTZ,
        duration_seconds INTEGER DEFAULT 3600,
        chest_type TEXT DEFAULT 'common' CHECK (chest_type IN ('common','rare','epic','legendary')),
        coin_reward INTEGER DEFAULT 0,
        open_result JSONB
      )`,
      `CREATE TABLE IF NOT EXISTS unlocked_items (
        player_id TEXT NOT NULL REFERENCES players(player_id),
        item_id TEXT NOT NULL,
        unlocked BOOLEAN DEFAULT TRUE,
        unlocked_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (player_id, item_id)
      )`,
      `ALTER TABLE player_wallet ADD COLUMN IF NOT EXISTS magic_keys INTEGER DEFAULT 0`,
      `ALTER TABLE chests ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 3600`,
      `ALTER TABLE chests ADD COLUMN IF NOT EXISTS chest_type TEXT DEFAULT 'common'`,
      `ALTER TABLE chests ADD COLUMN IF NOT EXISTS coin_reward INTEGER DEFAULT 0`,
      `ALTER TABLE chests ADD COLUMN IF NOT EXISTS open_result JSONB`,
      `ALTER TABLE chests ALTER COLUMN duration_seconds SET DEFAULT 3600`,
      `CREATE INDEX IF NOT EXISTS idx_user_accounts_player ON user_accounts(player_id)`,
      `CREATE INDEX IF NOT EXISTS idx_prog_player ON player_progress(player_id)`,
      `CREATE INDEX IF NOT EXISTS idx_shards_player ON inventory_shards(player_id)`,
      `CREATE INDEX IF NOT EXISTS idx_levels_player ON tower_levels(player_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chests_player ON chests(player_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chests_player_status ON chests(player_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_unlocked_items_player ON unlocked_items(player_id)`,
    ],
  },
  {
    id: '002_initial_player_wallet_coins',
    description: 'Set new player wallet initial coins to 1000',
    statements: [
      `ALTER TABLE player_wallet ALTER COLUMN coins SET DEFAULT ${INITIAL_PLAYER_COINS}`,
      `UPDATE player_wallet w
        SET coins = ${INITIAL_PLAYER_COINS}, updated_at = NOW()
        WHERE w.coins = 0
          AND NOT EXISTS (
            SELECT 1 FROM player_progress p WHERE p.player_id = w.player_id
          )
          AND NOT EXISTS (
            SELECT 1 FROM chests c WHERE c.player_id = w.player_id
          )
          AND NOT EXISTS (
            SELECT 1 FROM inventory_shards s WHERE s.player_id = w.player_id AND s.shards <> 0
          )
          AND NOT EXISTS (
            SELECT 1 FROM tower_levels t WHERE t.player_id = w.player_id AND t.level <> 1
          )`,
    ],
  },
  {
    id: '003_legendary_chests',
    description: 'Allow legendary chest type',
    statements: [
      `ALTER TABLE chests DROP CONSTRAINT IF EXISTS chests_chest_type_check`,
      `ALTER TABLE chests ADD CONSTRAINT chests_chest_type_check CHECK (chest_type IN ('common','rare','epic','legendary'))`,
    ],
  },
  {
    id: '004_remove_puff_shroom_default_unlock',
    description: 'Remove puff shroom from mistaken default unlocks',
    statements: [
      `DELETE FROM unlocked_items WHERE item_id = 'puffShroom'`,
    ],
  },
  {
    id: '005_in_full_health_clear',
    description: 'Track IN full-health clears for hidden AT unlocks',
    statements: [
      `ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS in_full_health_clear BOOLEAN DEFAULT FALSE`,
      `UPDATE player_progress SET in_full_health_clear = FALSE WHERE in_full_health_clear IS NULL`,
    ],
  },
  {
    id: '006_challenges_diamonds_at_rewards',
    description: 'Add diamonds and AT clear tracking',
    statements: [
      `ALTER TABLE player_wallet ADD COLUMN IF NOT EXISTS diamonds INTEGER DEFAULT ${INITIAL_PLAYER_DIAMONDS}`,
      `UPDATE player_wallet SET diamonds = ${INITIAL_PLAYER_DIAMONDS} WHERE diamonds IS NULL`,
      `ALTER TABLE player_wallet ALTER COLUMN diamonds SET DEFAULT ${INITIAL_PLAYER_DIAMONDS}`,
      `ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS at_cleared BOOLEAN DEFAULT FALSE`,
      `UPDATE player_progress SET at_cleared = FALSE WHERE at_cleared IS NULL`,
    ],
  },
];
