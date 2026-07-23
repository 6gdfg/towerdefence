import { create } from 'zustand';
import { TDState, WaveDef, Enemy, Tower, Projectile, PlantType, ElementType, ElementCast, GameMode, TowerLevelMap, LabOverrides, ShapeType, SpawnCursor, AtModeConfig, ConveyorItem, SunPickup, PlantCover, SpecialEnemyConfig } from './types';
import { Position } from '../types/game';
import { getDistance, MAP_CONFIG } from '../config/mapConfig';
import { MONSTER_BASE_STATS, DIFFICULTY_CONFIG } from './levels';
import { BASE_PLANTS_CONFIG, ELEMENT_PLANT_CONFIG, DEFAULT_PLANT_COLOR, DEFAULT_BULLET_COLOR, SUNFLOWER_ELEMENT_BLOCKLIST, computePlantStats, getPlantRuntimeConfig } from './plants';
import { ELEMENT_SINGLE_USE_COOLDOWN } from './config';
import { normalizeMapPaths } from './mapPath';
import { getAtBaseModeType, isPhantomAtMode } from './atMode';
import { MAPS, getPlantGrid, isPositionCoveredByRoad, type MapSpec } from './maps';

const IGNITER_DEATH_RADIUS = 2.8;
const IGNITER_DEATH_SPEED_MULTIPLIER = 1.6;
const IGNITER_DEATH_DURATION = 4;
const HEALER_SPECIAL_INTERVAL = 3.5;
const EVIL_SNIPER_SPECIAL_INTERVAL = 20;
const SUMMONER_SPECIAL_INTERVAL = 5;
const PURIFIER_CLEANSE_INTERVAL = 3;
const PURIFIER_CLEANSE_RADIUS = 3;
const FREEZER_SPECIAL_INTERVAL = 30;
const FREEZER_SPECIAL_RADIUS = 4.5;
const FREEZER_SPECIAL_DURATION = 2;
const FREEZER_DEATH_DURATION = 1;
const TAUNTER_RADIUS = 4.5;
const DEFAULT_WAVE_GAP_SECONDS = 2;
const DEFAULT_GROUP_GAP_SECONDS = 2;
const ANGRY_WRITER_STUN_DURATION = 1.5;
const ANGRY_WRITER_ENRAGED_SPEED = 5;
// Keep multi-shot projectiles visibly separate while they track the same target.
const MULTI_SHOT_OFFSET = 0.38;
const SKY_SUN_INTERVAL = 6;
const SKY_SUN_VALUE = 20;
const SKY_SUN_FALL_SPEED = 1.35;
const SKY_SUN_BOTTOM_LIFETIME = 10;
const PLANT_SUN_LIFETIME = 14;
const AUTO_COLLECT_DELAY = 0.5;
const SUN_COLLECT_ANIMATION = 0.55;
const PHANTOM_NORMAL_MAX_PROGRESS = 0.6;
const PHANTOM_BOSS_MAX_PROGRESS = 0.4;
const WIND_EYE_FIRST_PRESSURE_DELAY = 3;
const WIND_EYE_PRESSURE_INTERVAL = 10;
const WIND_EYE_PRESSURE_RADIUS = 2.8;
const WIND_EYE_ENEMY_SPEED_MULTIPLIER = 1.1;
const WIND_EYE_TOWER_FIRE_RATE_MULTIPLIER = 0.9;

// Path demo (fallback)
export const TD_PATH: Position[] = [
  { x: 2, y: 28 },
  { x: 2, y: 20 },
  { x: 8, y: 20 },
  { x: 8, y: 10 },
  { x: 14, y: 10 },
  { x: 14, y: 4 },
];

// Fallback waves (如果未通过关卡配置加载)
const DEFAULT_WAVES: WaveDef[] = [
  { groups: [ { type: 'circle', count: 8, interval: 0.8, level: 1 } ] },
  { groups: [ { type: 'circle', count: 6, interval: 0.7, level: 3 }, { type: 'triangle', count: 6, interval: 0.6, level: 2 } ] },
  { groups: [ { type: 'square', count: 5, interval: 1.0, level: 4 }, { type: 'triangle', count: 10, interval: 0.5, level: 3 } ] },
];

// 基础植物预设（灰度数值，后续可在 src/td/plants.ts 中调整）
export const TOWERS_PRESET = BASE_PLANTS_CONFIG;

// Tower level scaling config (per-level multipliers)
function getMonsterRuntimeStats(type: ShapeType, labOverrides?: LabOverrides | null) {
  const base = MONSTER_BASE_STATS[type];
  const override = labOverrides?.monsters?.[type];
  return override ? { ...base, ...override } : base;
}

function ensureTowerStats(tower: Tower, labOverrides?: LabOverrides | null) {
  const base = getPlantRuntimeConfig(tower.type, labOverrides);
  if (!base) return tower;
  const level = tower.level ?? 1;
  const stats = computePlantStats(base, level, tower.element);
  tower.range = stats.range;
  tower.damage = stats.damage;
  tower.fireRate = stats.fireRate;
  tower.projectileSpeed = stats.projectileSpeed;
  tower.penetration = stats.penetration;
  tower.color = stats.color;
  tower.bulletColor = stats.bulletColor;
  tower.incomeInterval = base.incomeInterval;
  tower.incomeBase = base.incomeBase;
  tower.incomeBonusPerLevel = base.incomeBonusPerLevel;
  return tower;
}

function createTowerForPlacement(type: PlantType, pos: Position, level: number, gameTime: number, labOverrides?: LabOverrides | null) {
  const base = getPlantRuntimeConfig(type, labOverrides);
  if (!base) return null;
  const tower: Tower = {
    id: `tower-${Date.now()}-${Math.random()}`,
    pos,
    type,
    level,
    range: 0,
    damage: 0,
    fireRate: 0,
    lastShotTime: -999,
    lockedTargetId: undefined,
    projectileSpeed: base.projectileSpeed,
    penetration: base.penetration,
    incomeInterval: base.incomeInterval,
    incomeBase: base.incomeBase,
    incomeBonusPerLevel: base.incomeBonusPerLevel,
    lastIncomeTime: gameTime,
    controlAuraLastPulseTime: base.controlAura ? gameTime : undefined,
    expiresAt: base.instantEffect ? gameTime + base.instantEffect.delaySec : base.lifetimeSec ? gameTime + base.lifetimeSec : undefined,
    color: base.instantEffect?.type === 'radiusFrostBlast' ? '#3b82f6' : base.instantEffect ? '#ef4444' : base.controlAura ? '#10b981' : DEFAULT_PLANT_COLOR,
    bulletColor: DEFAULT_BULLET_COLOR,
  };
  ensureTowerStats(tower, labOverrides);
  return tower;
}

function isTowerFrozen(tower: Tower, gameTime: number) {
  return !!tower.frozenUntil && gameTime < tower.frozenUntil;
}

function applyTowerFreeze(tower: Tower, until: number) {
  tower.frozenUntil = Math.max(tower.frozenUntil || 0, until);
}

function pauseTowerTimers(tower: Tower, dt: number) {
  if (tower.lastShotTime > -900) tower.lastShotTime += dt;
  if (tower.lastIncomeTime != null) tower.lastIncomeTime += dt;
  if (tower.controlAuraLastPulseTime != null) tower.controlAuraLastPulseTime += dt;
  if (tower.channelNextTickTime != null) tower.channelNextTickTime += dt;
  if (tower.expiresAt != null) tower.expiresAt += dt;
}

function isTowerProtected(tower: Tower, plantCovers: PlantCover[]) {
  return plantCovers.some(cover => cover.towerId === tower.id);
}

function findTaunterForTower(tower: Tower, enemies: Enemy[], plantCovers: PlantCover[]) {
  if (isTowerProtected(tower, plantCovers) || tower.type === 'pentagram' || tower.damage <= 0) return undefined;
  return enemies
    .filter(enemy => enemy.shape === 'taunter' && enemy.hp > 0 && getDistance(enemy.pos.x, enemy.pos.y, tower.pos.x, tower.pos.y) <= TAUNTER_RADIUS)
    .sort((a, b) => b.progress - a.progress)[0];
}

function getSunflowerSpeedBoost(tower: Tower, towers: Tower[], gameTime: number, labOverrides?: LabOverrides | null) {
  if (tower.type !== 'sunflower') return 0;
  let bestBoost = 0;
  towers.forEach(source => {
    if (isTowerFrozen(source, gameTime)) return;
    const config = getPlantRuntimeConfig(source.type, labOverrides);
    const aura = config?.sunflowerBoostAura;
    if (!aura) return;
    if (Math.abs(source.pos.x - tower.pos.x) > aura.radiusCells) return;
    if (Math.abs(source.pos.y - tower.pos.y) > aura.radiusCells) return;
    const level = Math.max(1, source.level ?? 1);
    const boost = aura.speedBonus + aura.bonusPerLevel * (level - 1);
    bestBoost = Math.max(bestBoost, boost);
  });
  return bestBoost;
}

function getFireRateAuraBonus(tower: Tower, towers: Tower[], gameTime: number, labOverrides?: LabOverrides | null) {
  let bestBonus = 0;
  towers.forEach(source => {
    if (isTowerFrozen(source, gameTime)) return;
    const aura = getPlantRuntimeConfig(source.type, labOverrides)?.fireRateAura;
    if (!aura) return;
    if (Math.abs(source.pos.x - tower.pos.x) > aura.radiusCells) return;
    if (Math.abs(source.pos.y - tower.pos.y) > aura.radiusCells) return;
    const level = Math.max(1, source.level ?? 1);
    const bonus = Math.min(aura.maxBonus, aura.baseBonus + aura.bonusPerLevel * (level - 1));
    bestBonus = Math.max(bestBonus, bonus);
  });
  return bestBonus;
}

function isCoveredByCycloneField(pos: Position, towers: Tower[], gameTime: number) {
  return towers.some(tower => (
    tower.type === 'cycloneShroom'
    && !isTowerFrozen(tower, gameTime)
    && getDistance(pos.x, pos.y, tower.pos.x, tower.pos.y) <= tower.range
  ));
}

function getWindPressureEnemySpeedMultiplier(enemy: Enemy, enemies: Enemy[]) {
  return enemies.some(source => (
    source.hp > 0
    && source.windPressure
    && getDistance(enemy.pos.x, enemy.pos.y, source.windPressure.pos.x, source.windPressure.pos.y) <= source.windPressure.radius
  )) ? WIND_EYE_ENEMY_SPEED_MULTIPLIER : 1;
}

function getWindPressureTowerFireRateMultiplier(tower: Tower, enemies: Enemy[], plantCovers: PlantCover[]) {
  if (isTowerProtected(tower, plantCovers)) return 1;
  return enemies.some(source => (
    source.hp > 0
    && source.windPressure
    && getDistance(tower.pos.x, tower.pos.y, source.windPressure.pos.x, source.windPressure.pos.y) <= source.windPressure.radius
  )) ? WIND_EYE_TOWER_FIRE_RATE_MULTIPLIER : 1;
}

