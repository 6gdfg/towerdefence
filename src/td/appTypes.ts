import type { BasePlantConfig, ELEMENT_PLANT_CONFIG, getPlantStatsForLevel } from './plants';
import type { ElementType, PlantType } from './types';

export type HubData = {
  coins: number;
  magicKeys: number;
  diamonds: number;
  experience?: number;
  shards: Record<string, number>;
  plantShards: Record<string, number>;
  elementShards: Record<string, number>;
  towerLevels: Record<string, number>;
  chests: CloudChest[];
  unlockedItems: string[];
};

export type CloudProgress = HubData & {
  stars?: Record<string, number>;
  fullHealthClears?: Record<string, boolean>;
  unlocked?: number;
};

export type CloudChest = {
  chest_id: string;
  status: 'locked' | 'unlocking' | 'ready' | 'opened' | string;
  awarded_at?: string;
  unlock_start_at?: string | null;
  unlock_ready_at?: string | null;
  duration_seconds?: number;
  chest_type?: string | null;
};

export type WinReward = {
  coins: number;
  chestType?: string | null;
  chestTypes?: string[];
  chestAwarded?: boolean;
  repeatChestChance?: number;
  newRecord?: boolean;
  diamonds?: number;
  message?: string;
};

export type ChestReward = {
  shards: Record<string, number>;
  plantShards: Record<string, number>;
  elementShards: Record<string, number>;
  coins: number;
  magicKeys?: number;
  chestType: string;
  newUnlocks?: string[];
};

export type PlantBookEntry = {
  type: PlantType;
  level: number;
  stats: NonNullable<ReturnType<typeof getPlantStatsForLevel>>;
  config: BasePlantConfig;
};

export type ElementBookEntry = {
  id: ElementType;
  level: number;
  damageMultiplier: number;
  fireRateMultiplier: number | null;
  fireRatePenalty: number | null;
  breakArmor: { multiplier: number; duration: number } | null;
  burn: { dps: number; duration: number } | null;
  splash: { radius: number; percent: number } | null;
  slow: { pct: number; duration: number } | null;
  aura: { dps: number } | null;
  knockback: number | null;
  bounce: { maxBounces: number } | null;
  cfg: (typeof ELEMENT_PLANT_CONFIG)[ElementType];
};
