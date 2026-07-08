import type { DifficultyCode } from './levelRatings';
import { BALANCE_LAB_LEVEL_DRAFTS } from './balanceDraft.generated';
import type { AtModeConfig, ShapeType, WaveDef } from './types';

export interface LevelDifficultySpec {
  name?: string;
  startGold?: number;
  lives?: number;
  mapId?: number;
  waves: WaveDef[];
  autoStartFirstWave?: boolean;
  firstWaveDelaySec?: number;
  atModeConfig?: AtModeConfig;
}

export interface LevelSpec {
  id: string;
  name: string;
  startGold: number;
  lives: number;
  mapId: number;
  waves: WaveDef[];
  autoStartFirstWave?: boolean;
  firstWaveDelaySec?: number;
  atModeConfig?: AtModeConfig;
  difficultyOverrides?: Partial<Record<DifficultyCode, LevelDifficultySpec>>;
}

export function getLevelSpecForDifficulty(level: LevelSpec, difficulty: DifficultyCode): LevelSpec {
  const override = level.difficultyOverrides?.[difficulty] ?? (difficulty === 'EZ' ? undefined : level.difficultyOverrides?.EZ);
  if (!override) return level;
  return {
    ...level,
    ...override,
    id: level.id,
    name: override.name ?? level.name,
    startGold: override.startGold ?? level.startGold,
    lives: override.lives ?? level.lives,
    mapId: override.mapId ?? level.mapId,
    autoStartFirstWave: override.autoStartFirstWave ?? level.autoStartFirstWave,
    firstWaveDelaySec: override.firstWaveDelaySec ?? level.firstWaveDelaySec,
    atModeConfig: override.atModeConfig ?? level.atModeConfig,
    difficultyOverrides: level.difficultyOverrides,
  };
}

export type MonsterBaseStats = {
  hp: number;
  armorHp?: number;
  speed: number;
  leakDamage: number;
};

export const MONSTER_BASE_STATS: Record<ShapeType, MonsterBaseStats> = {
  circle: { hp: 50, speed: 2.5, leakDamage: 1 },
  triangle: { hp: 30, speed: 3.5, leakDamage: 1 },
  square: { hp: 120, speed: 1.8, leakDamage: 2 },
  healer: { hp: 140, speed: 2.3, leakDamage: 1 },
  evilSniper: { hp: 260, speed: 2.0, leakDamage: 3 },
  rager: { hp: 180, speed: 2.4, leakDamage: 2 },
  summoner: { hp: 250, speed: 2.2, leakDamage: 2 },
  igniter: { hp: 50, speed: 2.5, leakDamage: 1 },
  armored: { hp: 80, armorHp: 200, speed: 1.8, leakDamage: 2 },
  iceShell: { hp: 280, speed: 2.5, leakDamage: 1 },
  purifier: { hp: 80, speed: 1.5, leakDamage: 1 },
  angryWriter: { hp: 100, armorHp: 50, speed: 1.5, leakDamage: 1 },
};

export const DIFFICULTY_CONFIG = {
  LEVEL_MULTIPLIER: 0.1,
};

export const INTRODUCTION_LEVEL: LevelSpec = {
  id: 'introduction',
  name: 'Introduction',
  startGold: 260,
  lives: 20,
  mapId: 1,
  waves: [
    { groups: [{ type: 'circle', count: 6, interval: 0.65, level: 1 }] },
    { groups: [{ type: 'circle', count: 8, interval: 0.55, level: 1 }, { type: 'triangle', count: 4, interval: 0.7, level: 1 }] },
    { groups: [{ type: 'square', count: 3, interval: 0.9, level: 1 }] },
  ],
  autoStartFirstWave: false,
};

const MANUAL_LEVEL_COUNT = 60;
const MANUAL_SLOT_MAP_IDS = Array.from({ length: 17 }, (_, index) => index + 1);

const UNCONFIGURED_WAVES: WaveDef[] = [
  { groups: [{ type: 'circle', count: 8, interval: 0.5, level: 1 }] },
];