function createProjectileForTower(tower: Tower, target: Pick<Enemy, 'id' | 'pos'>, labOverrides?: LabOverrides | null, launchOffset = 0): Projectile | null {
  if (tower.damage <= 0) return null;
  const baseConfig = getPlantRuntimeConfig(tower.type, labOverrides);
  const dx = target.pos.x - tower.pos.x;
  const dy = target.pos.y - tower.pos.y;
  const len = Math.hypot(dx, dy) || 1;
  const direction = { x: dx / len, y: dy / len };
  const perpendicular = { x: -direction.y, y: direction.x };
  const projectile: Projectile = {
    id: `p-${Date.now()}-${Math.random()}`,
    pos: {
      x: tower.pos.x + perpendicular.x * launchOffset,
      y: tower.pos.y + perpendicular.y * launchOffset,
    },
    targetId: null,
    speed: tower.projectileSpeed || baseConfig?.projectileSpeed || 8,
    damage: tower.damage,
    from: tower.type,
    color: tower.bulletColor || DEFAULT_BULLET_COLOR,
    sourceTowerId: tower.id,
    piercing: !!tower.penetration,
    pierced: tower.penetration ? {} : undefined,
    pierceHitCount: 0,
  };

  if (baseConfig?.returnToSource) {
    projectile.returnToSource = true;
    projectile.origin = { ...tower.pos };
    projectile.returnRange = tower.range;
  }

  if (baseConfig?.pierceLimit != null) {
    projectile.pierceLimit = baseConfig.pierceLimit;
  }
  if (baseConfig?.damageDecayFactor != null) {
    projectile.damageDecayFactor = baseConfig.damageDecayFactor;
  }
  if (baseConfig?.breakArmorDuration != null) {
    projectile.breakArmorDuration = baseConfig.breakArmorDuration;
  }

  projectile.direction = direction;

  if (projectile.piercing) {
    // Piercing projectiles don't have a target
  } else {
    projectile.targetId = target.id;
  }

  const randomElement = baseConfig?.randomElementShot;
  const randomElementTriggered = randomElement && Math.random() < Math.max(0, Math.min(1, randomElement.chance));
  const elementState = tower.element ?? (randomElementTriggered
    ? {
        type: randomElement.type,
        level: Math.max(1, Math.floor(randomElement.level)),
        color: ELEMENT_PLANT_CONFIG[randomElement.type].color,
        bulletColor: ELEMENT_PLANT_CONFIG[randomElement.type].bulletColor,
      }
    : undefined);
  if (elementState) {
    projectile.elementType = elementState.type;
    const elementCfg = ELEMENT_PLANT_CONFIG[elementState.type];
    if (elementCfg) {
      if (randomElementTriggered) {
        projectile.color = elementCfg.bulletColor;
        projectile.damage = Number((projectile.damage * (elementCfg.damageMultiplier ?? 1)).toFixed(2));
      }
      if (elementCfg.breakArmor) {
        projectile.breakArmorDamageMultiplier = elementCfg.breakArmor.multiplier + elementCfg.breakArmor.bonusPerLevel * (elementState.level - 1);
        projectile.breakArmorDuration = elementCfg.breakArmor.duration;
      }
      if (elementCfg.burn) {
        projectile.burnDamagePerSec = elementCfg.burn.damagePerSecond + elementCfg.burn.bonusPerLevel * (elementState.level - 1);
        projectile.burnDuration = elementCfg.burn.duration;
      }
      if (elementCfg.splash) {
        projectile.splashRadius = elementCfg.splash.radius;
        projectile.splashPercent = elementCfg.splash.damagePercent + elementCfg.splash.bonusPerLevel * (elementState.level - 1);
      }
      if (elementCfg.slow) {
        projectile.slowPct = elementCfg.slow.pct;
        projectile.slowDuration = elementCfg.slow.duration;
      }
      if (elementCfg.knockback) {
        projectile.knockbackDistance = elementCfg.knockback.distance;
      }
      if (elementCfg.bounce) {
        projectile.bounceCount = elementCfg.bounce.maxBounces;
        projectile.maxBounces = elementCfg.bounce.maxBounces;
      }
    }
  }

  return projectile;
}

function createProjectilesForTower(tower: Tower, target: Enemy, labOverrides?: LabOverrides | null): Projectile[] {
  const baseConfig = getPlantRuntimeConfig(tower.type, labOverrides);
  const shotCount = Math.max(1, Math.floor(baseConfig?.shotCount ?? 1));
  if (shotCount === 1) {
    const projectile = createProjectileForTower(tower, target, labOverrides);
    return projectile ? [projectile] : [];
  }

  const center = (shotCount - 1) / 2;
  const projectiles: Projectile[] = [];
  for (let index = 0; index < shotCount; index += 1) {
    const offset = (index - center) * MULTI_SHOT_OFFSET;
    const projectile = createProjectileForTower(tower, target, labOverrides, offset);
    if (projectile) projectiles.push(projectile);
  }
  return projectiles;
}

function createRadialProjectilesForTower(tower: Tower, shotCount: number, labOverrides?: LabOverrides | null): Projectile[] {
  const count = Math.max(1, Math.floor(shotCount));
  const projectiles: Projectile[] = [];
  for (let index = 0; index < count; index += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    const projectile = createProjectileForTower(tower, {
      id: `radial-${index}`,
      pos: {
        x: tower.pos.x + direction.x,
        y: tower.pos.y + direction.y,
      },
    }, labOverrides);
    if (!projectile) continue;
    projectile.targetId = null;
    projectile.direction = direction;
    projectile.unguided = true;
    if (!projectile.piercing) projectile.pierceLimit = 1;
    projectiles.push(projectile);
  }
  return projectiles;
}

function distancePointToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  const sx = ax + clamped * dx;
  const sy = ay + clamped * dy;
  return Math.hypot(px - sx, py - sy);
}

function rewindEnemyAlongPath(enemy: Enemy, distance: number, path: Position[]) {
  if (distance <= 0) return;
  const totalLen = totalPathLength(path);
  const currentDistance = enemy.progress * totalLen;
  const targetDistance = Math.max(0, currentDistance - distance);
  let accum = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const segLen = segmentLength(path[i], path[i + 1]);
    if (accum + segLen >= targetDistance) {
      const remain = targetDistance - accum;
      const t = segLen === 0 ? 0 : remain / segLen;
      enemy.pathIndex = i;
      enemy.t = t;
      enemy.pos = lerp(path[i], path[i + 1], t);
      enemy.progress = totalLen === 0 ? 0 : targetDistance / totalLen;
      return;
    }
    accum += segLen;
  }
  enemy.pathIndex = path.length - 2;
  enemy.t = 0;
  enemy.pos = { ...path[path.length - 1] };
  enemy.progress = totalLen === 0 ? 0 : targetDistance / totalLen;
}

function hasArmorProfile(enemy: Enemy) {
  return (enemy.maxArmorHp ?? 0) > 0;
}

function getKnockbackDistanceMultiplier(enemy: Enemy) {
  return enemy.shape === 'windShield' && (enemy.armorHp ?? 0) > 0 ? 0.5 : 1;
}

function isSlowImmune(enemy: Enemy) {
  return enemy.shape === 'iceShell' || enemy.shape === 'freezer';
}

function isBurning(enemy: Enemy, gameTime: number) {
  return !!enemy.burnUntil && gameTime < enemy.burnUntil;
}

function getMonsterLevelMultiplier(level: number | undefined) {
  const normalizedLevel = Math.max(1, Math.floor(level || 1));
  return 1 + DIFFICULTY_CONFIG.LEVEL_MULTIPLIER * (normalizedLevel - 1);
}

function isArmorBreakActive(enemy: Enemy, gameTime: number) {
  return !!enemy.armorBreakUntil && gameTime < enemy.armorBreakUntil;
}

function applySlow(enemy: Enemy, pct: number, until: number) {
  if (isSlowImmune(enemy)) return;
  enemy.slowPct = Math.max(enemy.slowPct || 0, Math.max(0, Math.min(0.95, pct)));
  enemy.slowUntil = Math.max(enemy.slowUntil || 0, until);
}

function applyFreeze(enemy: Enemy, until: number) {
  if (isSlowImmune(enemy)) return;
  enemy.freezeUntil = Math.max(enemy.freezeUntil || 0, until);
}

function applyArmorBreak(enemy: Enemy, until: number, damageMultiplier?: number) {
  enemy.armorBreakUntil = Math.max(enemy.armorBreakUntil || 0, until);
  if (damageMultiplier != null) {
    enemy.armorBreakDamageMultiplier = Math.max(enemy.armorBreakDamageMultiplier || 1, damageMultiplier);
  }
}

function resetElectricSensitiveSpecial(enemy: Enemy, gameTime: number) {
  if (enemy.shape === 'healer') {
    enemy.specialTimer = gameTime + HEALER_SPECIAL_INTERVAL;
  } else if (enemy.shape === 'evilSniper') {
    enemy.specialTimer = gameTime + EVIL_SNIPER_SPECIAL_INTERVAL;
  }
}

function cleanseNegativeStatuses(enemy: Enemy) {
  enemy.slowPct = undefined;
  enemy.slowUntil = undefined;
  enemy.freezeUntil = undefined;
  enemy.armorBreakUntil = undefined;
  enemy.armorBreakDamageMultiplier = undefined;
  enemy.burnDamagePerSec = undefined;
  enemy.burnUntil = undefined;
  enemy.burnAccumulator = undefined;
}

function applyChannelElementEffect(tower: Tower, enemy: Enemy, gameTime: number, tickInterval: number) {
  if (!tower.element) return;
  const cfg = ELEMENT_PLANT_CONFIG[tower.element.type];
  if (!cfg) return;
  const until = gameTime + tickInterval + 0.05;

  if (tower.element.type === 'gold' && cfg.breakArmor) {
    const multiplier = cfg.breakArmor.multiplier + cfg.breakArmor.bonusPerLevel * (tower.element.level - 1);
    applyArmorBreak(enemy, until, multiplier);
  } else if (tower.element.type === 'ice' && cfg.slow) {
    applySlow(enemy, cfg.slow.pct, until);
  }
}

function clearExpiredArmorBreak(enemy: Enemy, gameTime: number) {
  if (enemy.armorBreakUntil && gameTime >= enemy.armorBreakUntil) {
    enemy.armorBreakUntil = undefined;
    enemy.armorBreakDamageMultiplier = undefined;
  }
}

function triggerAngryWriterArmorBreak(enemy: Enemy, beforeArmor: number, afterArmor: number, gameTime: number) {
  if (enemy.shape !== 'angryWriter') return;
  if (enemy.newspaperEnraged) return;
  if (beforeArmor <= 0 || afterArmor > 0) return;
  enemy.newspaperEnraged = true;
  enemy.newspaperStunUntil = gameTime + ANGRY_WRITER_STUN_DURATION;
}

function applyDamageWithArmor(enemy: Enemy, damage: number, gameTime: number) {
  let amount = Math.max(0, damage);
  if (amount <= 0) return 0;
  clearExpiredArmorBreak(enemy, gameTime);
  const armorBreakActive = isArmorBreakActive(enemy, gameTime);
  if ((enemy.shape === 'iceShell' || enemy.shape === 'freezer') && isBurning(enemy, gameTime)) {
    amount *= 2;
  }
  const beforeBody = Math.max(0, enemy.hp);
  const beforeArmor = Math.max(0, enemy.armorHp ?? 0);
  if (armorBreakActive && beforeArmor <= 0) {
    amount *= enemy.armorBreakDamageMultiplier || 1;
  }
  const shouldHitArmor = beforeArmor > 0 && !armorBreakActive;

  if (shouldHitArmor) {
    const armorDamage = Math.min(beforeArmor, amount);
    enemy.armorHp = beforeArmor - armorDamage;
    const spillover = amount - armorDamage;
    if (spillover > 0) {
      enemy.hp = Math.max(0, beforeBody - spillover);
    }
  } else {
    enemy.hp = Math.max(0, beforeBody - amount);
  }

  const afterBody = Math.max(0, enemy.hp);
  const afterArmor = Math.max(0, enemy.armorHp ?? 0);
  triggerAngryWriterArmorBreak(enemy, beforeArmor, afterArmor, gameTime);
  return beforeBody + beforeArmor - afterBody - afterArmor;
}

