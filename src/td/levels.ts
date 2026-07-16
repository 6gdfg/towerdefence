import { BALANCE_LAB_LEVEL_DRAFTS } from './balanceDraft.generated';
import { getChapterLevelLabel } from './chapters';
import type { DifficultyCode } from './levelRatings';
import type { AtModeConfig, ShapeType, SpecialEnemyConfig, WaveDef } from './types';

export interface LevelDifficultySpec {
  name?: string;
  startGold?: number;
  lives?: number;
  mapId?: number;
  waves: WaveDef[];
  autoStartFirstWave?: boolean;
  firstWaveDelaySec?: number;
  atModeConfig?: AtModeConfig;
  specialEnemyConfig?: SpecialEnemyConfig;
  unlockRewards?: string[];
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
  specialEnemyConfig?: SpecialEnemyConfig;
  unlockRewards?: string[];
  difficultyOverrides?: Partial<Record<DifficultyCode, LevelDifficultySpec>>;
}

const DIFFICULTY_ORDER: DifficultyCode[] = ['EZ', 'HD', 'IN', 'AT'];

export function getLevelSpecForDifficulty(level: LevelSpec, difficulty: DifficultyCode): LevelSpec {
  const override = level.difficultyOverrides?.[difficulty];
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
    specialEnemyConfig: override.specialEnemyConfig ?? level.specialEnemyConfig,
    unlockRewards: override.unlockRewards ?? level.unlockRewards,
    difficultyOverrides: level.difficultyOverrides,
  };
}

export function hasLevelDifficultyDraft(level: LevelSpec | undefined, difficulty: DifficultyCode) {
  return Boolean(level?.difficultyOverrides?.[difficulty]);
}

export function hasAnyLevelDraft(level: LevelSpec | undefined) {
  return Boolean(level?.difficultyOverrides && Object.keys(level.difficultyOverrides).length > 0);
}

export function getConfiguredDifficulties(level: LevelSpec | undefined): DifficultyCode[] {
  return DIFFICULTY_ORDER.filter(difficulty => hasLevelDifficultyDraft(level, difficulty));
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
  freezer: { hp: 50, speed: 2.5, leakDamage: 1 },
  taunter: { hp: 250, speed: 1.6, leakDamage: 2 },
  purifier: { hp: 80, speed: 1.5, leakDamage: 1 },
  angryWriter: { hp: 100, armorHp: 50, speed: 1.5, leakDamage: 1 },
  bunker: { hp: 1000, speed: 0.7, leakDamage: 3 },
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

const MANUAL_LEVEL_COUNT = 48;

function cloneWaves(waves: WaveDef[]): WaveDef[] {
  return waves.map(wave => ({
    groups: wave.groups.map(group => ({ ...group })),
  }));
}

function createManualLevelSlot(levelNumber: number): LevelSpec {
  return {
    id: `L${levelNumber}`,
    name: getChapterLevelLabel(levelNumber - 1),
    startGold: 1000,
    lives: 20,
    mapId: 1,
    waves: [],
    autoStartFirstWave: true,
    firstWaveDelaySec: 0.8,
  };
}

function getUnifiedDraftName(levelId: string, levelNumber: number, fallback: string) {
  const drafts = BALANCE_LAB_LEVEL_DRAFTS
    .filter(draft => draft.sourceLevelId === levelId && typeof draft.levelName === 'string' && draft.levelName.trim().length > 0)
    .sort((a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty));
  const numberedName = drafts.find(draft => /^\d+-\d+$/.test(draft.levelName.trim()))?.levelName.trim();
  const oldDefaultName = `关卡${levelNumber}`;
  const customName = drafts.find(draft => draft.levelName.trim() !== oldDefaultName)?.levelName.trim();
  return numberedName ?? customName ?? fallback;
}

function applyGeneratedDrafts(levels: LevelSpec[]): LevelSpec[] {
  const byId = new Map(levels.map(level => [level.id, { ...level }]));

  BALANCE_LAB_LEVEL_DRAFTS.forEach(draft => {
    const level = byId.get(draft.sourceLevelId);
    if (!level) return;
    const levelNumber = Number(draft.sourceLevelId.replace(/^L/, '')) || draft.levelNumber || 1;
    const unifiedName = getUnifiedDraftName(level.id, levelNumber, level.name);

    level.name = unifiedName;
    level.difficultyOverrides = {
      ...level.difficultyOverrides,
      [draft.difficulty]: {
        name: unifiedName,
        startGold: draft.startGold,
        lives: draft.lives,
        mapId: draft.mapId,
        waves: cloneWaves(draft.waves),
        autoStartFirstWave: draft.autoStartFirstWave,
        firstWaveDelaySec: draft.firstWaveDelaySec,
        atModeConfig: draft.atModeConfig,
        specialEnemyConfig: draft.specialEnemyConfig,
        unlockRewards: Array.isArray(draft.unlockRewards) ? [...draft.unlockRewards] : [],
      },
    };
  });

  return levels.map(level => byId.get(level.id) ?? level);
}

export const LEVELS: LevelSpec[] = applyGeneratedDrafts(
  Array.from({ length: MANUAL_LEVEL_COUNT }, (_, index) => createManualLevelSlot(index + 1)),
);
