import { create } from 'zustand';
import { TDState, WaveDef, Enemy, Tower, Projectile, PlantType, ElementType, ElementCast } from './types';
import { Position } from '../types/game';
import { getDistance, MAP_CONFIG } from '../config/mapConfig';
import { MONSTER_BASE_STATS, DIFFICULTY_CONFIG } from './levels';
import { BASE_PLANTS_CONFIG, ELEMENT_PLANT_CONFIG, DEFAULT_PLANT_COLOR, DEFAULT_BULLET_COLOR, SUNFLOWER_ELEMENT_BLOCKLIST, BasePlantConfig } from './plants';

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
  { groups: [ { type: 'circle', count: 8, interval: 0.8, level: 1, reward: 5 } ] },
  { groups: [ { type: 'circle', count: 6, interval: 0.7, level: 3, reward: 6 }, { type: 'triangle', count: 6, interval: 0.6, level: 2, reward: 6 } ] },
  { groups: [ { type: 'square', count: 5, interval: 1.0, level: 4, reward: 10 }, { type: 'triangle', count: 10, interval: 0.5, level: 3, reward: 7 } ] },
];

const ELEMENT_SINGLE_USE_COOLDOWN: Record<ElementType, number> = {
  ice: 20,
  fire: 30,
  wind: 20,
  gold: 20,
  electric: 30,
};

// 基础植物预设（灰度数值，后续可在 src/td/plants.ts 中调整）
export const TOWERS_PRESET = BASE_PLANTS_CONFIG;

// Tower level scaling config (per-level multipliers)
const TOWER_LEVEL_CONFIG = { damagePerLevel: 0.08, rangePerLevel: 0.03, fireRatePerLevel: 0.05 } as const;
function scaleTowerStats(base: BasePlantConfig, level: number) {
  const lv = Math.max(1, Math.floor(level||1));
  const dmgMul = 1 + (lv - 1) * TOWER_LEVEL_CONFIG.damagePerLevel;
  const rngMul = 1 + (lv - 1) * TOWER_LEVEL_CONFIG.rangePerLevel;
  const frMul  = 1 + (lv - 1) * TOWER_LEVEL_CONFIG.fireRatePerLevel;
  return {
    damage: Number((base.damage * dmgMul).toFixed(2)),
    range: Number((base.range * rngMul).toFixed(2)),
    fireRate: base.fireRate === 0 ? 0 : Number((base.fireRate * frMul).toFixed(2)),
  };
}

function computeTowerStats(base: BasePlantConfig, level: number, element?: { type: ElementType; level: number }) {
  const scaled = scaleTowerStats(base, level);
  let damage = scaled.damage;
  let range = scaled.range;
  let fireRate = scaled.fireRate;
  const projectileSpeed = base.projectileSpeed;
  let penetration = !!base.penetration;
  let color = DEFAULT_PLANT_COLOR;
  let bulletColor = DEFAULT_BULLET_COLOR;

  if (element) {
    const elementCfg = ELEMENT_PLANT_CONFIG[element.type];
    if (elementCfg) {
      if (elementCfg.fireRateMultiplier != null) {
        fireRate = Number((fireRate * elementCfg.fireRateMultiplier).toFixed(2));
      }
      if (elementCfg.fireRatePenalty != null) {
        fireRate = Math.max(0, Number((fireRate - elementCfg.fireRatePenalty).toFixed(2)));
      }
      let damageMul = elementCfg.damageMultiplier ?? 1;
      if (elementCfg.damageBonusPerLevel) {
        damageMul += elementCfg.damageBonusPerLevel * (element.level - 1);
      }
      damage = Number((damage * damageMul).toFixed(2));
      penetration = penetration || !!elementCfg.penetration;
      color = elementCfg.color;
      bulletColor = elementCfg.bulletColor;
    }
  }

  return { damage, range, fireRate, projectileSpeed, penetration, color, bulletColor };
}

