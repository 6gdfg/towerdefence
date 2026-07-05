import { ELEMENT_TYPES, PLANT_TYPES } from './appConfig';
import type { ElementBookEntry, PlantBookEntry } from './appTypes';
import { BASE_PLANTS_CONFIG, ELEMENT_PLANT_CONFIG, getPlantStatsForLevel } from './plants';

export function buildPlantBookData(
  unlockedItems: Set<string>,
  towerLevels: Record<string, number> | undefined,
): PlantBookEntry[] {
  return PLANT_TYPES
    .filter(type => unlockedItems.has(type))
    .map<PlantBookEntry | null>(type => {
      const config = BASE_PLANTS_CONFIG[type];
      if (!config) return null;
      const level = towerLevels?.[type] ?? 1;
      const stats = getPlantStatsForLevel(type, level);
      if (!stats) return null;
      return { type, level, stats, config };
    })
    .filter((item): item is PlantBookEntry => item !== null);
}

export function buildElementBookData(
  unlockedItems: Set<string>,
  towerLevels: Record<string, number> | undefined,
): ElementBookEntry[] {
  return ELEMENT_TYPES
    .filter(el => unlockedItems.has(`element:${el}`))
    .map<ElementBookEntry>(el => {
      const cfg = ELEMENT_PLANT_CONFIG[el];
      const key = `element:${el}` as const;
      const level = towerLevels?.[key] ?? 1;
      const damageBase = (cfg.damageMultiplier ?? 1) + (cfg.damageBonusPerLevel ?? 0) * (level - 1);
      const damageMultiplier = Number(damageBase.toFixed(2));
      const fireRateMultiplier = cfg.fireRateMultiplier != null ? Number(cfg.fireRateMultiplier.toFixed(2)) : null;
      const fireRatePenalty = cfg.fireRatePenalty != null ? Number(cfg.fireRatePenalty.toFixed(2)) : null;
      const breakArmor = cfg.breakArmor ? {
        multiplier: Number((cfg.breakArmor.multiplier + cfg.breakArmor.bonusPerLevel * (level - 1)).toFixed(2)),
        duration: cfg.breakArmor.duration,
      } : null;
      const burn = cfg.burn ? {
        dps: Number((cfg.burn.damagePerSecond + cfg.burn.bonusPerLevel * (level - 1)).toFixed(2)),
        duration: cfg.burn.duration,
      } : null;
      const splash = cfg.splash ? {
        radius: cfg.splash.radius,
        percent: Number(((cfg.splash.damagePercent + cfg.splash.bonusPerLevel * (level - 1)) * 100).toFixed(1)),
      } : null;
      const slow = cfg.slow ? {
        pct: Number((cfg.slow.pct * 100).toFixed(0)),
        duration: cfg.slow.duration,
      } : null;
      const aura = cfg.aura ? {
        dps: Number((cfg.aura.damagePerSecond + cfg.aura.bonusPerLevel * (level - 1)).toFixed(2)),
      } : null;
      const knockback = cfg.knockback ? cfg.knockback.distance : null;
      const bounce = cfg.bounce ? { maxBounces: cfg.bounce.maxBounces } : null;
      return { id: el, level, cfg, damageMultiplier, fireRateMultiplier, fireRatePenalty, breakArmor, burn, splash, slow, aura, knockback, bounce };
    });
}
