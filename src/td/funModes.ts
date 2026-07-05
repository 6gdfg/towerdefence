import type { MapSpec } from './maps';
import { countMapPaths } from './mapPath';
import { ElementType, PlantType, ShapeType, WaveDef, WaveGroup } from './types';

const FUN_MODE_SHAPES = ['circle', 'triangle', 'square', 'healer', 'evilSniper', 'rager'] as const;
const FUN_MODE_INITIAL_WAVES = 1;
const RANDOM_MODE_SHAPES: ShapeType[] = ['circle', 'triangle', 'square', 'healer', 'evilSniper', 'rager', 'summoner'];
const RANDOM_MODE_SHAPE_MULTIPLIER: Partial<Record<ShapeType, number>> = {
  square: 0.65,
  healer: 0.55,
  evilSniper: 0.45,
  rager: 0.6,
  summoner: 0.5,
};

export type FunModeType = 'test' | 'endless' | 'random';

export const FUN_MODE_LABELS: Record<FunModeType, string> = {
  test: '测试模式',
  endless: '无尽模式',
  random: '随机模式',
};

export const RANDOM_MODE_PLANT_COUNT = { min: 3, max: 7 };
export const RANDOM_MODE_ELEMENT_COUNT = { min: 3, max: 5 };
export const RANDOM_MODE_LEVEL_RANGE = { min: 3, max: 10 };
export const RANDOM_MODE_START_GOLD_RANGE = { min: 1000, max: 3000 };
export const RANDOM_MODE_LIVES_RANGE = { min: 18, max: 30 };
const RANDOM_MODE_WAVE_COUNT = { min: 4, max: 10 };

export const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const pickRandomUnique = <T,>(source: readonly T[], count: number): T[] => {
  const pool = [...source];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
};

export function buildRandomModeWaves(map: MapSpec): WaveDef[] {
  const totalWaves = getRandomInt(RANDOM_MODE_WAVE_COUNT.min, RANDOM_MODE_WAVE_COUNT.max);
  const pathCount = Math.max(1, countMapPaths(map));
  const baseLevelSeed = getRandomInt(18, 40);
  const waves: WaveDef[] = [];

  for (let w = 0; w < totalWaves; w++) {
    const groups: WaveGroup[] = [];
    const groupCount = getRandomInt(2, 4);
    for (let g = 0; g < groupCount; g++) {
      const shape = RANDOM_MODE_SHAPES[getRandomInt(0, RANDOM_MODE_SHAPES.length - 1)];
      const level = baseLevelSeed + getRandomInt(0, 6) + w * getRandomInt(2, 4);
      const reward = 8 + Math.floor(level / 8) + g;
      const baseCount = getRandomInt(18, 60) + w * getRandomInt(1, 4);
      const shapeFactor = RANDOM_MODE_SHAPE_MULTIPLIER[shape] ?? 1;
      const adjustedCount = Math.max(3, Math.round(baseCount * shapeFactor));
      const interval = Math.max(0.12, Number((0.45 - w * 0.02 - g * 0.01 + Math.random() * 0.12).toFixed(2)));
      if (pathCount > 1) {
        const perPath = Math.max(3, Math.floor(adjustedCount / pathCount));
        for (let p = 0; p < pathCount; p++) {
          groups.push({
            type: shape,
            count: perPath,
            interval,
            level,
            reward,
            pathId: p,
          });
        }
      } else {
        groups.push({
          type: shape,
          count: adjustedCount,
          interval,
          level,
          reward,
        });
      }
    }
    waves.push({ groups });
  }
  return waves;
}

export function createFunModeWave(waveNumber: number): WaveDef {
  const isBoss = waveNumber % 10 === 0;
  if (isBoss) {
    const bossLevel = 2000 + waveNumber;
    return {
      groups: [
        { type: 'square', count: 18, interval: 0.45, level: bossLevel - 200, reward: 60 },
        { type: 'evilSniper', count: 6, interval: 1.4, level: bossLevel, reward: 80 },
        { type: 'rager', count: 8, interval: 1.1, level: bossLevel - 120, reward: 70 },
      ],
    };
  }

  const baseLevel = waveNumber;
  const baseCount = Math.min(20 + waveNumber * 3, 120);
  const interval = Math.max(0.2, 0.65 - waveNumber * 0.01);
  const rewardBase = 8 + Math.floor(waveNumber / 2);
  const groups = FUN_MODE_SHAPES.slice(0, 3).map((_, idx) => {
    const shape = FUN_MODE_SHAPES[(waveNumber + idx) % FUN_MODE_SHAPES.length];
    return {
      type: shape,
      count: baseCount - idx * 3,
      interval,
      level: baseLevel + idx,
      reward: rewardBase + idx * 2,
    };
  });
  return { groups };
}

export function buildInitialFunWaves(): WaveDef[] {
  return Array.from({ length: FUN_MODE_INITIAL_WAVES }, (_, idx) => createFunModeWave(idx + 1));
}

export type RandomTowerLevels = Partial<Record<PlantType | `element:${ElementType}`, number>>;