function lerp(a: Position, b: Position, t: number): Position {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function segmentLength(a: Position, b: Position): number {
  return getDistance(a.x, a.y, b.x, b.y);
}

function totalPathLength(path: Position[]): number {
  let s = 0;
  for (let i = 0; i < path.length - 1; i++) s += segmentLength(path[i], path[i + 1]);
  return s;
}

function getPathLocationAtProgress(path: Position[], progress: number) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const totalLen = totalPathLength(path);
  if (path.length < 2 || totalLen <= 0) {
    return { pos: { ...(path[0] ?? { x: 0, y: 0 }) }, pathIndex: 0, t: 0, progress: 0 };
  }

  const targetDistance = totalLen * clampedProgress;
  let traversed = 0;
  for (let index = 0; index < path.length - 1; index += 1) {
    const length = segmentLength(path[index], path[index + 1]);
    if (targetDistance <= traversed + length || index === path.length - 2) {
      const t = length > 0 ? Math.max(0, Math.min(1, (targetDistance - traversed) / length)) : 0;
      return {
        pos: lerp(path[index], path[index + 1], t),
        pathIndex: index,
        t,
        progress: clampedProgress,
      };
    }
    traversed += length;
  }

  const lastIndex = path.length - 2;
  return { pos: { ...path[path.length - 1] }, pathIndex: lastIndex, t: 1, progress: 1 };
}

function resolveSpawnPathId(pathId: number | undefined, paths: Position[][], enemies: Enemy[]) {
  const pathCount = paths.length;
  if (pathCount <= 1) return 0;
  if (Number.isInteger(pathId) && pathId != null && pathId >= 0 && pathId < pathCount) {
    return pathId;
  }

  let bestPathId = 0;
  let bestScore = Infinity;
  for (let index = 0; index < pathCount; index++) {
    const pathEnemies = enemies.filter(enemy => enemy.hp > 0 && enemy.pathId === index);
    const pressureScore = pathEnemies.length * 100 + pathEnemies.reduce((sum, enemy) => sum + enemy.progress, 0);
    if (pressureScore < bestScore) {
      bestScore = pressureScore;
      bestPathId = index;
    }
  }
  return bestPathId;
}

function createSpawnCursorsForWave(wave: WaveDef, startTime: number): SpawnCursor[] {
  if (!wave.groups.length) return [];
  const hasExplicitTiming = wave.groups.some(group => group.startDelay != null);
  if (hasExplicitTiming) {
    const cursors: SpawnCursor[] = [];
    let nextSequentialStart = 0;

    wave.groups.forEach((group, groupIndex) => {
      const count = Math.max(0, Math.floor(group.count || 0));
      const startDelay = group.startDelay != null
        ? Math.max(0, group.startDelay)
        : nextSequentialStart;

      if (count > 0) {
        cursors.push({
          groupIndex,
          nextSpawnTime: startTime + startDelay,
          remaining: count,
        });
      }

      const groupDuration = Math.max(0, count - 1) * Math.max(0, group.interval || 0);
      nextSequentialStart = Math.max(nextSequentialStart, startDelay + groupDuration + DEFAULT_GROUP_GAP_SECONDS);
    });

    return cursors;
  }

  const firstGroup = wave.groups[0];
  return [{
    groupIndex: 0,
    nextSpawnTime: startTime,
    remaining: Math.max(0, Math.floor(firstGroup.count || 0)),
  }].filter(cursor => cursor.remaining > 0);
}

type ActiveMapLayout = {
  paths: Position[][];
  mapWidth: number;
  mapHeight: number;
  roadWidthCells: number;
  plantGrid: Position[];
  activeMapId?: number;
  activeMapName?: string;
  towers: Tower[];
  plantCovers: PlantCover[];
};

function resolveFlexibleMapForWave(
  config: AtModeConfig | null | undefined,
  waveIndex: number,
  expectedSize: { w: number; h: number },
): MapSpec | null {
  if (getAtBaseModeType(config) !== 'flexible') return null;

  const flexible = config?.flexible;
  const compatibleMaps = (flexible?.mapIds ?? [])
    .map(mapId => MAPS.find(map => map.id === mapId))
    .filter((map): map is MapSpec => map !== undefined
      && map.size.w === expectedSize.w
      && map.size.h === expectedSize.h);

  if (compatibleMaps.length === 0) return null;
  if (flexible?.mode === 'random') {
    return compatibleMaps[Math.floor(Math.random() * compatibleMaps.length)] ?? null;
  }
  return compatibleMaps[Math.min(waveIndex, compatibleMaps.length - 1)] ?? null;
}

function switchFlexibleMapForWave(
  config: AtModeConfig | null | undefined,
  waveIndex: number,
  current: ActiveMapLayout,
): ActiveMapLayout {
  const nextMap = resolveFlexibleMapForWave(config, waveIndex, {
    w: current.mapWidth,
    h: current.mapHeight,
  });
  if (!nextMap) return current;

  const towers = current.towers.filter(tower => !isPositionCoveredByRoad(nextMap, tower.pos));
  const remainingTowerIds = new Set(towers.map(tower => tower.id));

  return {
    paths: normalizeMapPaths(nextMap.path),
    mapWidth: nextMap.size.w,
    mapHeight: nextMap.size.h,
    roadWidthCells: nextMap.roadWidthCells,
    plantGrid: getPlantGrid(nextMap),
    activeMapId: nextMap.id,
    activeMapName: nextMap.name,
    towers,
    plantCovers: current.plantCovers.filter(cover => remainingTowerIds.has(cover.towerId)),
  };
}

function getConveyorPool(config: AtModeConfig | null | undefined, plants: PlantType[], elements: ElementType[]) {
  const configuredPool = getAtBaseModeType(config) === 'conveyor' ? (config?.conveyor?.pool ?? []) : [];
  if (configuredPool.length > 0) return configuredPool;
  return [
    ...plants.map((id): ConveyorItem => ({ kind: 'plant', id, weight: 100 })),
    ...elements.map((id): ConveyorItem => ({ kind: 'element', id, weight: 100 })),
  ];
}

function getConveyorItemWeight(item: ConveyorItem) {
  const weight = Number(item.weight ?? 100);
  return Number.isFinite(weight) ? Math.max(1, weight) : 100;
}

function pickWeightedConveyorItem(pool: ConveyorItem[]) {
  const totalWeight = pool.reduce((sum, item) => sum + getConveyorItemWeight(item), 0);
  let roll = Math.random() * totalWeight;
  for (const item of pool) {
    roll -= getConveyorItemWeight(item);
    if (roll <= 0) return item;
  }
  return pool[pool.length - 1];
}

function getConveyorInterval(config: AtModeConfig | null | undefined) {
  return Math.max(0.2, getAtBaseModeType(config) === 'conveyor' ? (config?.conveyor?.intervalSec ?? 3) : 3);
}

function getConveyorMaxQueue(config: AtModeConfig | null | undefined) {
  return Math.max(1, Math.floor(getAtBaseModeType(config) === 'conveyor' ? (config?.conveyor?.maxQueue ?? 8) : 8));
}

function rollSpecialEnemyType(config?: SpecialEnemyConfig | null) {
  if (!config?.enabled) return undefined;
  const chance = Math.max(0, Math.min(1, Number(config.chance) || 0));
  return Math.random() < chance ? config.type : undefined;
}