const SEED_LEVELS: LevelSpec[] = [
  {
    id: 'L1',
    name: '入门小道',
    startGold: 1000,
    lives: 20,
    mapId: 1,
    waves: [
      { groups: [{ type: 'circle', count: 12, interval: 0.35, level: 1 }] },
      { groups: [{ type: 'circle', count: 35, interval: 0.3, level: 3 }, { type: 'triangle', count: 30, interval: 0.28, level: 2 }] },
      { groups: [{ type: 'square', count: 20, interval: 0.45, level: 4 }, { type: 'triangle', count: 40, interval: 0.25, level: 3 }] },
      { groups: [
        { type: 'circle', count: 68, interval: 0.11249999999999999, level: 54 },
        { type: 'triangle', count: 51, interval: 0.1325, level: 63 },
        { type: 'square', count: 1, interval: 1.4, level: 600, isBoss: true, leakDamage: 4 },
      ] },
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
      { groups: [{ type: 'circle', count: 15, interval: 0.32, level: 5 }] },
      { groups: [{ type: 'triangle', count: 45, interval: 0.28, level: 6 }] },
      { groups: [{ type: 'square', count: 22, interval: 0.42, level: 7 }, { type: 'triangle', count: 42, interval: 0.26, level: 6 }] },
      { groups: [
        { type: 'circle', count: 77, interval: 0.11149999999999999, level: 55 },
        { type: 'triangle', count: 57, interval: 0.1315, level: 64 },
        { type: 'square', count: 1, interval: 1.4, level: 650, isBoss: true, leakDamage: 4 },
      ] },
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
      { groups: [{ type: 'circle', count: 18, interval: 0.3, level: 8 }] },
      { groups: [{ type: 'triangle', count: 50, interval: 0.26, level: 9 }] },
      { groups: [{ type: 'square', count: 25, interval: 0.4, level: 10 }] },
      { groups: [{ type: 'circle', count: 48, interval: 0.28, level: 10 }, { type: 'square', count: 24, interval: 0.42, level: 11 }] },
      { groups: [
        { type: 'circle', count: 86, interval: 0.1105, level: 56 },
        { type: 'triangle', count: 64, interval: 0.1305, level: 66 },
        { type: 'square', count: 1, interval: 1.4, level: 700, isBoss: true, leakDamage: 4 },
      ] },
    ],
    autoStartFirstWave: true,
    firstWaveDelaySec: 0.8,
  },
];

function cloneWaves(waves: WaveDef[]): WaveDef[] {
  return waves.map(wave => ({
    groups: wave.groups.map(group => ({ ...group })),
  }));
}

function createManualLevelSlot(levelNumber: number): LevelSpec {
  const seed = SEED_LEVELS[levelNumber - 1];
  if (seed) {
    return {
      ...seed,
      waves: cloneWaves(seed.waves),
    };
  }

  return {
    id: `L${levelNumber}`,
    name: `关卡${levelNumber}`,
    startGold: 1000,
    lives: 20,
    mapId: MANUAL_SLOT_MAP_IDS[(levelNumber - 1) % MANUAL_SLOT_MAP_IDS.length],
    waves: cloneWaves(UNCONFIGURED_WAVES),
    autoStartFirstWave: true,
    firstWaveDelaySec: 0.8,
  };
}

function applyGeneratedDrafts(levels: LevelSpec[]): LevelSpec[] {
  const byId = new Map(levels.map(level => [level.id, { ...level }]));

  BALANCE_LAB_LEVEL_DRAFTS.forEach(draft => {
    const level = byId.get(draft.sourceLevelId);
    if (!level) return;

    level.name = draft.levelName || level.name;
    level.difficultyOverrides = {
      ...level.difficultyOverrides,
      [draft.difficulty]: {
        name: draft.levelName,
        startGold: draft.startGold,
        lives: draft.lives,
        mapId: draft.mapId,
        waves: cloneWaves(draft.waves),
        autoStartFirstWave: draft.autoStartFirstWave,
        firstWaveDelaySec: draft.firstWaveDelaySec,
        atModeConfig: draft.atModeConfig,
      },
    };
  });

  return levels.map(level => byId.get(level.id) ?? level);
}

export const LEVELS: LevelSpec[] = applyGeneratedDrafts(
  Array.from({ length: MANUAL_LEVEL_COUNT }, (_, index) => createManualLevelSlot(index + 1)),
);
