import { WaveDef, WaveGroup } from './types';
import { MAPS } from './maps';

export interface LevelSpec {
  id: string;
  name: string;
  startGold: number;
  lives: number;
  mapId: number;
  waves: WaveDef[];
  autoStartFirstWave?: boolean;
  firstWaveDelaySec?: number;
}

// 获取地图的路径数量
function getPathCount(mapId: number): number {
  const map = MAPS.find(m => m.id === mapId);
  if (!map) return 1;

  const firstElement = (map.path as any)[0];
  const isMultiPath = Array.isArray(firstElement) && firstElement.length > 0 && 'x' in firstElement[0];

  if (isMultiPath) {
    return (map.path as any[][]).length;
  }
  return 1;
}

function createFinalBossWave(mapId: number, opts: { bossLevel: number; smallReward: number; bossReward: number; intensity?: number; leakDamage?: number }): WaveDef {
  const { bossLevel, smallReward, bossReward, intensity = 1, leakDamage = 5 } = opts;
  const pathCount = Math.max(1, getPathCount(mapId));
  const circleBase = Math.round(120 * intensity);
  const triangleBase = Math.round(90 * intensity);
  const bossCountPerPath = pathCount > 1 ? 1 : Math.max(3, Math.round(3 * intensity));
  const smallLevelBase = Math.min(
    Math.max(10, Math.round(bossLevel * 0.06)),
    Math.round(60 + intensity * 12)
  );
  const triangleLevelBase = Math.min(
    smallLevelBase + Math.round(6 + intensity * 4),
    Math.round(80 + intensity * 12)
  );

  const groups: WaveGroup[] = [];
  for (let p = 0; p < pathCount; p++) {
    const pathInjection = pathCount > 1 ? { pathId: p } : {};
    groups.push({
      type: 'circle' as const,
      count: Math.max(40, Math.floor(circleBase / pathCount)),
      interval: Math.max(0.05, 0.12 - intensity * 0.01),
      level: smallLevelBase,
      reward: smallReward,
      ...pathInjection,
    });
    groups.push({
      type: 'triangle' as const,
      count: Math.max(30, Math.floor(triangleBase / pathCount)),
      interval: Math.max(0.05, 0.14 - intensity * 0.01),
      level: triangleLevelBase,
      reward: smallReward + 2,
      ...pathInjection,
    });
    groups.push({
      type: 'square' as const,
      count: bossCountPerPath,
      interval: 1.4,
      level: bossLevel,
      reward: bossReward,
      leakDamage,
      ...pathInjection,
    });
  }

  return { groups };
}

// 怪物基础属性（等级1时的数值）
export const MONSTER_BASE_STATS = {
  circle: { hp: 50, speed: 2.5, leakDamage: 1 },
  triangle: { hp: 30, speed: 3.5, leakDamage: 1 },
  square: { hp: 150, speed: 1.8, leakDamage: 2 },
  healer: { hp: 140, speed: 2.3, leakDamage: 1 },
  evilSniper: { hp: 260, speed: 2.0, leakDamage: 3 },
  rager: { hp: 180, speed: 2.4, leakDamage: 2 },
  summoner: { hp: 250, speed: 2.2, leakDamage: 2 },
};

// 星级难度配置
export const DIFFICULTY_CONFIG = {
  STAR_LEVEL_ADD: {
    1: 0,  
    2: 50,  
    3: 100,  
  } as Record<1|2|3, number>,
  
  LEVEL_MULTIPLIER: 0.02, 
};

// 配置说明：每个 group 只需配置 level（怪物等级），HP和速度自动计算
// 每关最后一波是 BOSS（1个怪，1000级起步）

export const LEVELS: LevelSpec[] = [
  {
    id: 'L1',
    name: '入门小道',
    startGold: 1000,
    lives: 20,
    mapId: 1,
  waves: [
    { groups: [ { type: 'circle', count: 12, interval: 0.35, level: 1, reward: 5 } ] },
    { groups: [ { type: 'circle', count: 35, interval: 0.3, level: 3, reward: 6 }, { type: 'triangle', count: 30, interval: 0.28, level: 2, reward: 6 } ] },
    { groups: [ { type: 'square', count: 20, interval: 0.45, level: 4, reward: 10 }, { type: 'triangle', count: 40, interval: 0.25, level: 3, reward: 7 } ] },
    createFinalBossWave(1, { bossLevel: 1000, smallReward: 10, bossReward: 110, intensity: 0.75 }),
  ],
    autoStartFirstWave: true,
    firstWaveDelaySec: 0.8,
  },

  {
    id: 'L2',
    name: 'Z字回廊',
    startGold: 1000,
    lives: 18,
    mapId: 3,
  waves: [
    { groups: [ { type: 'circle', count: 15, interval: 0.32, level: 5, reward: 6 } ] },
    { groups: [ { type: 'triangle', count: 45, interval: 0.28, level: 6, reward: 7 } ] },
    { groups: [ { type: 'square', count: 22, interval: 0.42, level: 7, reward: 12 }, { type: 'triangle', count: 42, interval: 0.26, level: 6, reward: 8 } ] },
    createFinalBossWave(3, { bossLevel: 1050, smallReward: 12, bossReward: 125, intensity: 0.85 }),
  ],
    autoStartFirstWave: true,
    firstWaveDelaySec: 0.8,
  },

  {
    id: 'L3',
    name: '双拐角',
    startGold: 1000,
    lives: 16,
    mapId: 2,
  waves: [
    { groups: [ { type: 'circle', count: 18, interval: 0.3, level: 8, reward: 7 } ] },
    { groups: [ { type: 'triangle', count: 50, interval: 0.26, level: 9, reward: 8 } ] },
    { groups: [ { type: 'square', count: 25, interval: 0.4, level: 10, reward: 14 } ] },
    { groups: [ { type: 'circle', count: 48, interval: 0.28, level: 10, reward: 9 }, { type: 'square', count: 24, interval: 0.42, level: 11, reward: 15 } ] },
    createFinalBossWave(2, { bossLevel: 1100, smallReward: 14, bossReward: 140, intensity: 0.95 }),
  ],
    autoStartFirstWave: true,
    firstWaveDelaySec: 0.8,
  },

];

