import { GENERATED_LEVEL_UNLOCK_REQUIREMENTS } from './unlockDraft.generated.js';

export const PLANT_ITEM_IDS = ['sunflower', 'bottleGrass', 'doubleBottleGrass', 'puffShroom', 'fourLeafClover', 'pentagram', 'pumpkinHead', 'machineGun', 'sniper', 'rocket', 'sunlightFlower', 'holyFlower', 'hotPepper', 'frostBlastShroom', 'cycloneShroom', 'magnetNeedle', 'electricFlower'] as const;
export const NON_UPGRADEABLE_PLANT_ITEMS = ['pumpkinHead'] as const;
export const ELEMENT_ITEM_IDS = ['element:fire', 'element:wind', 'element:ice', 'element:electric', 'element:gold', 'element:light'] as const;
export const DEFAULT_UNLOCKED_ITEMS = ['sunflower', 'bottleGrass'] as const;
export const INITIAL_PLAYER_COINS = 1000;
export const INITIAL_PLAYER_DIAMONDS = 5;

export function getUpgradeCost(currentLevel: number) {
  const level = Math.max(1, Math.floor(currentLevel || 1));
  return {
    fragments: 5 + 5 * (level - 1),
    coins: 100 * level,
  };
}

export type LevelUnlockRequirement = {
  level: number;
  difficulty: 'EZ' | 'HD' | 'IN' | 'AT';
  star: 1 | 2 | 3;
  itemId: string;
};

export const LEVEL_UNLOCK_REQUIREMENTS: LevelUnlockRequirement[] = GENERATED_LEVEL_UNLOCK_REQUIREMENTS;
