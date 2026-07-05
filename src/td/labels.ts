import { BASE_PLANTS_CONFIG, ELEMENT_PLANT_CONFIG } from './plants';
import { ElementType, PlantType } from './types';

const CHEST_TYPE_NAMES: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
};

export function resolveChestTypeName(chestType: string): string {
  return CHEST_TYPE_NAMES[chestType] ?? chestType;
}

export function resolveChestTypeLabel(chestType: string): string {
  return `${resolveChestTypeName(chestType)}宝箱`;
}

export function resolveShardLabel(key: string): string {
  if (BASE_PLANTS_CONFIG[key as PlantType]) {
    return BASE_PLANTS_CONFIG[key as PlantType].name;
  }
  if (key.startsWith('element:')) {
    const elementId = key.split(':')[1] as ElementType;
    const cfg = ELEMENT_PLANT_CONFIG[elementId];
    if (cfg) return `${cfg.name}碎片`;
  }
  return key;
}

export function resolveUnlockItemLabel(itemId: string): string {
  if (BASE_PLANTS_CONFIG[itemId as PlantType]) {
    return BASE_PLANTS_CONFIG[itemId as PlantType].name;
  }
  if (itemId.startsWith('element:')) {
    const elementId = itemId.split(':')[1] as ElementType;
    const cfg = ELEMENT_PLANT_CONFIG[elementId];
    if (cfg) return cfg.name;
  }
  return itemId;
}