// 49个同学地图的ID（7-55）打乱顺序
const studentMapIds = [15, 42, 28, 51, 19, 33, 8, 46, 22, 37, 11, 54, 25, 40, 14, 49, 18, 31, 7, 44,
  23, 38, 12, 53, 26, 41, 16, 50, 20, 34, 9, 47, 24, 39, 13, 52, 27, 43, 17, 32, 10, 48, 21, 36,
  29, 45, 30, 55, 35];

// 生成4-52关（使用49张同学地图）
for (let i = 0; i < 49; i++) {
  const levelNum = i + 4; // 关卡编号从4开始
  const mapId = studentMapIds[i];
  const pathCount = getPathCount(mapId); // 获取地图路径数量

  // 基础参数随关卡递增
  const baseLevel = 10 + i * 3; // 怪物基础等级：12, 14, 16, ...
  const startGold = Math.max(1000, 1200 - i * 10); // 第4关1200，每关递减10，最低1000
  const lives = Math.max(10, 18 - Math.floor(i / 10)); // 生命值递减：15→14→13→12→11→10
  const waveCount = 3 + Math.floor(i / 8); // 波数递增：3→4→5→6→7
  const bossLevel = 1150 + i * 20; // BOSS等级递增

  const waves: WaveDef[] = [];

  // 生成普通波次（怪物数量大幅增加，间隔缩短，形成堆叠效果）
  for (let w = 0; w < waveCount; w++) {
    const waveLevel = baseLevel + w * 2;
    const groups = [];

    // 根据波次添加不同类型的怪物
    // 对于多路径地图，每条路径都会出怪
    if (w === 0) {
      // 第一波：大量circle，密集出怪
      for (let p = 0; p < pathCount; p++) {
        groups.push({
          type: 'circle' as const,
          count: Math.floor((10 + i * 3) / pathCount), // 平均分配到各路径
          interval: Math.max(0.15, 0.35 - i * 0.003), // 间隔缩短，形成堆叠
          level: waveLevel,
          reward: 6 + Math.floor(i / 5),
          pathId: p, // 指定路径ID
        });
      }
    } else if (w === 1) {
      // 第二波：大量triangle，更密集
      for (let p = 0; p < pathCount; p++) {
        groups.push({
          type: 'triangle' as const,
          count: Math.floor((40 + i * 3) / pathCount),
          interval: Math.max(0.12, 0.3 - i * 0.003),
          level: waveLevel + 1,
          reward: 7 + Math.floor(i / 5),
          pathId: p,
        });
      }
    } else if (w === 2) {
      // 第三波：square + circle 双重堆叠
      for (let p = 0; p < pathCount; p++) {
        groups.push({
          type: 'square' as const,
          count: Math.floor((20 + i * 2) / pathCount),
          interval: Math.max(0.2, 0.45 - i * 0.003),
          level: waveLevel + 2,
          reward: 12 + Math.floor(i / 3),
          pathId: p,
        });
        groups.push({
          type: 'circle' as const,
          count: Math.floor((45 + i * 3) / pathCount),
          interval: Math.max(0.1, 0.25 - i * 0.003),
          level: waveLevel,
          reward: 8 + Math.floor(i / 5),
          pathId: p,
        });
      }
    } else if (w === 3) {
      // 第四波：三种混合，极度密集
      for (let p = 0; p < pathCount; p++) {
        groups.push({
          type: 'triangle' as const,
          count: Math.floor((50 + i * 3) / pathCount),
          interval: Math.max(0.1, 0.28 - i * 0.003),
          level: waveLevel + 1,
          reward: 9 + Math.floor(i / 5),
          pathId: p,
        });
        groups.push({
          type: 'square' as const,
          count: Math.floor((25 + i * 2) / pathCount),
          interval: Math.max(0.18, 0.4 - i * 0.003),
          level: waveLevel + 2,
          reward: 14 + Math.floor(i / 3),
          pathId: p,
        });
        groups.push({
          type: 'circle' as const,
          count: Math.floor((40 + i * 3) / pathCount),
          interval: Math.max(0.12, 0.3 - i * 0.003),
          level: waveLevel,
          reward: 9 + Math.floor(i / 5),
          pathId: p,
        });
      }
    } else if (w === 4) {
      // 第五波：三种大量混合，形成怪物潮
      for (let p = 0; p < pathCount; p++) {
        groups.push({
          type: 'circle' as const,
          count: Math.floor((55 + i * 4) / pathCount),
          interval: Math.max(0.08, 0.22 - i * 0.002),
          level: waveLevel,
          reward: 10 + Math.floor(i / 5),
          pathId: p,
        });
        groups.push({
          type: 'triangle' as const,
          count: Math.floor((50 + i * 4) / pathCount),
          interval: Math.max(0.1, 0.25 - i * 0.002),
          level: waveLevel + 1,
          reward: 11 + Math.floor(i / 5),
          pathId: p,
        });
        groups.push({
          type: 'square' as const,
          count: Math.floor((30 + i * 2) / pathCount),
          interval: Math.max(0.15, 0.35 - i * 0.003),
          level: waveLevel + 3,
          reward: 16 + Math.floor(i / 3),
          pathId: p,
        });
      }
    } else {
      // 第六波及以上：怪物海啸，极限密集
      for (let p = 0; p < pathCount; p++) {
        groups.push({
          type: 'circle' as const,
          count: Math.floor((65 + i * 5) / pathCount),
          interval: Math.max(0.06, 0.18 - i * 0.002),
          level: waveLevel,
          reward: 12 + Math.floor(i / 5),
          pathId: p,
        });
        groups.push({
          type: 'triangle' as const,
          count: Math.floor((60 + i * 5) / pathCount),
          interval: Math.max(0.08, 0.2 - i * 0.002),
          level: waveLevel + 1,
          reward: 13 + Math.floor(i / 5),
          pathId: p,
        });
        groups.push({
          type: 'square' as const,
          count: Math.floor((35 + i * 3) / pathCount),
          interval: Math.max(0.12, 0.3 - i * 0.003),
          level: waveLevel + 3,
          reward: 18 + Math.floor(i / 3),
          pathId: p,
        });
      }
    }

    if (levelNum >= 6 && w >= 1 && (w % 2 === 1)) {
      const healerCount = Math.max(1, Math.floor((2 + i / 10) / pathCount));
      for (let p = 0; p < pathCount; p++) {
        groups.push({
          type: 'healer' as const,
          count: healerCount,
          interval: 2.2,
          level: Math.max(12, baseLevel + Math.floor(w * 1.5)),
          reward: 14 + Math.floor(i / 4),
          pathId: p,
        });
      }
    }

    if (levelNum >= 8 && w === waveCount - 1) {
      for (let p = 0; p < pathCount; p++) {
        groups.push({
          type: 'evilSniper' as const,
          count: 1,
          interval: 4.5,
          level: Math.max(baseLevel + 12, 40 + Math.floor(i / 2)),
          reward: 25 + Math.floor(i / 3),
          pathId: p,
        });
      }
    }

    if (levelNum >= 7 && w >= 2 && (w % 3 === 0)) {
      const summonerCount = Math.max(1, Math.floor((1 + i / 20) / pathCount));
      for (let p = 0; p < pathCount; p++) {
        groups.push({
          type: 'summoner' as const,
          count: summonerCount,
          interval: 3.5,
          level: Math.max(baseLevel + 8, 35 + Math.floor(i / 2)),
          reward: 20 + Math.floor(i / 4),
          pathId: p,
        });
      }
    }

    if (levelNum >= 10 && w >= Math.max(2, waveCount - 2)) {
      const ragerCount = Math.max(1, Math.floor((1 + i / 15) / pathCount));
      for (let p = 0; p < pathCount; p++) {
        groups.push({
          type: 'rager' as const,
          count: ragerCount,
          interval: 3.2,
          level: Math.max(baseLevel + 10, 45 + Math.floor(i / 2)),
          reward: 18 + Math.floor(i / 4),
          pathId: p,
        });
      }
    }

    waves.push({ groups });
  }

  const intensity = 1.1 + i * 0.04;
  waves.push(createFinalBossWave(mapId, {
    bossLevel,
    smallReward: 14 + Math.floor(i / 4),
    bossReward: 160 + i * 6,
    intensity,
    leakDamage: 5 + Math.floor(i / 10),
  }));

  LEVELS.push({
    id: `L${levelNum}`,
    name: `关卡${levelNum}`,
    startGold,
    lives,
    mapId,
    waves,
    autoStartFirstWave: true,
    firstWaveDelaySec: 5,
  });
}
