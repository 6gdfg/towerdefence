-- One-shot schema for TD game on Neon/Postgres

CREATE TABLE IF NOT EXISTS players (
  player_id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_accounts (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  player_id TEXT NOT NULL REFERENCES players(player_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_progress (
  player_id TEXT NOT NULL,
  level_id TEXT NOT NULL,
  max_star INTEGER CHECK (max_star BETWEEN 0 AND 3),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (player_id, level_id)
);

CREATE TABLE IF NOT EXISTS player_wallet (
  player_id TEXT PRIMARY KEY REFERENCES players(player_id),
  coins BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_shards (
  player_id TEXT NOT NULL REFERENCES players(player_id),
  tower_type TEXT NOT NULL,
  shards BIGINT DEFAULT 0,
  PRIMARY KEY (player_id, tower_type)
);

CREATE TABLE IF NOT EXISTS tower_levels (
  player_id TEXT NOT NULL REFERENCES players(player_id),
  tower_type TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  PRIMARY KEY (player_id, tower_type)
);

CREATE TABLE IF NOT EXISTS chests (
  chest_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(player_id),
  status TEXT CHECK (status IN ('locked','unlocking','ready','opened')) DEFAULT 'locked',
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  unlock_start_at TIMESTAMPTZ,
  unlock_ready_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 7200,
  open_result JSONB
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_prog_player ON player_progress(player_id);
CREATE INDEX IF NOT EXISTS idx_shards_player ON inventory_shards(player_id);
CREATE INDEX IF NOT EXISTS idx_levels_player ON tower_levels(player_id);
CREATE INDEX IF NOT EXISTS idx_chests_player ON chests(player_id);

