export type LevelStar = 1 | 2 | 3;
export type ChestType = 'common' | 'rare' | 'epic';

export type RewardRange = {
  min: number;
  max: number;
};

export type StarRewardConfig = {
  coins: RewardRange;
  chestType: ChestType;
};

export type ChestRewardConfig = {
  unlockSeconds: number;
  coins: RewardRange;
  shardRolls: RewardRange;
  magicKeyChance: number;
};

export const STAR_REWARD_CONFIG: Record<LevelStar, StarRewardConfig> = {
  1: { coins: { min: 500, max: 1000 }, chestType: 'common' },
  2: { coins: { min: 1000, max: 2000 }, chestType: 'rare' },
  3: { coins: { min: 2000, max: 5000 }, chestType: 'epic' },
};

export const CHEST_REWARD_CONFIG: Record<ChestType, ChestRewardConfig> = {
  common: {
    unlockSeconds: 30 * 60,
    coins: { min: 100, max: 300 },
    shardRolls: { min: 4, max: 8 },
    magicKeyChance: 0,
  },
  rare: {
    unlockSeconds: 60 * 60,
    coins: { min: 300, max: 900 },
    shardRolls: { min: 8, max: 16 },
    magicKeyChance: 0.03,
  },
  epic: {
    unlockSeconds: 2 * 60 * 60,
    coins: { min: 800, max: 2000 },
    shardRolls: { min: 18, max: 32 },
    magicKeyChance: 0.1,
  },
};

export function isChestType(value: unknown): value is ChestType {
  return value === 'common' || value === 'rare' || value === 'epic';
}

export function getStarRewardConfig(star: number): StarRewardConfig {
  return STAR_REWARD_CONFIG[(star === 2 || star === 3 ? star : 1) as LevelStar];
}

export function getChestRewardConfig(chestType: string | null | undefined): ChestRewardConfig {
  return CHEST_REWARD_CONFIG[isChestType(chestType) ? chestType : 'common'];
}