function clampToMap(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function createSunPickup(
  source: SunPickup['source'],
  pos: Position,
  value: number,
  gameTime: number,
  mapWidth: number,
  mapHeight: number,
): SunPickup {
  const safePos = {
    x: clampToMap(pos.x, 0.6, Math.max(0.6, mapWidth - 0.6)),
    y: clampToMap(pos.y, 0.6, Math.max(0.6, mapHeight - 0.6)),
  };
  return {
    id: `sun-${Date.now()}-${Math.random()}`,
    pos: safePos,
    value: Math.max(0, Math.round(value)),
    source,
    createdAt: gameTime,
    expiresAt: source === 'sky' ? Number.POSITIVE_INFINITY : gameTime + PLANT_SUN_LIFETIME,
    falling: source === 'sky',
  };
}

function markSunCollected(pickup: SunPickup, gameTime: number): SunPickup {
  return {
    ...pickup,
    collecting: true,
    collectedAt: gameTime,
    collectFrom: { ...pickup.pos },
    falling: false,
    expiresAt: gameTime + SUN_COLLECT_ANIMATION,
  };
}

export interface TDStore extends TDState {
  startWave: () => void;
  placeTower: (type: PlantType, pos: Position) => void;
  placeTowerFromConveyor: (queueIndex: number, pos: Position) => void;
  applyElement: (element: ElementType, pos: Position) => void;
  applyElementFromConveyor: (queueIndex: number, pos: Position) => void;
  canPlaceTower: (pos: Position) => boolean;
  removeTower: (towerId: string) => void;
  collectSun: (sunId: string) => void;
  setAutoCollectSun: (enabled: boolean) => void;
  manualFireTower: (towerId: string) => void;
  update: (dt: number) => void;
  resetTD: () => void;
  loadLevel: (level: { startGold:number; lives:number; waves: WaveDef[] }, map: { path: Position[] | Position[][]; size:{w:number;h:number}; roadWidthCells:number; plantGrid: Position[] }, opts?: { autoStartFirstWave?: boolean; firstWaveDelaySec?: number; towerLevels?: TowerLevelMap; allowedPlants?: PlantType[]; allowedElements?: ElementType[]; mode?: GameMode; lifeBonusPerWave?: number; endlessWaveFactory?: (waveNumber: number) => WaveDef; labOverrides?: LabOverrides | null; atModeConfig?: AtModeConfig | null; specialEnemyConfig?: SpecialEnemyConfig | null; maxLives?: number; disableKillRewards?: boolean }) => void;
  togglePause: () => void;
}

const INITIAL_TD_STATE: TDState = {
  running: true,
  gameTime: 0,
  gold: 100,
  lives: 20,
  maxLives: 20,
  // 地图
  paths: [TD_PATH], // 包装成数组以符合类型定义
  mapWidth: MAP_CONFIG.width,
  mapHeight: MAP_CONFIG.height,
  roadWidthCells: 2,
  plantGrid: [], // 初始为空，loadLevel 时设置
  // 实体
  activeMapId: undefined,
  activeMapName: undefined,
  enemies: [],
  towers: [],
  plantCovers: [],
  projectiles: [],
  singleUseCasts: [],
  damagePopups: [],
  sunPickups: [],
  elementCooldowns: {},
  plantCooldowns: {},
  availablePlants: ['sunflower', 'bottleGrass'] as PlantType[],
  availableElements: [] as ElementType[],
  atModeConfig: null,
  specialEnemyConfig: null,
  conveyorQueue: [],
  nextConveyorItemAt: null,
  nextSkySunAt: SKY_SUN_INTERVAL,
  autoCollectSun: false,
  disableKillRewards: false,
  // 波次
  waves: DEFAULT_WAVES,
  waveIndex: 0,
  isWaveActive: false,
  nextWaveStartTime: null,
  spawnCursor: null,
  towerLevelMap: {},
  labOverrides: null,
  mode: 'campaign',
  lifeBonusPerWave: 0,
  wavesCleared: 0,
  endlessWaveFactory: null,
};

export const useTDStore = create<TDStore>((set, get) => ({
  ...INITIAL_TD_STATE,

  resetTD: () => set({ ...INITIAL_TD_STATE }),

  canPlaceTower: (pos: Position) => {
    const state = get();
    // 必须在可种植格子点上（允许 0.5 格误差）
    const isOnGrid = state.plantGrid.some(g => getDistance(g.x, g.y, pos.x, pos.y) < 0.5);
    if (!isOnGrid) return false;
    // 不能与已有塔重叠（同一格子点）
    if (state.towers.some(t => getDistance(t.pos.x, t.pos.y, pos.x, pos.y) < 0.5)) return false;
    return true;
  },

  removeTower: (towerId) => {
    const state = get();
    if (!state.towers.some(tower => tower.id === towerId)) return;
    const cover = state.plantCovers.find(item => item.towerId === towerId);
    if (cover) {
      set({ plantCovers: state.plantCovers.filter(item => item.id !== cover.id) });
      return;
    }
    set({
      towers: state.towers.filter(tower => tower.id !== towerId),
      plantCovers: state.plantCovers.filter(item => item.towerId !== towerId),
    });
  },

  collectSun: (sunId) => {
    const state = get();
    const target = state.sunPickups.find(pickup => pickup.id === sunId);
    if (!target || target.collecting || target.value <= 0) return;
    set({
      gold: state.gold + target.value,
      sunPickups: state.sunPickups.map(pickup => (
        pickup.id === sunId ? markSunCollected(pickup, state.gameTime) : pickup
      )),
    });
  },

  setAutoCollectSun: (enabled) => {
    set({ autoCollectSun: enabled });
  },

  loadLevel: (level, map, opts) => {
    const previousAutoCollectSun = get().autoCollectSun ?? false;
    const paths = normalizeMapPaths(map.path);
    const activeMap = MAPS.find(candidate => candidate.path === map.path);
    const atModeConfig = opts?.atModeConfig ?? null;
    const conveyorInterval = getConveyorInterval(atModeConfig);

    set({
      running: true,
      gameTime: 0,
      gold: level.startGold,
      lives: level.lives,
      maxLives: Math.max(level.lives, opts?.maxLives ?? level.lives),
      paths,
      mapWidth: map.size.w,
      mapHeight: map.size.h,
      roadWidthCells: map.roadWidthCells,
      plantGrid: map.plantGrid, // 设置可种植格子点
      activeMapId: activeMap?.id,
      activeMapName: activeMap?.name,
      enemies: [],
      towers: [],
      plantCovers: [],
      projectiles: [],
      singleUseCasts: [],
      damagePopups: [],
      sunPickups: [],
      elementCooldowns: {},
      plantCooldowns: {},
      availablePlants: opts?.allowedPlants ? [...opts.allowedPlants] : [...INITIAL_TD_STATE.availablePlants],
      availableElements: opts?.allowedElements ? [...opts.allowedElements] : [...INITIAL_TD_STATE.availableElements],
      atModeConfig,
      specialEnemyConfig: opts?.specialEnemyConfig ?? null,
      conveyorQueue: [],
      nextConveyorItemAt: getAtBaseModeType(atModeConfig) === 'conveyor' ? conveyorInterval : null,
      nextSkySunAt: SKY_SUN_INTERVAL,
      autoCollectSun: previousAutoCollectSun,
      disableKillRewards: opts?.disableKillRewards ?? false,
      waves: level.waves,
      waveIndex: 0,
      isWaveActive: false,
      nextWaveStartTime: opts?.autoStartFirstWave ? (0 + (opts.firstWaveDelaySec ?? 0.8)) : null,
      spawnCursor: null,
      towerLevelMap: opts?.towerLevels || {},
      labOverrides: opts?.labOverrides ?? null,
      mode: opts?.mode ?? 'campaign',
      lifeBonusPerWave: opts?.lifeBonusPerWave ?? 0,
      wavesCleared: 0,
      endlessWaveFactory: opts?.endlessWaveFactory ?? null,
    });
  },


  placeTower: (type, pos) => {
    const state = get();
    const base = getPlantRuntimeConfig(type as PlantType, state.labOverrides);
    if (!base) return;
    if (!state.availablePlants.includes(type)) return;
    const cost = base.cost;
    if (state.gold < cost) return;
    const cooldownReadyAt = state.plantCooldowns[type] ?? 0;
    if (cooldownReadyAt > state.gameTime) return;
    const placementCooldown = base.placementCooldown ?? 0;
    const nextPlantCooldowns = placementCooldown > 0
      ? { ...state.plantCooldowns, [type]: state.gameTime + placementCooldown }
      : state.plantCooldowns;
    if (base.overlayType === 'pumpkinHead') {
      const target = state.towers.find(tower => getDistance(tower.pos.x, tower.pos.y, pos.x, pos.y) <= 0.75);
      if (!target || isTowerProtected(target, state.plantCovers)) return;
      const cover: PlantCover = {
        id: `cover-${Date.now()}-${Math.random()}`,
        type: 'pumpkinHead',
        towerId: target.id,
      };
      set({
        plantCovers: [...state.plantCovers, cover],
        gold: state.gold - cost,
        plantCooldowns: nextPlantCooldowns,
      });
      return;
    }
    if (!get().canPlaceTower(pos)) return;

    const level = state.towerLevelMap?.[type] || 1;
    const tower = createTowerForPlacement(type, pos, level, state.gameTime, state.labOverrides);
    if (!tower) return;

    set({
      towers: [...state.towers, tower],
      gold: state.gold - cost,
      plantCooldowns: nextPlantCooldowns,
    });
  },

  placeTowerFromConveyor: (queueIndex, pos) => {
    const state = get();
    if (getAtBaseModeType(state.atModeConfig) !== 'conveyor') return;
    const item = state.conveyorQueue[queueIndex];
    if (!item || item.kind !== 'plant') return;
    const type = item.id;
    const base = getPlantRuntimeConfig(type, state.labOverrides);
    if (!base) return;
    if (!state.availablePlants.includes(type)) return;
    if (base.overlayType === 'pumpkinHead') {
      const target = state.towers.find(tower => getDistance(tower.pos.x, tower.pos.y, pos.x, pos.y) <= 0.75);
      if (!target || isTowerProtected(target, state.plantCovers)) return;
      const cover: PlantCover = {
        id: `cover-${Date.now()}-${Math.random()}`,
        type: 'pumpkinHead',
        towerId: target.id,
      };
      set({
        plantCovers: [...state.plantCovers, cover],
        conveyorQueue: state.conveyorQueue.filter((_, index) => index !== queueIndex),
      });
      return;
    }
    if (!get().canPlaceTower(pos)) return;

    const level = Math.max(1, Math.floor(state.towerLevelMap?.[type] || 1));
    const tower = createTowerForPlacement(type, pos, level, state.gameTime, state.labOverrides);
    if (!tower) return;

    set({
      towers: [...state.towers, tower],
      conveyorQueue: state.conveyorQueue.filter((_, index) => index !== queueIndex),
    });
  },

  applyElement: (elementType, pos) => {
    const state = get();
    const config = ELEMENT_PLANT_CONFIG[elementType];
    if (!config) return;
    if (!state.availableElements.includes(elementType)) return;
    const elementCost = config.cost;
    if (state.gold < elementCost) return;

    const targetIndex = state.towers.findIndex(tower => getDistance(tower.pos.x, tower.pos.y, pos.x, pos.y) <= 0.75);

    if (targetIndex !== -1) {
      const tower = state.towers[targetIndex];
      const towerConfig = getPlantRuntimeConfig(tower.type, state.labOverrides);
      if (towerConfig?.elementAllowed === false) return;
      if (towerConfig?.allowedElementTypes && !towerConfig.allowedElementTypes.includes(elementType)) return;
      if (tower.type === 'sunflower' && SUNFLOWER_ELEMENT_BLOCKLIST.has(elementType)) return;

      const towers = [...state.towers];
      const targetTower = towers[targetIndex];

      if (targetTower.element) {
        if (targetTower.element.type !== elementType) return;
        targetTower.element = {
          ...targetTower.element,
          level: targetTower.element.level + 1,
        };
      } else {
        targetTower.element = {
          type: elementType,
          level: 1,
          color: config.color,
          bulletColor: config.bulletColor,
        };
      }

      ensureTowerStats(targetTower, state.labOverrides);
      set({
        towers,
        gold: state.gold - elementCost,
      });
      return;
    }

    const cooldownReadyAt = state.elementCooldowns[elementType] ?? 0;
    if (cooldownReadyAt > state.gameTime) return;
    const levelKey = `element:${elementType}` as const;
    const elementLevel = Math.max(1, Math.floor(state.towerLevelMap?.[levelKey] || 1));

    const cast: ElementCast = {
      id: `cast-${Date.now()}-${Math.random()}`,
      element: elementType,
      pos: { ...pos },
      triggerTime: state.gameTime + 2,
      level: elementLevel,
    };

    set({
      singleUseCasts: [...state.singleUseCasts, cast],
      elementCooldowns: { ...state.elementCooldowns, [elementType]: state.gameTime + (ELEMENT_SINGLE_USE_COOLDOWN[elementType] || 20) },
      gold: state.gold - elementCost,
    });
  },

  applyElementFromConveyor: (queueIndex, pos) => {
    const state = get();
    if (getAtBaseModeType(state.atModeConfig) !== 'conveyor') return;
    const item = state.conveyorQueue[queueIndex];
    if (!item || item.kind !== 'element') return;
    const elementType = item.id;
    const config = ELEMENT_PLANT_CONFIG[elementType];
    if (!config) return;
    if (!state.availableElements.includes(elementType)) return;
    const levelKey = `element:${elementType}` as const;
    const elementLevel = Math.max(1, Math.floor(state.towerLevelMap?.[levelKey] || 1));

    const targetIndex = state.towers.findIndex(tower => getDistance(tower.pos.x, tower.pos.y, pos.x, pos.y) <= 0.75);

    if (targetIndex !== -1) {
      const tower = state.towers[targetIndex];
      const towerConfig = getPlantRuntimeConfig(tower.type, state.labOverrides);
      if (towerConfig?.elementAllowed === false) return;
      if (towerConfig?.allowedElementTypes && !towerConfig.allowedElementTypes.includes(elementType)) return;
      if (tower.type === 'sunflower' && SUNFLOWER_ELEMENT_BLOCKLIST.has(elementType)) return;

      const towers = [...state.towers];
      const targetTower = towers[targetIndex];

      if (targetTower.element) {
        if (targetTower.element.type !== elementType) return;
        targetTower.element = {
          ...targetTower.element,
          level: Math.max(targetTower.element.level + 1, elementLevel),
        };
      } else {
        targetTower.element = {
          type: elementType,
          level: elementLevel,
          color: config.color,
          bulletColor: config.bulletColor,
        };
      }

      ensureTowerStats(targetTower, state.labOverrides);
      set({
        towers,
        conveyorQueue: state.conveyorQueue.filter((_, index) => index !== queueIndex),
      });
      return;
    }

    const cooldownReadyAt = state.elementCooldowns[elementType] ?? 0;
    if (cooldownReadyAt > state.gameTime) return;

    const cast: ElementCast = {
      id: `cast-${Date.now()}-${Math.random()}`,
      element: elementType,
      pos: { ...pos },
      triggerTime: state.gameTime + 2,
      level: elementLevel,
    };

    set({
      singleUseCasts: [...state.singleUseCasts, cast],
      elementCooldowns: { ...state.elementCooldowns, [elementType]: state.gameTime + (ELEMENT_SINGLE_USE_COOLDOWN[elementType] || 20) },
      conveyorQueue: state.conveyorQueue.filter((_, index) => index !== queueIndex),
    });
  },

  manualFireTower: (towerId) => {
    const state = get();
    const index = state.towers.findIndex(t => t.id === towerId);
    if (index === -1) return;
    const tower = state.towers[index];
    if (tower.type !== 'sunlightFlower') return;
    if (isTowerFrozen(tower, state.gameTime)) return;
    const base = getPlantRuntimeConfig(tower.type, state.labOverrides);
    const abilityCost = base?.activeAbilityCost ?? 10;
    if (state.gold < abilityCost) return;

    const towerCopy: Tower = { ...tower };
    ensureTowerStats(towerCopy, state.labOverrides);

    const forcedTarget = findTaunterForTower(towerCopy, state.enemies, state.plantCovers);
    const inRange = state.enemies
      .filter(e => e.hp > 0 && getDistance(e.pos.x, e.pos.y, towerCopy.pos.x, towerCopy.pos.y) <= towerCopy.range)
      .sort((a, b) => b.progress - a.progress);
    const target = forcedTarget ?? inRange[0];
    if (!target) return;

    const newProjectiles = createProjectilesForTower(towerCopy, target, state.labOverrides);
    if (newProjectiles.length === 0) return;

    const towers = [...state.towers];
    towers[index] = { ...towerCopy, lastShotTime: state.gameTime };

    set({
      towers,
      projectiles: [...state.projectiles, ...newProjectiles],
      gold: state.gold - abilityCost,
    });
  },

  startWave: () => {
    const state = get();
    if (state.isWaveActive) return;
    if (state.waveIndex >= state.waves.length) return;
    const activeMap = switchFlexibleMapForWave(state.atModeConfig, state.waveIndex, {
      paths: state.paths,
      mapWidth: state.mapWidth,
      mapHeight: state.mapHeight,
      roadWidthCells: state.roadWidthCells,
      plantGrid: state.plantGrid,
      activeMapId: state.activeMapId,
      activeMapName: state.activeMapName,
      towers: state.towers,
      plantCovers: state.plantCovers,
    });
    const spawnCursors = createSpawnCursorsForWave(state.waves[state.waveIndex], state.gameTime);
    set({
      ...activeMap,
      isWaveActive: true,
      spawnCursor: spawnCursors.length > 0 ? spawnCursors : null,
    });
  },

  update: (dt: number) => {
    const state = get();
    if (!state.running) return;

    const prevGameTime = state.gameTime;
    let gameTime = prevGameTime + dt;
    let enemies = [...state.enemies];
    let towers = state.towers.map(tower => ({ ...tower }));
    let plantCovers = state.plantCovers.map(cover => ({ ...cover }));
    let projectiles = [...state.projectiles];
    let singleUseCasts = state.singleUseCasts.slice();
    let damagePopups = state.damagePopups.filter(p => p.until > gameTime);
    let sunPickups: SunPickup[] = state.sunPickups.map(pickup => ({
      ...pickup,
      pos: { ...pickup.pos },
      collectFrom: pickup.collectFrom ? { ...pickup.collectFrom } : undefined,
    }));
    let paths = state.paths.map(path => path.map(position => ({ ...position })));
    let mapWidth = state.mapWidth;
    let mapHeight = state.mapHeight;
    let roadWidthCells = state.roadWidthCells;
    let plantGrid = state.plantGrid.map(position => ({ ...position }));
    let activeMapId = state.activeMapId;
    let activeMapName = state.activeMapName;
    let elementCooldowns: Partial<Record<ElementType, number>> = { ...state.elementCooldowns };
    let plantCooldowns: Partial<Record<PlantType, number>> = { ...state.plantCooldowns };
    let gold = state.gold;
    let lives = state.lives;
    const maxLives = Math.max(1, state.maxLives ?? state.lives);
    let waveIndex = state.waveIndex;
    let isWaveActive = state.isWaveActive;
    let spawnCursor = state.spawnCursor ? state.spawnCursor.map(cursor => ({ ...cursor })) : null;
    let nextWaveStartTime = state.nextWaveStartTime ?? null;
    let waves = state.waves;
    const mode: GameMode = state.mode ?? 'campaign';
    const lifeBonusPerWave = state.lifeBonusPerWave ?? 0;
    const endlessWaveFactory = state.endlessWaveFactory ?? null;
    let wavesCleared = state.wavesCleared ?? 0;
    let conveyorQueue = state.conveyorQueue.slice();
    let nextConveyorItemAt = state.nextConveyorItemAt ?? null;
    let nextSkySunAt = state.nextSkySunAt ?? SKY_SUN_INTERVAL;
    const autoCollectSun = state.autoCollectSun ?? false;
    const atModeConfig = state.atModeConfig ?? null;
    const specialEnemyConfig = state.specialEnemyConfig ?? null;
    const disableKillRewards = state.disableKillRewards ?? false;
    const triggerEnemyDeathEffects = () => {
      enemies.forEach(enemy => {
        if (enemy.hp > 0 || enemy.deathEffectTriggered) return;
        enemy.deathEffectTriggered = true;
        if (enemy.specialType === 'charityAmbassador') {
          lives = Math.min(maxLives, lives + 1);
        }
        if (enemy.shape === 'igniter') {
          enemies.forEach(target => {
            if (target.id === enemy.id || target.hp <= 0) return;
            if (getDistance(target.pos.x, target.pos.y, enemy.pos.x, enemy.pos.y) > IGNITER_DEATH_RADIUS) return;
            target.speedBoostMultiplier = Math.max(target.speedBoostMultiplier || 1, IGNITER_DEATH_SPEED_MULTIPLIER);
            target.speedBoostUntil = Math.max(target.speedBoostUntil || 0, gameTime + IGNITER_DEATH_DURATION);
          });
        } else if (enemy.shape === 'freezer') {
          towers.forEach(tower => {
            if (isTowerProtected(tower, plantCovers)) return;
            applyTowerFreeze(tower, gameTime + FREEZER_DEATH_DURATION);
          });
        }
      });
    };

    towers.forEach(tower => {
      if (isTowerFrozen(tower, gameTime)) {
        pauseTowerTimers(tower, dt);
      } else if (tower.frozenUntil != null) {
        tower.frozenUntil = undefined;
      }
    });

    if (getAtBaseModeType(atModeConfig) === 'conveyor') {
      const interval = getConveyorInterval(atModeConfig);
      const maxQueue = getConveyorMaxQueue(atModeConfig);
      const pool = getConveyorPool(atModeConfig, state.availablePlants, state.availableElements);
      if (pool.length > 0) {
        if (nextConveyorItemAt == null) {
          nextConveyorItemAt = gameTime + interval;
        }
        while (nextConveyorItemAt != null && gameTime >= nextConveyorItemAt) {
          if (conveyorQueue.length >= maxQueue) {
            nextConveyorItemAt = gameTime + interval;
            break;
          }
          const nextItem = pickWeightedConveyorItem(pool);
          conveyorQueue.push({ ...nextItem });
          nextConveyorItemAt += interval;
        }
      }
    } else {
      conveyorQueue = [];
      nextConveyorItemAt = null;
    }

    while (nextSkySunAt != null && gameTime >= nextSkySunAt) {
      const x = 1 + Math.random() * Math.max(1, mapWidth - 2);
      sunPickups.push(createSunPickup('sky', { x, y: 0.7 }, SKY_SUN_VALUE, gameTime, mapWidth, mapHeight));
      nextSkySunAt += SKY_SUN_INTERVAL;
    }

    sunPickups = sunPickups.map(pickup => {
      if (pickup.collecting || pickup.source !== 'sky' || !pickup.falling) return pickup;
      const bottomY = Math.max(0.8, mapHeight - 0.8);
      const nextY = Math.min(bottomY, pickup.pos.y + SKY_SUN_FALL_SPEED * dt);
      if (nextY >= bottomY) {
        return {
          ...pickup,
          pos: { ...pickup.pos, y: bottomY },
          falling: false,
          landedAt: gameTime,
          expiresAt: gameTime + SKY_SUN_BOTTOM_LIFETIME,
        };
      }
      return { ...pickup, pos: { ...pickup.pos, y: nextY } };
    });

    if (towers.some(tower => tower.expiresAt != null && tower.expiresAt <= gameTime)) {
      const expiredTowers = towers.filter(tower => tower.expiresAt != null && tower.expiresAt <= gameTime);
      expiredTowers.forEach(tower => {
        const base = getPlantRuntimeConfig(tower.type, state.labOverrides);
        const effect = base?.instantEffect;
        if (!effect) return;

        const stats = computePlantStats(base, tower.level ?? 1);
        const damageColor = effect.type === 'radiusFrostBlast' ? '#3b82f6' : '#ef4444';
        enemies = enemies.map(enemy => {
          const affected = effect.type === 'crossDamage'
            ? Math.abs(enemy.pos.x - tower.pos.x) <= effect.tolerance || Math.abs(enemy.pos.y - tower.pos.y) <= effect.tolerance
            : getDistance(enemy.pos.x, enemy.pos.y, tower.pos.x, tower.pos.y) <= effect.radius;
          if (!affected || enemy.hp <= 0) return enemy;

          const nextEnemy: Enemy = { ...enemy };
          const inflicted = applyDamageWithArmor(nextEnemy, stats.damage, gameTime);
          if (effect.type === 'radiusFrostBlast') {
            applyFreeze(nextEnemy, gameTime + effect.freezeDuration);
            applySlow(nextEnemy, effect.slowPct, gameTime + effect.slowDuration);
          }
          damagePopups = [...damagePopups, {
            id: `popup-${Date.now()}-${Math.random()}`,
            pos: { ...nextEnemy.pos },
            damage: Math.round(inflicted),
            color: damageColor,
            until: gameTime + 0.6,
          }];
          if (nextEnemy.hp <= 0 && !nextEnemy.rewardGiven) {
            nextEnemy.rewardGiven = true;
            gold += rewardForEnemy(nextEnemy, disableKillRewards);
          }
          return nextEnemy;
        });
      });
      towers = towers.filter(tower => tower.expiresAt == null || tower.expiresAt > gameTime);
    }
    triggerEnemyDeathEffects();
    towers.forEach(t => ensureTowerStats(t, state.labOverrides));

    // A cyclone field immediately disperses any active wind pressure it reaches.
    enemies.forEach(enemy => {
      if (enemy.windPressure && isCoveredByCycloneField(enemy.windPressure.pos, towers, gameTime)) {
        enemy.windPressure = undefined;
      }
    });

    const controlAuraSlowByEnemy = new Map<string, number>();
    towers.forEach(tower => {
      if (isTowerFrozen(tower, gameTime)) return;
      const base = getPlantRuntimeConfig(tower.type, state.labOverrides);
      const aura = base?.controlAura;
      if (!aura) return;

      const level = Math.max(1, tower.level ?? 1);
      const slowPct = Math.min(0.95, aura.slowPct + aura.slowBonusPerLevel * (level - 1));
      const knockbackDistance = aura.knockbackDistance + aura.knockbackBonusPerLevel * (level - 1);
      const pulseDue = (gameTime - (tower.controlAuraLastPulseTime ?? 0)) >= aura.pulseInterval;

      enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;
        if (getDistance(enemy.pos.x, enemy.pos.y, tower.pos.x, tower.pos.y) > tower.range) return;
        controlAuraSlowByEnemy.set(enemy.id, Math.max(controlAuraSlowByEnemy.get(enemy.id) ?? 0, slowPct));
        if (pulseDue && knockbackDistance > 0) {
          const path = paths[enemy.pathId];
          rewindEnemyAlongPath(enemy, knockbackDistance * getKnockbackDistanceMultiplier(enemy), path);
        }
      });

      if (pulseDue) {
        tower.controlAuraLastPulseTime = gameTime;
      }
    });
    controlAuraSlowByEnemy.forEach((slowPct, enemyId) => {
      const enemy = enemies.find(item => item.id === enemyId);
      if (!enemy || enemy.hp <= 0) return;
      applySlow(enemy, slowPct, gameTime + 0.25);
    });

    towers.forEach(tw => {
      if (isTowerFrozen(tw, gameTime)) return;
      if (!tw.incomeInterval || tw.incomeInterval <= 0) return;
      const incomeConfig = getPlantRuntimeConfig(tw.type, state.labOverrides);
      const incomeLevel = Math.max(1, tw.level ?? 1);
      const intervalFloor = Math.max(0.1, incomeConfig?.incomeIntervalFloor ?? 0.1);
      const levelInterval = Math.max(
        intervalFloor,
        tw.incomeInterval - (incomeConfig?.incomeIntervalReductionPerLevel ?? 0) * (incomeLevel - 1),
      );
      const speedBoost = getSunflowerSpeedBoost(tw, towers, gameTime, state.labOverrides);
      const interval = Math.max(intervalFloor, levelInterval / (1 + speedBoost));
      const lastIncomeTime = tw.lastIncomeTime ?? prevGameTime;
      if (gameTime - lastIncomeTime < interval) return;
      const cycles = Math.floor((gameTime - lastIncomeTime) / interval);
      if (cycles <= 0) return;
      const perTick = (tw.incomeBase ?? 0) + (tw.incomeBonusPerLevel ?? 0) * (incomeLevel - 1);
      if (perTick <= 0) {
        tw.lastIncomeTime = lastIncomeTime + cycles * interval;
        return;
      }
      for (let cycle = 0; cycle < cycles; cycle += 1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.22 + Math.random() * 0.45;
        sunPickups.push(createSunPickup(
          'plant',
          {
            x: tw.pos.x + Math.cos(angle) * radius,
            y: tw.pos.y + Math.sin(angle) * radius,
          },
          perTick,
          gameTime,
          mapWidth,
          mapHeight,
        ));
      }
      tw.lastIncomeTime = lastIncomeTime + cycles * interval;
    });

    if (autoCollectSun) {
      sunPickups = sunPickups.map(pickup => {
        if (pickup.collecting || pickup.value <= 0) return pickup;
        if (gameTime - pickup.createdAt < AUTO_COLLECT_DELAY) return pickup;
        gold += pickup.value;
        return markSunCollected(pickup, gameTime);
      });
    }

    sunPickups = sunPickups.filter(pickup => {
      if (pickup.collecting) {
        return gameTime < (pickup.collectedAt ?? pickup.createdAt) + SUN_COLLECT_ANIMATION;
      }
      return gameTime < pickup.expiresAt;
    });

    // auto start scheduled next wave
    if (!isWaveActive && waveIndex < waves.length && nextWaveStartTime !== null && gameTime >= nextWaveStartTime) {
      const activeMap = switchFlexibleMapForWave(atModeConfig, waveIndex, {
        paths,
        mapWidth,
        mapHeight,
        roadWidthCells,
        plantGrid,
        activeMapId,
        activeMapName,
        towers,
        plantCovers,
      });
      paths = activeMap.paths;
      mapWidth = activeMap.mapWidth;
      mapHeight = activeMap.mapHeight;
      roadWidthCells = activeMap.roadWidthCells;
      plantGrid = activeMap.plantGrid;
      activeMapId = activeMap.activeMapId;
      activeMapName = activeMap.activeMapName;
      towers = activeMap.towers;
      plantCovers = activeMap.plantCovers;
      const spawnCursors = createSpawnCursorsForWave(waves[waveIndex], gameTime);
      isWaveActive = true;
      spawnCursor = spawnCursors.length > 0 ? spawnCursors : null;
      nextWaveStartTime = null;
    }

    //  handle spawning
    if (isWaveActive && waveIndex < waves.length && spawnCursor && spawnCursor.length > 0) {
      const wave = waves[waveIndex];
      const hasExplicitTiming = wave.groups.some(group => group.startDelay != null);
      const nextSpawnCursors: SpawnCursor[] = [];

      spawnCursor.forEach(cursor => {
        const g = wave.groups[cursor.groupIndex];
        if (!g || cursor.remaining <= 0) return;

        let nextCursor = cursor;
        if (gameTime >= cursor.nextSpawnTime) {
          const baseStats = getMonsterRuntimeStats(g.type, state.labOverrides);
          const mul = getMonsterLevelMultiplier(g.level);
          const hp = Math.round(baseStats.hp * mul);
          const armorHp = baseStats.armorHp != null ? Math.round(baseStats.armorHp * mul) : undefined;
          const phantomSpawn = isPhantomAtMode(atModeConfig);
          const useAutomaticPath = getAtBaseModeType(atModeConfig) === 'flexible';
          const pathId = phantomSpawn
            ? Math.floor(Math.random() * paths.length)
            : resolveSpawnPathId(useAutomaticPath ? undefined : g.pathId, paths, enemies);
          const path = paths[pathId];
          const spawnLocation = getPathLocationAtProgress(
            path,
            phantomSpawn
              ? Math.random() * (g.isBoss ? PHANTOM_BOSS_MAX_PROGRESS : PHANTOM_NORMAL_MAX_PROGRESS)
              : 0,
          );
          const enemy: Enemy = {
            id: `e-${Date.now()}-${Math.random()}`,
            pos: spawnLocation.pos,
            hp,
            maxHp: hp,
            armorHp,
            maxArmorHp: armorHp,
            speed: g.isBoss && g.bossSpeed != null ? Math.max(0.1, g.bossSpeed) : baseStats.speed,
            shape: g.type,
            leakDamage: g.leakDamage ?? baseStats.leakDamage,
            level: g.level,
            isBoss: !!g.isBoss,
            specialType: rollSpecialEnemyType(specialEnemyConfig),
            pathIndex: spawnLocation.pathIndex,
            t: spawnLocation.t,
            progress: spawnLocation.progress,
            pathId, // 记录该敌人走的路径ID
          };
          if (enemy.shape === 'healer') {
            enemy.specialTimer = gameTime + HEALER_SPECIAL_INTERVAL;
          } else if (enemy.shape === 'evilSniper') {
            enemy.specialTimer = gameTime + EVIL_SNIPER_SPECIAL_INTERVAL;
          } else if (enemy.shape === 'summoner') {
            enemy.specialTimer = gameTime + SUMMONER_SPECIAL_INTERVAL;
          } else if (enemy.shape === 'purifier') {
            enemy.specialTimer = gameTime + PURIFIER_CLEANSE_INTERVAL;
          } else if (enemy.shape === 'freezer') {
            enemy.specialTimer = gameTime + FREEZER_SPECIAL_INTERVAL;
          } else if (enemy.shape === 'windEye') {
            enemy.specialTimer = gameTime + WIND_EYE_FIRST_PRESSURE_DELAY;
          }
          enemies.push(enemy);
          nextCursor = {
            ...cursor,
            remaining: cursor.remaining - 1,
            nextSpawnTime: gameTime + g.interval,
          };
        }

        if (nextCursor.remaining <= 0) {
          if (!hasExplicitTiming) {
            const nextGroupIndex = nextCursor.groupIndex + 1;
            const nextGroup = wave.groups[nextGroupIndex];
            if (nextGroup) {
              nextSpawnCursors.push({
                groupIndex: nextGroupIndex,
                nextSpawnTime: gameTime + DEFAULT_GROUP_GAP_SECONDS,
                remaining: Math.max(0, Math.floor(nextGroup.count || 0)),
              });
            }
          }
        } else {
          nextSpawnCursors.push(nextCursor);
        }
      });

      spawnCursor = nextSpawnCursors.length > 0 ? nextSpawnCursors : null;
    }

    //  advance enemies along path
    enemies = enemies
      .map(e => {
        const path = paths[e.pathId]; // 使用敌人自己的路径
        const totalLen = totalPathLength(path);
        // slow effect decay
        const frozen = !isSlowImmune(e) && !!e.freezeUntil && gameTime < e.freezeUntil;
        const slowed = !isSlowImmune(e) && !!e.slowUntil && gameTime < e.slowUntil;
        const newspaperStunned = e.shape === 'angryWriter' && !!e.newspaperStunUntil && gameTime < e.newspaperStunUntil;
        const baseSpeed = e.shape === 'angryWriter' && e.newspaperEnraged && !newspaperStunned
          ? ANGRY_WRITER_ENRAGED_SPEED
          : e.speed;
        const slowFactor = frozen ? 0 : slowed ? (1 - (e.slowPct || 0)) : 1;
        const boostMultiplier = e.speedBoostUntil && gameTime < e.speedBoostUntil ? (e.speedBoostMultiplier || 1) : 1;
        const pressureMultiplier = getWindPressureEnemySpeedMultiplier(e, enemies);
        const speed = newspaperStunned ? 0 : baseSpeed * slowFactor * boostMultiplier * pressureMultiplier;
        let i = e.pathIndex;
        let t = e.t + (speed * dt) / Math.max(0.0001, segmentLength(path[i], path[i + 1]));
        let reached = false;
        let pos = e.pos;
        while (t >= 1 && i < path.length - 2) {
          i += 1;
          t -= 1;
        }
        if (i >= path.length - 2 && t >= 1) {
          reached = true;
        }
        if (!reached) {
          pos = lerp(path[i], path[i + 1], t);
        }
        const prevSegments = (() => {
          let s = 0;
          for (let k = 0; k < i; k++) s += segmentLength(path[k], path[k + 1]);
          return s + segmentLength(path[i], path[i + 1]) * t;
        })();
        const progress = prevSegments / totalLen;
        return { ...e, pos, pathIndex: i, t, progress };
      })
      .filter(e => {
        // reached end -> lose life
        const path = paths[e.pathId]; // 使用敌人自己的路径
        const atEnd = e.pathIndex >= path.length - 2 && e.t >= 1;
        if (atEnd) lives -= e.leakDamage ?? 1;
        return !atEnd && e.hp > 0;
      });

    enemies.forEach(e => {
      if (e.slowUntil && gameTime >= e.slowUntil) {
        e.slowUntil = undefined;
        e.slowPct = undefined;
      }
      if (e.freezeUntil && gameTime >= e.freezeUntil) {
        e.freezeUntil = undefined;
      }
      if (e.armorBreakUntil && gameTime >= e.armorBreakUntil) {
        e.armorBreakUntil = undefined;
        e.armorBreakDamageMultiplier = undefined;
      }
      if (e.speedBoostUntil && gameTime >= e.speedBoostUntil) {
        e.speedBoostUntil = undefined;
        e.speedBoostMultiplier = undefined;
      }
      if (e.newspaperStunUntil && gameTime >= e.newspaperStunUntil) {
        e.newspaperStunUntil = undefined;
      }
      if (e.burnDamagePerSec && e.burnUntil) {
        const burnStart = prevGameTime;
        const burnEnd = Math.min(gameTime, e.burnUntil);
        if (burnEnd > burnStart) {
          const burnDuration = burnEnd - burnStart;
          const dmg = e.burnDamagePerSec * burnDuration;
          applyDamageWithArmor(e, dmg, burnEnd);
          if (e.hp <= 0 && !e.rewardGiven) {
            e.rewardGiven = true;
            gold += rewardForEnemy(e, disableKillRewards);
          }
        }
        if (gameTime >= e.burnUntil) {
          e.burnDamagePerSec = undefined;
          e.burnUntil = undefined;
          e.burnAccumulator = undefined;
        }
      }
    });

    const addDamagePopup = (position: Position, amount: number, color: string) => {
      damagePopups = [...damagePopups, {
        id: `popup-${Date.now()}-${Math.random()}`,
        pos: { ...position },
        damage: Math.round(amount),
        color,
        until: gameTime + 0.6,
      }];
    };

    const dealDamage = (enemy: Enemy, amount: number, color?: string) => {
      if (amount <= 0 || enemy.hp <= 0) return 0;
      const inflicted = applyDamageWithArmor(enemy, amount, gameTime);
      if (color) addDamagePopup(enemy.pos, inflicted, color);
      if (enemy.hp <= 0 && !enemy.rewardGiven) {
        enemy.rewardGiven = true;
        gold += rewardForEnemy(enemy, disableKillRewards);
      }
      return inflicted;
    };

    const pendingCasts: ElementCast[] = [];
    singleUseCasts.forEach(cast => {
      if (gameTime < cast.triggerTime) {
        pendingCasts.push(cast);
        return;
      }
      switch (cast.element) {
        case 'ice': {
          const damage = 20 + 4 * cast.level;
          enemies.forEach(enemy => {
            dealDamage(enemy, damage, '#1e3a8a');
            applyFreeze(enemy, gameTime + 4);
          });
          addDamagePopup(cast.pos, damage, '#3b82f6');
          break;
        }
        case 'fire': {
          const radius = 4.4;
          const damage = 800 + 50 * cast.level;
          enemies.forEach(enemy => {
            if (getDistance(enemy.pos.x, enemy.pos.y, cast.pos.x, cast.pos.y) <= radius) {
              dealDamage(enemy, damage, '#ef4444');
            }
          });
          break;
        }
        case 'wind': {
          const damage = 20 + 4 * cast.level;
          enemies.forEach(enemy => {
            const path = paths[enemy.pathId];
            rewindEnemyAlongPath(enemy, 1.6 * getKnockbackDistanceMultiplier(enemy), path);
            dealDamage(enemy, damage, '#10b981');
          });
          addDamagePopup(cast.pos, damage, '#10b981');
          break;
        }
        case 'gold': {
          const duration = 5 + 0.2 * cast.level;
          const multiplier = 1.5 + 0.1 * Math.max(0, cast.level - 1);
          enemies.forEach(enemy => {
            applyArmorBreak(enemy, gameTime + duration, multiplier);
          });
          addDamagePopup(cast.pos, Math.round(duration * 10) / 10, '#f59e0b');
          break;
        }
        case 'electric': {
          const damage = 200 + 20 * cast.level;
          enemies.forEach(enemy => {
            dealDamage(enemy, damage, '#8b5cf6');
          });
          break;
        }
        case 'light': {
          const goldBonus = 400;
          gold += goldBonus;
          addDamagePopup(cast.pos, goldBonus, '#fde047');
          break;
        }
      }
    });
    singleUseCasts = pendingCasts;

    let towersModified = false;
    enemies.forEach(enemy => {
      if (enemy.hp <= 0) return;
      if (enemy.shape === 'healer') {
        const interval = HEALER_SPECIAL_INTERVAL;
        if ((enemy.specialTimer ?? 0) <= gameTime) {
          const healRadius = 2.8;
          const healAmount = Math.max(18, Math.ceil(enemy.maxHp * 0.06));
          enemies.forEach(target => {
            if (target.id === enemy.id) return;
            if (getDistance(target.pos.x, target.pos.y, enemy.pos.x, enemy.pos.y) <= healRadius) {
              target.hp = Math.min(target.maxHp, target.hp + healAmount);
            }
          });
          enemy.specialTimer = gameTime + interval;
        }
      } else if (enemy.shape === 'evilSniper') {
        if ((enemy.specialTimer ?? 0) <= gameTime) {
          const destroyableTowers = towers.filter(tower => (
            !getPlantRuntimeConfig(tower.type, state.labOverrides)?.instantEffect
            && !isTowerProtected(tower, plantCovers)
          ));
          if (destroyableTowers.length > 0) {
            const target = destroyableTowers[Math.floor(Math.random() * destroyableTowers.length)];
            towers = towers.filter(tower => tower.id !== target.id);
            towersModified = true;
          }
          enemy.specialTimer = gameTime + EVIL_SNIPER_SPECIAL_INTERVAL;
        }
      } else if (enemy.shape === 'rager') {
        const auraRadius = 3.6;
        enemies.forEach(target => {
          if (target.id === enemy.id) return;
          if (getDistance(target.pos.x, target.pos.y, enemy.pos.x, enemy.pos.y) <= auraRadius) {
            const currentMultiplier = target.speedBoostMultiplier || 1;
            const nextMultiplier = Math.max(currentMultiplier, 2);
            target.speedBoostMultiplier = nextMultiplier;
            target.speedBoostUntil = Math.max(target.speedBoostUntil || 0, gameTime + 0.6);
          }
        });
      } else if (enemy.shape === 'summoner') {
        const interval = SUMMONER_SPECIAL_INTERVAL;
        if ((enemy.specialTimer ?? 0) <= gameTime) {
          // 召唤一个与自己等级相同的circle怪，出现在召唤者前方0.5格
          const path = paths[enemy.pathId];
          const currentIndex = enemy.pathIndex;
          const currentT = enemy.t;

          // 计算召唤者前方位置（沿路径前进0.5格）
          let spawnPos = { ...enemy.pos };
          let spawnPathIndex = currentIndex;
          let spawnT = currentT;

          // 简单前进0.5格距离
          const segLen = segmentLength(path[currentIndex], path[currentIndex + 1]);
          if (segLen > 0) {
            const advance = 0.5 / segLen;
            spawnT = currentT + advance;
            if (spawnT >= 1 && currentIndex < path.length - 2) {
              spawnPathIndex = currentIndex + 1;
              spawnT = spawnT - 1;
            } else if (spawnT >= 1) {
              spawnT = 0.99;
            }
            spawnPos = lerp(path[spawnPathIndex], path[spawnPathIndex + 1], spawnT);
          }

          // 创建召唤的circle怪物
          const baseStats = getMonsterRuntimeStats('circle', state.labOverrides);
          const mul = getMonsterLevelMultiplier(enemy.level);
          const summonedHp = Math.round(baseStats.hp * mul);
          const totalLen = totalPathLength(path);
          const prevSegments = (() => {
            let s = 0;
            for (let k = 0; k < spawnPathIndex; k++) s += segmentLength(path[k], path[k + 1]);
            return s + segmentLength(path[spawnPathIndex], path[spawnPathIndex + 1]) * spawnT;
          })();
          const spawnProgress = prevSegments / totalLen;

          const summonedEnemy: Enemy = {
            id: `e-summoned-${Date.now()}-${Math.random()}`,
            pos: spawnPos,
            hp: summonedHp,
            maxHp: summonedHp,
            speed: baseStats.speed,
            shape: 'circle',
            leakDamage: baseStats.leakDamage,
            level: enemy.level,
            specialType: rollSpecialEnemyType(specialEnemyConfig),
            pathIndex: spawnPathIndex,
            t: spawnT,
            progress: spawnProgress,
            pathId: enemy.pathId,
          };
          enemies.push(summonedEnemy);
          enemy.specialTimer = gameTime + interval;
        }
      } else if (enemy.shape === 'purifier') {
        if ((enemy.specialTimer ?? 0) <= gameTime) {
          enemies.forEach(target => {
            if (target.hp <= 0) return;
            if (getDistance(target.pos.x, target.pos.y, enemy.pos.x, enemy.pos.y) > PURIFIER_CLEANSE_RADIUS) return;
            cleanseNegativeStatuses(target);
          });
          enemy.specialTimer = gameTime + PURIFIER_CLEANSE_INTERVAL;
        }
      } else if (enemy.shape === 'freezer') {
        if ((enemy.specialTimer ?? 0) <= gameTime) {
          towers.forEach(tower => {
            if (isTowerProtected(tower, plantCovers)) return;
            if (getDistance(tower.pos.x, tower.pos.y, enemy.pos.x, enemy.pos.y) > FREEZER_SPECIAL_RADIUS) return;
            applyTowerFreeze(tower, gameTime + FREEZER_SPECIAL_DURATION);
          });
          enemy.specialTimer = gameTime + FREEZER_SPECIAL_INTERVAL;
        }
      } else if (enemy.shape === 'windEye') {
        if ((enemy.specialTimer ?? 0) <= gameTime) {
          if (!isCoveredByCycloneField(enemy.pos, towers, gameTime)) {
            enemy.windPressure = {
              pos: { ...enemy.pos },
              radius: WIND_EYE_PRESSURE_RADIUS,
            };
          }
          enemy.specialTimer = gameTime + WIND_EYE_PRESSURE_INTERVAL;
        }
      }
    });
    if (towersModified) {
      towers = [...towers];
    }

    // ᚻ 植物发射子弹
    towers.forEach(tw => {
      if (isTowerFrozen(tw, gameTime)) return;
      ensureTowerStats(tw, state.labOverrides);
      const baseConfig = getPlantRuntimeConfig(tw.type, state.labOverrides);
      const fireRateMultiplier = (1 + getFireRateAuraBonus(tw, towers, gameTime, state.labOverrides))
        * getWindPressureTowerFireRateMultiplier(tw, enemies, plantCovers);
      const forcedTarget = findTaunterForTower(tw, enemies, plantCovers);
      const channelAttack = baseConfig?.channelAttack;
      if (channelAttack) {
        const locked = tw.lockedTargetId ? enemies.find(e => e.id === tw.lockedTargetId && e.hp > 0) : undefined;
        const lockedValid = locked && !forcedTarget && getDistance(locked.pos.x, locked.pos.y, tw.pos.x, tw.pos.y) <= tw.range;
        let target: Enemy | undefined = forcedTarget ?? (lockedValid ? locked : undefined);

        if (forcedTarget) {
          if (tw.lockedTargetId !== forcedTarget.id) {
            tw.channelDamagePct = channelAttack.initialDamagePct;
            tw.channelNextTickTime = gameTime;
          }
          tw.lockedTargetId = forcedTarget.id;
          tw.channelDamagePct ??= channelAttack.initialDamagePct;
          tw.channelNextTickTime ??= gameTime;
        }

        if (!target) {
          tw.lockedTargetId = undefined;
          tw.channelDamagePct = undefined;
          tw.channelNextTickTime = undefined;

          const inRange = enemies
            .filter(e => e.hp > 0 && getDistance(e.pos.x, e.pos.y, tw.pos.x, tw.pos.y) <= tw.range)
            .sort((a, b) => b.progress - a.progress);
          target = inRange[0];
          if (target) {
            tw.lockedTargetId = target.id;
            tw.channelDamagePct = channelAttack.initialDamagePct;
            tw.channelNextTickTime = gameTime;
          }
        }

        if (!target) return;
        const tickInterval = channelAttack.tickInterval / fireRateMultiplier;
        applyChannelElementEffect(tw, target, gameTime, tickInterval);
        const nextTick = tw.channelNextTickTime ?? gameTime;
        if (gameTime + 0.0001 < nextTick) return;

        const pct = Math.max(channelAttack.initialDamagePct, tw.channelDamagePct ?? channelAttack.initialDamagePct);
        const damage = tw.damage * Math.min(1, pct);
        dealDamage(target, damage, channelAttack.color);
        tw.lastShotTime = gameTime;
        tw.channelDamagePct = Math.min(1, pct + channelAttack.rampPctPerTick);
        tw.channelNextTickTime = gameTime + tickInterval;
        if (target.hp <= 0) {
          tw.lockedTargetId = undefined;
          tw.channelDamagePct = undefined;
          tw.channelNextTickTime = undefined;
        }
        return;
      }
      if (tw.type === 'sniper' && !forcedTarget) {
        const locked = tw.lockedTargetId ? enemies.find(e => e.id === tw.lockedTargetId) : undefined;
        const lockedValid = locked && locked.hp > 0 && getDistance(locked.pos.x, locked.pos.y, tw.pos.x, tw.pos.y) <= tw.range;
        if (!lockedValid) {
          let best: Enemy | null = null;
          for (const enemy of enemies) {
            if (enemy.hp > 0 && getDistance(enemy.pos.x, enemy.pos.y, tw.pos.x, tw.pos.y) <= tw.range) {
              if (!best || enemy.hp > best.hp) {
                best = enemy;
              }
            }
          }
          tw.lockedTargetId = best ? best.id : undefined;
        }
      }
      if (tw.fireRate <= 0 || tw.damage <= 0) return;
      const cooldown = tw.fireRate > 0 ? 1 / (tw.fireRate * fireRateMultiplier) : Infinity;
      if (gameTime - tw.lastShotTime < cooldown) return;
      if (baseConfig?.radialShotCount) {
        tw.lastShotTime = gameTime;
        projectiles.push(...createRadialProjectilesForTower(tw, baseConfig.radialShotCount, state.labOverrides));
        return;
      }
      let target: Enemy | undefined = forcedTarget;
      if (!target && tw.type === 'sniper') {
        if (tw.lockedTargetId) {
          const locked = enemies.find(e => e.id === tw.lockedTargetId && e.hp > 0);
          if (locked && getDistance(locked.pos.x, locked.pos.y, tw.pos.x, tw.pos.y) <= tw.range) {
            target = locked;
          }
        }
        if (!target) {
          let best: Enemy | null = null;
          for (const enemy of enemies) {
            if (enemy.hp > 0 && getDistance(enemy.pos.x, enemy.pos.y, tw.pos.x, tw.pos.y) <= tw.range) {
              if (!best || enemy.hp > best.hp) {
                best = enemy;
              }
            }
          }
          if (best) {
            target = best;
            tw.lockedTargetId = best.id;
          } else {
            tw.lockedTargetId = undefined;
            return;
          }
        }
      } else if (!target) {
        const inRange = enemies.filter(e => e.hp > 0 && getDistance(e.pos.x, e.pos.y, tw.pos.x, tw.pos.y) <= tw.range);
        if (inRange.length === 0) return;
        const towerConfig = getPlantRuntimeConfig(tw.type, state.labOverrides);
        const priorityTargets = towerConfig?.targetPriority === 'armorFirst'
          ? inRange.filter(enemy => hasArmorProfile(enemy))
          : inRange;
        const candidates = priorityTargets.length > 0 ? priorityTargets : inRange;
        candidates.sort((a, b) => b.progress - a.progress);
        target = candidates[0];
      }

      tw.lastShotTime = gameTime;

      const newProjectiles = target ? createProjectilesForTower(tw, target, state.labOverrides) : [];
      if (newProjectiles.length > 0) {
        projectiles.push(...newProjectiles);
      }
    });

    const applyProjectileDamage = (enemy: Enemy, damageAmount: number, projectile: Projectile, impactTime: number, directHit = true) => {
      if (damageAmount <= 0 || enemy.hp <= 0) return;
      if (projectile.breakArmorDuration) {
        applyArmorBreak(enemy, impactTime + projectile.breakArmorDuration, projectile.breakArmorDamageMultiplier);
      }
      if (projectile.burnDamagePerSec && projectile.burnDuration) {
        enemy.burnDamagePerSec = projectile.burnDamagePerSec;
        enemy.burnUntil = impactTime + projectile.burnDuration;
      }
      if (directHit && projectile.elementType === 'electric') {
        resetElectricSensitiveSpecial(enemy, impactTime);
      }
      applyDamageWithArmor(enemy, damageAmount, impactTime);
      if (projectile.slowPct && projectile.slowDuration) {
        const until = impactTime + projectile.slowDuration;
        applySlow(enemy, projectile.slowPct, until);
      }
      if (projectile.knockbackDistance && projectile.knockbackDistance > 0) {
        const path = paths[enemy.pathId];
        rewindEnemyAlongPath(enemy, projectile.knockbackDistance * getKnockbackDistanceMultiplier(enemy), path);
      }
      if (enemy.hp <= 0 && !enemy.rewardGiven) {
        enemy.rewardGiven = true;
        gold += rewardForEnemy(enemy, disableKillRewards);
      }
    };

    //  更新子弹
    projectiles = projectiles.flatMap(p => {
      if ((p.unguided || p.piercing || p.bounceCount) && p.direction) {
        const prevPos = { ...p.pos };
        const nextPos = {
          x: p.pos.x + p.direction.x * p.speed * dt,
          y: p.pos.y + p.direction.y * p.speed * dt,
        };
        const updated: Projectile = { ...p, pos: nextPos };
        const hitRadius = 0.45;
        const hits = enemies.filter(e => !(updated.pierced && updated.pierced[e.id]) && distancePointToSegment(e.pos.x, e.pos.y, prevPos.x, prevPos.y, nextPos.x, nextPos.y) <= hitRadius);
        if (hits.length > 0) {
          const ordered = hits.slice().sort((a, b) => b.progress - a.progress);
          let damageForHit = updated.damage;
          let hitCount = updated.pierceHitCount ?? 0;
          const pierceLimit = updated.pierceLimit;
          const decayFactor = updated.damageDecayFactor;
          let consumed = false;

          for (const enemy of ordered) {
            if (pierceLimit != null && hitCount >= pierceLimit) break;
            const currentDamage = damageForHit;
            applyProjectileDamage(enemy, currentDamage, updated, gameTime);
            if (updated.splashRadius && updated.splashPercent) {
              const splashTargets = enemies.filter(e => e.id !== enemy.id && getDistance(e.pos.x, e.pos.y, enemy.pos.x, enemy.pos.y) <= updated.splashRadius!);
              splashTargets.forEach(target => applyProjectileDamage(target, currentDamage * (updated.splashPercent || 0), updated, gameTime, false));
            }
            if (updated.pierced) {
              updated.pierced[enemy.id] = true;
            }
            hitCount += 1;
            if (pierceLimit != null && hitCount >= pierceLimit) {
              consumed = true;
              break;
            }
            if (decayFactor != null) {
              damageForHit = Number((damageForHit * decayFactor).toFixed(2));
            }
          }

          if (decayFactor != null && !consumed) {
            updated.damage = damageForHit;
          }
          if (decayFactor != null) {
            updated.damageDecayFactor = decayFactor;
          }
          if (pierceLimit != null) {
            updated.pierceLimit = pierceLimit;
          }
          updated.pierceHitCount = hitCount;

          // 如果子弹被消耗(达到穿透上限)，或者它是一个非穿透类型的反弹子弹，则在命中后移除
          if (consumed || (updated.bounceCount && !updated.piercing)) {
            return [];
          }
        }
        
        const crossedBoundary = nextPos.x < 0 || nextPos.x > mapWidth || nextPos.y < 0 || nextPos.y > mapHeight;
        if (updated.unguided && crossedBoundary && !(updated.bounceCount && updated.bounceCount > 0)) {
          return [];
        }

        if (updated.returnToSource && updated.origin && updated.returnRange != null) {
          if (updated.returning) {
            if (getDistance(nextPos.x, nextPos.y, updated.origin.x, updated.origin.y) <= updated.speed * dt) {
              return [];
            }
          } else if (getDistance(nextPos.x, nextPos.y, updated.origin.x, updated.origin.y) >= updated.returnRange) {
            const dx = updated.origin.x - nextPos.x;
            const dy = updated.origin.y - nextPos.y;
            const length = Math.hypot(dx, dy) || 1;
            updated.direction = { x: dx / length, y: dy / length };
            updated.returning = true;
            updated.pierced = {};
            updated.pierceHitCount = 0;
          }
        }

        let bounced = false;
        if (updated.direction && (nextPos.x < 0 || nextPos.x > mapWidth)) {
          updated.direction.x *= -1;
          bounced = true;
        }
        if (updated.direction && (nextPos.y < 0 || nextPos.y > mapHeight)) {
          updated.direction.y *= -1;
          bounced = true;
        }

        if (bounced) {
          updated.bounceCount = (updated.bounceCount ?? 0) - 1;
          if (updated.bounceCount < 0) {
            return [];
          }
        }

        const outOfBounds = nextPos.x < -1 || nextPos.x > mapWidth + 1 || nextPos.y < -1 || nextPos.y > mapHeight + 1;
        if (outOfBounds) {
          return [];
        }
        return [updated];
      } else {
        const target = p.targetId ? enemies.find(e => e.id === p.targetId) : null;
        if (!target) {
          if (p.bounceCount && p.direction) {
            p.targetId = null;
            return [p];
          }
          return [];
        }
        const dx = target.pos.x - p.pos.x;
        const dy = target.pos.y - p.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const step = p.speed * dt;
        if (dist <= step) {
          applyProjectileDamage(target, p.damage, p, gameTime);
          if (p.splashRadius && p.splashPercent) {
            const splashTargets = enemies.filter(e => e.id !== target.id && getDistance(e.pos.x, e.pos.y, target.pos.x, target.pos.y) <= p.splashRadius!);
            splashTargets.forEach(enemy => applyProjectileDamage(enemy, p.damage * (p.splashPercent || 0), p, gameTime, false));
          }
          return [];
        }
        const nx = p.pos.x + (dx / dist) * step;
        const ny = p.pos.y + (dy / dist) * step;
        return [{ ...p, pos: { x: nx, y: ny } }];
      }
    });

    //  风元素范围伤害
    towers.forEach(tw => {
      if (isTowerFrozen(tw, gameTime)) return;
      const elementState = tw.element;
      if (!elementState) return;
      const cfg = ELEMENT_PLANT_CONFIG[elementState.type];
      if (!cfg || !cfg.aura) return;
      const dps = cfg.aura.damagePerSecond + cfg.aura.bonusPerLevel * (elementState.level - 1);
      if (dps <= 0) return;
      enemies.forEach(enemy => {
        if (getDistance(enemy.pos.x, enemy.pos.y, tw.pos.x, tw.pos.y) <= tw.range) {
          applyDamageWithArmor(enemy, dps * dt, gameTime);
          if (enemy.hp <= 0 && !enemy.rewardGiven) {
            enemy.rewardGiven = true;
            gold += rewardForEnemy(enemy, disableKillRewards);
          }
        }
      });
    });

    triggerEnemyDeathEffects();
    enemies = enemies.filter(e => e.hp > 0);
    plantCovers = plantCovers.filter(cover => towers.some(tower => tower.id === cover.towerId));

    //  check wave finish
    if (isWaveActive) {
      const spawningDone = !spawnCursor; // no more spawn
      if (spawningDone && enemies.length === 0) {
        isWaveActive = false;
        waveIndex += 1;
        wavesCleared += 1;
        if (mode !== 'campaign' && lifeBonusPerWave > 0) {
          lives += lifeBonusPerWave;
        }
        if ((mode === 'endless' || mode === 'endlessTest') && endlessWaveFactory) {
          const nextWaveNumber = waveIndex + 1;
          const newWave = endlessWaveFactory(nextWaveNumber);
          waves = [...waves, newWave];
        }
        if (waveIndex < waves.length) {
          nextWaveStartTime = gameTime + DEFAULT_WAVE_GAP_SECONDS;
        }
      }
    }

    // defeat: lives <= 0 -> freeze
    if (lives <= 0) {
      isWaveActive = false;
      spawnCursor = null;
      enemies = [];
      projectiles = [];
      sunPickups = [];
      nextWaveStartTime = null;
    }

    Object.keys(elementCooldowns).forEach(key => {
      const t = elementCooldowns[key as ElementType];
      if (t != null && t <= gameTime) {
        delete elementCooldowns[key as ElementType];
      }
    });

    Object.keys(plantCooldowns).forEach(key => {
      const t = plantCooldowns[key as PlantType];
      if (t != null && t <= gameTime) {
        delete plantCooldowns[key as PlantType];
      }
    });

    set({
      running: lives > 0,
      gameTime,
      enemies,
      towers,
      plantCovers,
      paths,
      mapWidth,
      mapHeight,
      roadWidthCells,
      plantGrid,
      activeMapId,
      activeMapName,
      projectiles,
      singleUseCasts,
      damagePopups,
      sunPickups,
      elementCooldowns,
      plantCooldowns,
      conveyorQueue,
      nextConveyorItemAt,
      nextSkySunAt,
      gold,
      lives,
      isWaveActive,
      waveIndex,
      spawnCursor,
      nextWaveStartTime,
      waves,
      wavesCleared,
    });
  },

  togglePause: () => {
    const state = get();
    set({ running: !state.running });
  },
}));

function rewardForEnemy(e: Enemy, disabled = false): number {
  if (disabled) return 0;
  if (e.isBoss) return 500;
  return rewardForShape(e.shape);
}

function rewardForShape(shape: Enemy['shape']): number {
  switch (shape) {
    case 'circle':
      return 10;
    case 'triangle':
      return 7;
    case 'square':
      return 13;
    case 'healer':
      return 15;
    case 'evilSniper':
      return 18;
    case 'rager':
      return 15;
    case 'summoner':
      return 18;
    case 'igniter':
      return 6;
    case 'armored':
      return 18;
    case 'iceShell':
      return 16;
    case 'freezer':
      return 10;
    case 'taunter':
      return 15;
    case 'purifier':
      return 12;
    case 'angryWriter':
      return 20;
    case 'bunker':
      return 30;
    case 'windEye':
      return 17;
    default:
      return 10;
  }
}