function ensureTowerStats(tower: Tower) {
  const base = BASE_PLANTS_CONFIG[tower.type];
  if (!base) return tower;
  const level = tower.level ?? 1;
  const stats = computeTowerStats(base, level, tower.element);
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

function applyDamageWithArmor(enemy: Enemy, damage: number, gameTime: number) {
  if (enemy.armorBreakUntil && gameTime > enemy.armorBreakUntil) {
    enemy.armorBreakUntil = undefined;
    enemy.armorBreakMultiplier = undefined;
  }
  const multiplier = enemy.armorBreakMultiplier && enemy.armorBreakUntil && gameTime <= enemy.armorBreakUntil
    ? enemy.armorBreakMultiplier
    : 1;
  const finalDamage = damage * (multiplier ?? 1);
  enemy.hp -= finalDamage;
  return finalDamage;
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

export interface TDStore extends TDState {
  startWave: () => void;
  placeTower: (type: PlantType, pos: Position) => void;
  applyElement: (element: ElementType, pos: Position) => void;
  canPlaceTower: (pos: Position) => boolean;
  update: (dt: number) => void;
  resetTD: () => void;
  loadLevel: (level: { startGold:number; lives:number; waves: WaveDef[] }, map: { path: Position[] | Position[][]; size:{w:number;h:number}; roadWidthCells:number; plantGrid: Position[] }, opts?: { autoStartFirstWave?: boolean; firstWaveDelaySec?: number; towerLevels?: Partial<Record<PlantType, number>>; allowedPlants?: PlantType[]; allowedElements?: ElementType[] }) => void;
  togglePause: () => void;
}

const INITIAL_TD_STATE: TDState = {
  running: true,
  gameTime: 0,
  gold: 100,
  lives: 20,
  // 地图
  paths: [TD_PATH], // 包装成数组以符合类型定义
  mapWidth: MAP_CONFIG.width,
  mapHeight: MAP_CONFIG.height,
  roadWidthCells: 2,
  plantGrid: [], // 初始为空，loadLevel 时设置
  // 实体
  enemies: [],
  towers: [],
  projectiles: [],
  singleUseCasts: [],
  damagePopups: [],
  elementCooldowns: {},
  availablePlants: ['sunflower', 'bottleGrass'] as PlantType[],
  availableElements: [] as ElementType[],
  // 波次
  waves: DEFAULT_WAVES,
  waveIndex: 0,
  isWaveActive: false,
  nextWaveStartTime: null,
  spawnCursor: null,
  towerLevelMap: {},
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

  loadLevel: (level, map, opts) => {
    // 处理单路径或多路径
    const firstElement = (map.path as any)[0];
    const isMultiPath = Array.isArray(firstElement) && firstElement.length > 0 && 'x' in firstElement[0];
    const paths: Position[][] = isMultiPath
      ? map.path as Position[][] // 已经是多路径
      : [map.path as Position[]]; // 单路径，包装成数组

    set({
      running: true,
      gameTime: 0,
      gold: level.startGold,
      lives: level.lives,
      paths,
      mapWidth: map.size.w,
      mapHeight: map.size.h,
      roadWidthCells: map.roadWidthCells,
      plantGrid: map.plantGrid, // 设置可种植格子点
      enemies: [],
      towers: [],
      projectiles: [],
      singleUseCasts: [],
      damagePopups: [],
      elementCooldowns: {},
      availablePlants: opts?.allowedPlants && opts.allowedPlants.length > 0 ? [...opts.allowedPlants] : [...INITIAL_TD_STATE.availablePlants],
      availableElements: opts?.allowedElements ? [...opts.allowedElements] : [...INITIAL_TD_STATE.availableElements],
      waves: level.waves,
      waveIndex: 0,
      isWaveActive: false,
      nextWaveStartTime: opts?.autoStartFirstWave ? (0 + (opts.firstWaveDelaySec ?? 0.8)) : null,
      spawnCursor: null,
      towerLevelMap: opts?.towerLevels || {},
    });
  },


  placeTower: (type, pos) => {
    const state = get();
    const base = BASE_PLANTS_CONFIG[type as PlantType];
    if (!base) return;
    if (!state.availablePlants.includes(type)) return;
    const cost = base.cost;
    if (state.gold < cost) return;
    if (!get().canPlaceTower(pos)) return;

    const level = (state.towerLevelMap && (state.towerLevelMap as any)[type]) || 1;
    const tower: Tower = {
      id: `tower-${Date.now()}-${Math.random()}`,
      pos,
      type,
      level,
      range: 0,
      damage: 0,
      fireRate: 0,
      lastShotTime: -999,
      projectileSpeed: base.projectileSpeed,
      penetration: base.penetration,
      incomeInterval: base.incomeInterval,
      incomeBase: base.incomeBase,
      incomeBonusPerLevel: base.incomeBonusPerLevel,
      lastIncomeTime: state.gameTime,
      color: DEFAULT_PLANT_COLOR,
      bulletColor: DEFAULT_BULLET_COLOR,
    };
    ensureTowerStats(tower);

    set({
      towers: [...state.towers, tower],
      gold: state.gold - cost,
    });
  },

  applyElement: (elementType, pos) => {
    const state = get();
    const config = ELEMENT_PLANT_CONFIG[elementType];
    if (!config) return;
    if (!state.availableElements.includes(elementType)) return;
    const elementCost = config.cost;
    if (state.gold < elementCost) return;

    let targetIndex = -1;
    state.towers.forEach((tower, idx) => {
      const dist = getDistance(tower.pos.x, tower.pos.y, pos.x, pos.y);
      if (dist < 0.6) {
        targetIndex = idx;
      }
    });

    if (targetIndex !== -1) {
      const tower = state.towers[targetIndex];
      if (tower.type === 'sunflower' && SUNFLOWER_ELEMENT_BLOCKLIST.has(elementType)) return;

      const towers = [...state.towers];
      const target = { ...tower };

      if (target.element) {
        if (target.element.type !== elementType) {
          return;
        }
        target.element = {
          ...target.element,
          level: target.element.level + 1,
        };
      } else {
        target.element = {
          type: elementType,
          level: 1,
          color: config.color,
          bulletColor: config.bulletColor,
        };
      }

      ensureTowerStats(target);
      towers[targetIndex] = target;

      set({
        towers,
        gold: state.gold - elementCost,
      });
      return;
    }

    const cooldownReadyAt = state.elementCooldowns[elementType] ?? 0;
    if (cooldownReadyAt > state.gameTime) return;
    const levelKey = `element:${elementType}`;
    const elementLevel = Math.max(1, Math.floor((state.towerLevelMap && (state.towerLevelMap as any)[levelKey]) || 1));

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

  startWave: () => {
    const state = get();
    if (state.isWaveActive) return;
    if (state.waveIndex >= state.waves.length) return;
    const firstGroup = state.waves[state.waveIndex].groups[0];
    set({
      isWaveActive: true,
      spawnCursor: {
        groupIndex: 0,
        nextSpawnTime: state.gameTime, // spawn immediately
        remaining: firstGroup.count,
      },
    });
  },

  update: (dt: number) => {
    const state = get();
    if (!state.running) return;

    const prevGameTime = state.gameTime;
    let gameTime = prevGameTime + dt;
    let enemies = [...state.enemies];
    let towers = state.towers;
    let projectiles = [...state.projectiles];
    let singleUseCasts = state.singleUseCasts.slice();
    let damagePopups = state.damagePopups.filter(p => p.until > gameTime);
    let elementCooldowns: Partial<Record<ElementType, number>> = { ...state.elementCooldowns };
    let gold = state.gold;
    let lives = state.lives;
    let waveIndex = state.waveIndex;
    let isWaveActive = state.isWaveActive;
    let spawnCursor = state.spawnCursor ? { ...state.spawnCursor } : null;
    let nextWaveStartTime = state.nextWaveStartTime ?? null;
    towers.forEach(t => ensureTowerStats(t));

    towers.forEach(tw => {
      if (!tw.incomeInterval || tw.incomeInterval <= 0) return;
      const interval = tw.incomeInterval;
      const lastIncomeTime = tw.lastIncomeTime ?? prevGameTime;
      if (gameTime - lastIncomeTime < interval) return;
      const cycles = Math.floor((gameTime - lastIncomeTime) / interval);
      if (cycles <= 0) return;
      const perTick = (tw.incomeBase ?? 0) + (tw.incomeBonusPerLevel ?? 0) * ((tw.level ?? 1) - 1);
      if (perTick <= 0) {
        tw.lastIncomeTime = lastIncomeTime + cycles * interval;
        return;
      }
      gold += perTick * cycles;
      tw.lastIncomeTime = lastIncomeTime + cycles * interval;
    });

    // auto start scheduled next wave
    if (!isWaveActive && waveIndex < state.waves.length && nextWaveStartTime !== null && gameTime >= nextWaveStartTime) {
      const firstGroup = state.waves[waveIndex].groups[0];
      isWaveActive = true;
      spawnCursor = {
        groupIndex: 0,
        nextSpawnTime: gameTime,
        remaining: firstGroup.count,
      };
      nextWaveStartTime = null;
    }

    //  handle spawning
    if (isWaveActive && waveIndex < state.waves.length && spawnCursor) {
      const wave = state.waves[waveIndex];
      const g = wave.groups[spawnCursor.groupIndex];
      if (gameTime >= spawnCursor.nextSpawnTime && spawnCursor.remaining > 0) {
        const baseStats = MONSTER_BASE_STATS[g.type];
        const mul = 1 + DIFFICULTY_CONFIG.LEVEL_MULTIPLIER * g.level;
        const hp = Math.round(baseStats.hp * mul);
        const pathId = g.pathId ?? 0; // 默认使用第一条路径
        const path = state.paths[pathId];
        const enemy: Enemy = {
          id: `e-${Date.now()}-${Math.random()}`,
          pos: { ...path[0] },
          hp,
          maxHp: hp,
          speed: baseStats.speed,
          shape: g.type,
          leakDamage: g.leakDamage ?? baseStats.leakDamage,
          level: g.level,
          pathIndex: 0,
          t: 0,
          progress: 0,
          pathId, // 记录该敌人走的路径ID
        };
        if (enemy.shape === 'healer') {
          enemy.specialTimer = gameTime + 3.5;
        } else if (enemy.shape === 'evilSniper') {
          enemy.specialTimer = gameTime + 20;
        }
        enemies.push(enemy);
        spawnCursor.remaining -= 1;
        spawnCursor.nextSpawnTime = gameTime + g.interval;
      }
      if (spawnCursor.remaining <= 0) {
        // move to next group
        if (spawnCursor.groupIndex + 1 < wave.groups.length) {
          spawnCursor.groupIndex += 1;
          spawnCursor.remaining = wave.groups[spawnCursor.groupIndex].count;
          spawnCursor.nextSpawnTime = gameTime + 1.5; // small gap
        } else {
          spawnCursor = null; // spawning complete
        }
      }
    }

    //  advance enemies along path
    enemies = enemies
      .map(e => {
        const path = state.paths[e.pathId]; // 使用敌人自己的路径
        const totalLen = totalPathLength(path);
        // slow effect decay
        const slowFactor = e.slowUntil && gameTime < e.slowUntil ? (1 - (e.slowPct || 0)) : 1;
        const boostMultiplier = e.speedBoostUntil && gameTime < e.speedBoostUntil ? (e.speedBoostMultiplier || 1) : 1;
        const speed = e.speed * slowFactor * boostMultiplier;
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
        const path = state.paths[e.pathId]; // 使用敌人自己的路径
        const atEnd = e.pathIndex >= path.length - 2 && e.t >= 1;
        if (atEnd) lives -= (e as any).leakDamage != null ? (e as any).leakDamage : 1;
        return !atEnd && e.hp > 0;
      });

    enemies.forEach(e => {
      if (e.slowUntil && gameTime >= e.slowUntil) {
        e.slowUntil = undefined;
        e.slowPct = undefined;
      }
      if (e.armorBreakUntil && gameTime >= e.armorBreakUntil) {
        e.armorBreakUntil = undefined;
        e.armorBreakMultiplier = undefined;
      }
      if (e.speedBoostUntil && gameTime >= e.speedBoostUntil) {
        e.speedBoostUntil = undefined;
        e.speedBoostMultiplier = undefined;
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
            gold += rewardForEnemy(e);
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
      if (color) addDamagePopup(enemy.pos, amount, color);
      if (enemy.hp <= 0 && !enemy.rewardGiven) {
        enemy.rewardGiven = true;
        gold += rewardForEnemy(enemy);
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
            enemy.slowPct = Math.max(enemy.slowPct || 0, 1);
            enemy.slowUntil = Math.max(enemy.slowUntil || 0, gameTime + 4);
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
            const path = state.paths[enemy.pathId];
            rewindEnemyAlongPath(enemy, 1.6, path);
            dealDamage(enemy, damage, '#10b981');
          });
          addDamagePopup(cast.pos, damage, '#10b981');
          break;
        }
        case 'gold': {
          const duration = 5 + 0.2 * cast.level;
          const multiplier = 1.5 + 0.1 * Math.max(0, cast.level - 1);
          enemies.forEach(enemy => {
            if (!enemy.armorBreakMultiplier || multiplier > enemy.armorBreakMultiplier) {
              enemy.armorBreakMultiplier = multiplier;
            }
            enemy.armorBreakUntil = Math.max(enemy.armorBreakUntil || 0, gameTime + duration);
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
      }
    });
    singleUseCasts = pendingCasts;

    let towersModified = false;
    enemies.forEach(enemy => {
      if (enemy.shape === 'healer') {
        const interval = 3.5;
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
          if (towers.length > 0) {
            const index = Math.floor(Math.random() * towers.length);
            const newTowers = [...towers];
            newTowers.splice(index, 1);
            towers = newTowers;
            towersModified = true;
          }
          enemy.specialTimer = gameTime + 20;
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
      }
    });
    if (towersModified) {
      towers = [...towers];
    }

    // ᚻ 植物发射子弹
    towers.forEach(tw => {
      ensureTowerStats(tw);
      if (tw.fireRate <= 0 || tw.damage <= 0) return;
      const cooldown = tw.fireRate > 0 ? 1 / tw.fireRate : Infinity;
      if (gameTime - tw.lastShotTime < cooldown) return;
      const inRange = enemies.filter(e => getDistance(e.pos.x, e.pos.y, tw.pos.x, tw.pos.y) <= tw.range);
      if (inRange.length === 0) return;
      inRange.sort((a, b) => b.progress - a.progress);
      const target = inRange[0];

      tw.lastShotTime = gameTime;

      const projectile: Projectile = {
        id: `p-${Date.now()}-${Math.random()}`,
        pos: { ...tw.pos },
        targetId: null,
        speed: tw.projectileSpeed || 8,
        damage: tw.damage,
        from: tw.type,
        color: tw.bulletColor || DEFAULT_BULLET_COLOR,
        sourceTowerId: tw.id,
        piercing: !!tw.penetration,
        pierced: tw.penetration ? {} : undefined,
      };

      if (projectile.piercing) {
        const dx = target.pos.x - tw.pos.x;
        const dy = target.pos.y - tw.pos.y;
        const len = Math.hypot(dx, dy) || 1;
        projectile.direction = { x: dx / len, y: dy / len };
      } else {
        projectile.targetId = target.id;
      }

      const elementState = tw.element;
      if (elementState) {
        const elementCfg = ELEMENT_PLANT_CONFIG[elementState.type];
        if (elementCfg) {
          if (elementCfg.breakArmor) {
            projectile.breakArmorMultiplier = elementCfg.breakArmor.multiplier + elementCfg.breakArmor.bonusPerLevel * (elementState.level - 1);
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
        }
      }

      projectiles.push(projectile);
    });

    const applyProjectileDamage = (enemy: Enemy, damageAmount: number, projectile: Projectile, impactTime: number) => {
      if (damageAmount <= 0 || enemy.hp <= 0) return;
      applyDamageWithArmor(enemy, damageAmount, impactTime);
      if (projectile.slowPct && projectile.slowDuration) {
        const until = impactTime + projectile.slowDuration;
        enemy.slowPct = Math.max(enemy.slowPct || 0, projectile.slowPct);
        enemy.slowUntil = Math.max(enemy.slowUntil || 0, until);
      }
      if (projectile.breakArmorMultiplier && projectile.breakArmorDuration) {
        const until = impactTime + projectile.breakArmorDuration;
        if (!enemy.armorBreakMultiplier || projectile.breakArmorMultiplier > enemy.armorBreakMultiplier) {
          enemy.armorBreakMultiplier = projectile.breakArmorMultiplier;
          enemy.armorBreakUntil = until;
        } else if (enemy.armorBreakUntil && until > enemy.armorBreakUntil) {
          enemy.armorBreakUntil = until;
        }
      }
      if (projectile.burnDamagePerSec && projectile.burnDuration) {
        enemy.burnDamagePerSec = projectile.burnDamagePerSec;
        enemy.burnUntil = impactTime + projectile.burnDuration;
      }
      if (projectile.knockbackDistance && projectile.knockbackDistance > 0) {
        const path = state.paths[enemy.pathId];
        rewindEnemyAlongPath(enemy, projectile.knockbackDistance, path);
      }
      if (enemy.hp <= 0 && !enemy.rewardGiven) {
        enemy.rewardGiven = true;
        gold += rewardForEnemy(enemy);
      }
    };

    //  更新子弹
    projectiles = projectiles.flatMap(p => {
      if (p.piercing && p.direction) {
        const prevPos = { ...p.pos };
        const nextPos = {
          x: p.pos.x + p.direction.x * p.speed * dt,
          y: p.pos.y + p.direction.y * p.speed * dt,
        };
        const updated: Projectile = { ...p, pos: nextPos };
        const hitRadius = 0.45;
        const hits = enemies.filter(e => !(updated.pierced && updated.pierced[e.id]) && distancePointToSegment(e.pos.x, e.pos.y, prevPos.x, prevPos.y, nextPos.x, nextPos.y) <= hitRadius);
        if (hits.length > 0) {
          hits.forEach(enemy => {
            applyProjectileDamage(enemy, p.damage, updated, gameTime);
            if (updated.splashRadius && updated.splashPercent) {
              const splashTargets = enemies.filter(e => e.id !== enemy.id && getDistance(e.pos.x, e.pos.y, enemy.pos.x, enemy.pos.y) <= updated.splashRadius!);
              splashTargets.forEach(target => applyProjectileDamage(target, p.damage * (updated.splashPercent || 0), updated, gameTime));
            }
            if (updated.pierced) {
              updated.pierced[enemy.id] = true;
            }
          });
        }
        const outOfBounds = nextPos.x < 0 || nextPos.x > state.mapWidth || nextPos.y < 0 || nextPos.y > state.mapHeight;
        if (outOfBounds) {
          return [];
        }
        return [updated];
      } else {
        const target = p.targetId ? enemies.find(e => e.id === p.targetId) : null;
        if (!target) {
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
            splashTargets.forEach(enemy => applyProjectileDamage(enemy, p.damage * (p.splashPercent || 0), p, gameTime));
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
            gold += rewardForEnemy(enemy);
          }
        }
      });
    });

    enemies = enemies.filter(e => e.hp > 0);

    //  check wave finish
    if (isWaveActive) {
      const spawningDone = !spawnCursor; // no more spawn
      if (spawningDone && enemies.length === 0 && projectiles.length === 0) {
        isWaveActive = false;
        waveIndex += 1;
        if (waveIndex < state.waves.length) {
          nextWaveStartTime = gameTime + 2; // auto-next in 2s
        }
      }
    }

    // defeat: lives <= 0 -> freeze
    if (lives <= 0) {
      isWaveActive = false;
      spawnCursor = null;
      enemies = [];
      projectiles = [];
      nextWaveStartTime = null;
    }

    Object.keys(elementCooldowns).forEach(key => {
      const t = elementCooldowns[key as ElementType];
      if (t != null && t <= gameTime) {
        delete elementCooldowns[key as ElementType];
      }
    });

    set({
      running: lives > 0,
      gameTime,
      enemies,
      towers,
      projectiles,
      singleUseCasts,
      damagePopups,
      elementCooldowns,
      gold,
      lives,
      isWaveActive,
      waveIndex,
      spawnCursor,
      nextWaveStartTime,
    });
  },

  togglePause: () => {
    const state = get();
    set({ running: !state.running });
  },
}));

function rewardForEnemy(e: Enemy): number {
  // 基础奖励按照形状区分，并整体提升倍数
  let base = 5;
  switch (e.shape) {
    case 'square':
      base = 10;
      break;
    case 'triangle':
      base = 7;
      break;
    case 'healer':
      base = 8;
      break;
    case 'evilSniper':
      base = 12;
      break;
    case 'rager':
      base = 9;
      break;
    default:
      base = 5;
  }
  return base * 6;
}
