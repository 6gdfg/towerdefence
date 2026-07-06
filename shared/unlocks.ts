export const PLANT_ITEM_IDS = ['sunflower', 'bottleGrass', 'puffShroom', 'fourLeafClover', 'machineGun', 'sniper', 'rocket', 'sunlightFlower', 'hotPepper', 'frostBlastShroom', 'cycloneShroom', 'magnetNeedle'] as const;
export const ELEMENT_ITEM_IDS = ['element:fire', 'element:wind', 'element:ice', 'element:electric', 'element:gold', 'element:light'] as const;
export const DEFAULT_UNLOCKED_ITEMS = ['sunflower', 'bottleGrass'] as const;
export const INITIAL_PLAYER_COINS = 1000;

export function getUpgradeCost(currentLevel: number) {
  const level = Math.max(1, Math.floor(currentLevel || 1));
  return {
    fragments: 5 + 5 * (level - 1),
    coins: 100 * level,
  };
}

export const LEVEL_UNLOCK_REQUIREMENTS: Array<{ level: number; star: 1 | 2 | 3; itemId: string }> = [
  { level: 1, star: 1, itemId: 'element:fire' },
  { level: 3, star: 3, itemId: 'fourLeafClover' },
  { level: 4, star: 3, itemId: 'rocket' },
  { level: 6, star: 3, itemId: 'element:wind' },
  { level: 11, star: 3, itemId: 'sunlightFlower' },
  { level: 15, star: 3, itemId: 'machineGun' },
  { level: 20, star: 3, itemId: 'element:ice' },
  { level: 23, star: 3, itemId: 'sniper' },
  { level: 27, star: 3, itemId: 'element:electric' },
  { level: 30, star: 3, itemId: 'element:gold' },
  { level: 33, star: 3, itemId: 'element:light' },
];
