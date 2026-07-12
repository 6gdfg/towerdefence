import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_UNLOCKED_ITEMS } from '../../shared/unlocks';
import { ELEMENT_TYPES, MONSTER_LABELS, PLANT_TYPES } from './appConfig';
import { getLevelSpecForDifficulty, LEVELS } from './levels';
import { createLabDifficultyRatings, type DifficultyCode, type LevelDifficultyRatings } from './levelRatings';
import { MAPS } from './maps';
import { countMapPaths } from './mapPath';
import { BASE_PLANTS_CONFIG, ELEMENT_PLANT_CONFIG } from './plants';
import type { AtModeConfig, AtModeType, ConveyorItem, ElementType, PlantType, ShapeType, TowerLevelMap, WaveDef, WaveGroup } from './types';

export type BalanceLabConfig = {
  sourceLevelId: string;
  levelName: string;
  targetDifficulty: DifficultyCode;
  mapId: number;
  startGold: number;
  lives: number;
  autoStartFirstWave: boolean;
  firstWaveDelaySec: number;
  difficultyRatings: LevelDifficultyRatings;
  towerLevels: TowerLevelMap;
  waves: WaveDef[];
  atModeConfig?: AtModeConfig;
  unlockRewards: string[];
};

export type BalanceLabLevelDraft = {
  sourceLevelId: string;
  levelNumber: number;
  levelName: string;
  difficulty: DifficultyCode;
  rating: number;
  mapId: number;
  mapName: string;
  startGold: number;
  lives: number;
  autoStartFirstWave: boolean;
  firstWaveDelaySec: number;
  waves: WaveDef[];
  atModeConfig?: AtModeConfig;
  unlockRewards?: string[];
};

type BalanceLabPageProps = {
  onBack: () => void;
  onStartTest: (config: BalanceLabConfig) => void;
};

type BalanceLabDraftReadResponse = {
  draftByKey?: Record<string, BalanceLabLevelDraft>;
  count?: number;
};

const LAB_STORAGE_KEY = 'td-balance-lab-config-v2';
const SHAPE_TYPES: ShapeType[] = ['circle', 'triangle', 'square', 'healer', 'evilSniper', 'rager', 'summoner', 'igniter', 'armored', 'iceShell', 'freezer', 'taunter', 'purifier', 'angryWriter', 'bunker'];
const CORE_DIFFICULTIES: Array<{ code: DifficultyCode; label: string }> = [
  { code: 'EZ', label: 'EZ' },
  { code: 'HD', label: 'HD' },
  { code: 'IN', label: 'IN' },
  { code: 'AT', label: 'AT' },
];
const AT_MODE_OPTIONS: Array<{ type: AtModeType; label: string }> = [
  { type: 'normal', label: '普通' },
  { type: 'conveyor', label: '传送带' },
  { type: 'lastStand', label: '孤注一掷' },
  { type: 'cardSelect', label: '选卡' },
];

const DEFAULT_CONVEYOR_POOL: ConveyorItem[] = [
  { kind: 'plant', id: 'sunflower', weight: 100 },
  { kind: 'plant', id: 'bottleGrass', weight: 100 },
  { kind: 'plant', id: 'puffShroom', weight: 100 },
  { kind: 'plant', id: 'machineGun', weight: 100 },
  { kind: 'element', id: 'fire', weight: 100 },
  { kind: 'element', id: 'ice', weight: 100 },
  { kind: 'element', id: 'wind', weight: 100 },
];

const UNLOCK_ITEM_OPTIONS = [
  ...PLANT_TYPES.map(id => ({ id, label: BASE_PLANTS_CONFIG[id].name })),
  ...ELEMENT_TYPES.map(element => ({ id: `element:${element}`, label: ELEMENT_PLANT_CONFIG[element].name })),
].filter(option => !DEFAULT_UNLOCKED_ITEMS.includes(option.id as typeof DEFAULT_UNLOCKED_ITEMS[number]));

function cloneWaves(waves: WaveDef[]): WaveDef[] {
  return waves.map(wave => ({
    groups: wave.groups.map(group => {
      const next = { ...group };
      delete next.reward;
      return next;
    }),
  }));
}

function readNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function finiteNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getConveyorItemKey(item: ConveyorItem) {
  return `${item.kind}:${item.id}`;
}

function normalizeConveyorWeight(value: unknown) {
  return Math.max(1, Math.floor(finiteNumber(value, 100)));
}

function normalizeUnlockRewards(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const validIds = new Set(UNLOCK_ITEM_OPTIONS.map(option => option.id));
  const seen = new Set<string>();
  const rewards: string[] = [];
  value.forEach(item => {
    if (typeof item !== 'string') return;
    if (!validIds.has(item) || seen.has(item)) return;
    seen.add(item);
    rewards.push(item);
  });
  return rewards;
}

function createDefaultAtModeConfig(type: AtModeType = 'normal'): AtModeConfig {
  if (type === 'conveyor') {
    return {
      type,
      conveyor: {
        intervalSec: 3,
        maxQueue: 8,
        pool: DEFAULT_CONVEYOR_POOL,
      },
    };
  }
  if (type === 'lastStand') {
    return {
      type,
      lastStand: {
        startGold: 3000,
        bannedPlants: ['sunflower'],
        disableKillRewards: true,
      },
    };
  }
  if (type === 'cardSelect') {
    return {
      type,
      cardSelect: {
        maxPlants: 5,
        maxElements: 2,
        monsterLevelMultiplier: 10,
      },
    };
  }
  return { type: 'normal' };
}

function normalizeConveyorPool(pool: ConveyorItem[] | undefined) {
  const seen = new Set<string>();
  const normalized: ConveyorItem[] = [];
  (pool && pool.length > 0 ? pool : DEFAULT_CONVEYOR_POOL).forEach(item => {
    const valid = item.kind === 'plant'
      ? PLANT_TYPES.includes(item.id as PlantType)
      : ELEMENT_TYPES.includes(item.id as ElementType);
    if (!valid) return;
    const key = getConveyorItemKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push({ ...item, weight: normalizeConveyorWeight(item.weight) });
  });
  return normalized.length > 0 ? normalized : DEFAULT_CONVEYOR_POOL;
}

function normalizeAtModeConfig(config?: AtModeConfig | null): AtModeConfig {
  const type = config?.type ?? 'normal';
  const defaults = createDefaultAtModeConfig(type);
  if (type === 'conveyor') {
    const conveyor = config?.conveyor ?? defaults.conveyor!;
    return {
      type,
      conveyor: {
        intervalSec: Math.max(0.2, finiteNumber(conveyor.intervalSec, defaults.conveyor!.intervalSec)),
        maxQueue: Math.max(1, Math.floor(finiteNumber(conveyor.maxQueue, defaults.conveyor!.maxQueue))),
        pool: normalizeConveyorPool(conveyor.pool),
      },
    };
  }
  if (type === 'lastStand') {
    const lastStand = config?.lastStand ?? defaults.lastStand!;
    const bannedPlants = Array.from(new Set([...(lastStand.bannedPlants ?? []), 'sunflower']))
      .filter((plant): plant is PlantType => PLANT_TYPES.includes(plant as PlantType));
    return {
      type,
      lastStand: {
        startGold: Math.max(0, Math.floor(finiteNumber(lastStand.startGold, defaults.lastStand!.startGold))),
        bannedPlants,
        disableKillRewards: lastStand.disableKillRewards ?? true,
      },
    };
  }
  if (type === 'cardSelect') {
    const cardSelect = config?.cardSelect ?? defaults.cardSelect!;
    return {
      type,
      cardSelect: {
        maxPlants: Math.max(1, Math.floor(finiteNumber(cardSelect.maxPlants, defaults.cardSelect!.maxPlants))),
        maxElements: Math.max(0, Math.floor(finiteNumber(cardSelect.maxElements, defaults.cardSelect!.maxElements))),
        monsterLevelMultiplier: Math.max(1, finiteNumber(cardSelect.monsterLevelMultiplier, defaults.cardSelect!.monsterLevelMultiplier)),
      },
    };
  }
  return { type: 'normal' };
}

function createTowerLevels(): TowerLevelMap {
  const levels: TowerLevelMap = {};
  PLANT_TYPES.forEach(plant => {
    if (BASE_PLANTS_CONFIG[plant].upgradeable === false) return;
    levels[plant] = 5;
  });
  ELEMENT_TYPES.forEach(element => {
    levels[`element:${element}`] = 3;
  });
  return levels;
}

function createDefaultWaves(): WaveDef[] {
  return [{ groups: [createDefaultGroup()] }];
}

function getLevelIndexById(levelId: string) {
  const index = LEVELS.findIndex(level => level.id === levelId);
  return index >= 0 ? index : 0;
}

function getAvailableDifficulties(ratings: LevelDifficultyRatings) {
  return CORE_DIFFICULTIES.filter(item => typeof ratings[item.code] === 'number');
}

function createConfigFromLevel(levelIndex: number, difficulty?: DifficultyCode): BalanceLabConfig {
  const baseLevel = LEVELS[levelIndex] ?? LEVELS[0];
  const levelNumber = Math.max(1, levelIndex + 1);
  const ratings: LevelDifficultyRatings = { ...createLabDifficultyRatings(baseLevel.id, levelNumber) };
  const available = getAvailableDifficulties(ratings);
  const targetDifficulty = difficulty && (difficulty === 'AT' || typeof ratings[difficulty] === 'number')
    ? difficulty
    : available[0]?.code ?? 'EZ';
  if (targetDifficulty === 'AT' && typeof ratings.AT !== 'number') {
    ratings.AT = Math.max(1, Math.round((ratings.IN ?? 15) + 1));
  }
  const level = getLevelSpecForDifficulty(baseLevel, targetDifficulty);
  const waves = level.waves.length > 0 ? level.waves : createDefaultWaves();

  return {
    sourceLevelId: baseLevel.id,
    levelName: baseLevel.name,
    targetDifficulty,
    mapId: level.mapId,
    startGold: level.startGold,
    lives: level.lives,
    autoStartFirstWave: level.autoStartFirstWave ?? false,
    firstWaveDelaySec: level.firstWaveDelaySec ?? 0.8,
    difficultyRatings: ratings,
    towerLevels: createTowerLevels(),
    waves: cloneWaves(waves),
    atModeConfig: targetDifficulty === 'AT' ? normalizeAtModeConfig(level.atModeConfig) : undefined,
    unlockRewards: normalizeUnlockRewards(level.unlockRewards),
  };
}

function normalizeConfig(config: BalanceLabConfig | null): BalanceLabConfig | null {
  if (!config) return null;
  const base = createConfigFromLevel(getLevelIndexById(config.sourceLevelId), config.targetDifficulty);
  return {
    ...base,
    ...config,
    difficultyRatings: {
      ...base.difficultyRatings,
      ...config.difficultyRatings,
    },
    towerLevels: {
      ...base.towerLevels,
      ...config.towerLevels,
    },
    waves: Array.isArray(config.waves) && config.waves.length > 0 ? cloneWaves(config.waves) : base.waves,
    atModeConfig: config.targetDifficulty === 'AT'
      ? normalizeAtModeConfig(config.atModeConfig ?? base.atModeConfig)
      : undefined,
    unlockRewards: normalizeUnlockRewards((config as Partial<BalanceLabConfig>).unlockRewards),
  };
}

function loadStoredConfig(): BalanceLabConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAB_STORAGE_KEY);
    if (!raw) return null;
    return normalizeConfig(JSON.parse(raw) as BalanceLabConfig);
  } catch {
    return null;
  }
}

function getDraftRating(config: BalanceLabConfig) {
  const rating = config.difficultyRatings[config.targetDifficulty];
  if (typeof rating === 'number') return rating;
  return config.difficultyRatings.IN ?? 1;
}

function buildLevelDraft(config: BalanceLabConfig): BalanceLabLevelDraft {
  const map = MAPS.find(item => item.id === config.mapId);
  return {
    sourceLevelId: config.sourceLevelId,
    levelNumber: getLevelIndexById(config.sourceLevelId) + 1,
    levelName: config.levelName,
    difficulty: config.targetDifficulty,
    rating: getDraftRating(config),
    mapId: config.mapId,
    mapName: map?.name ?? `Map ${config.mapId}`,
    startGold: config.startGold,
    lives: config.lives,
    autoStartFirstWave: config.autoStartFirstWave,
    firstWaveDelaySec: config.firstWaveDelaySec,
    waves: cloneWaves(config.waves),
    atModeConfig: config.targetDifficulty === 'AT' ? normalizeAtModeConfig(config.atModeConfig) : undefined,
    unlockRewards: normalizeUnlockRewards(config.unlockRewards),
  };
}

function getDraftKeyForConfig(config: BalanceLabConfig) {
  return `${config.sourceLevelId}:${config.targetDifficulty}`;
}

function createConfigFromDraft(draft: BalanceLabLevelDraft, current: BalanceLabConfig): BalanceLabConfig {
  const base = createConfigFromLevel(getLevelIndexById(draft.sourceLevelId), draft.difficulty);
  return {
    ...base,
    sourceLevelId: draft.sourceLevelId,
    levelName: draft.levelName,
    targetDifficulty: draft.difficulty,
    mapId: draft.mapId,
    startGold: draft.startGold,
    lives: draft.lives,
    autoStartFirstWave: draft.autoStartFirstWave,
    firstWaveDelaySec: draft.firstWaveDelaySec,
    difficultyRatings: {
      ...base.difficultyRatings,
      [draft.difficulty]: draft.rating,
    },
    towerLevels: current.towerLevels,
    waves: cloneWaves(draft.waves),
    atModeConfig: draft.difficulty === 'AT' ? normalizeAtModeConfig(draft.atModeConfig) : undefined,
    unlockRewards: normalizeUnlockRewards(draft.unlockRewards),
  };
}

function buildExportSource(config: BalanceLabConfig) {
  return `import type { BalanceLabLevelDraft } from './BalanceLabPage';\n\nexport const BALANCE_LAB_LEVEL_DRAFT: BalanceLabLevelDraft = ${JSON.stringify(buildLevelDraft(config), null, 2)};\n`;
}

function createDefaultGroup(): WaveGroup {
  return { type: 'circle', count: 10, interval: 0.4, level: 1 };
}

function normalizePastedGroup(value: unknown): WaveGroup | null {
  if (!isRecord(value)) return null;
  const type = SHAPE_TYPES.includes(value.type as ShapeType) ? value.type as ShapeType : null;
  if (!type) return null;

  const group: WaveGroup = {
    type,
    count: Math.max(1, Math.floor(finiteNumber(value.count, 1))),
    interval: Math.max(0.1, finiteNumber(value.interval, 0.4)),
    level: Math.max(1, Math.floor(finiteNumber(value.level, 1))),
  };

  if (value.isBoss === true) {
    group.isBoss = true;
  }
  if (value.startDelay != null) {
    group.startDelay = Math.max(0, finiteNumber(value.startDelay, 0));
  }
  if (value.pathId != null) {
    group.pathId = Math.max(0, Math.floor(finiteNumber(value.pathId, 0)));
  }
  if (value.leakDamage != null) {
    group.leakDamage = Math.max(0, Math.floor(finiteNumber(value.leakDamage, 1)));
  }

  return group;
}

function normalizePastedWaves(value: unknown): WaveDef[] | null {
  const rawWaves = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.waves)
      ? value.waves
      : null;
  if (!rawWaves) return null;

  const waves = rawWaves
    .map(wave => {
      if (!isRecord(wave) || !Array.isArray(wave.groups)) return null;
      const groups = wave.groups
        .map(group => normalizePastedGroup(group))
        .filter((group): group is WaveGroup => Boolean(group));
      return groups.length > 0 ? { groups } : null;
    })
    .filter((wave): wave is WaveDef => Boolean(wave));

  return waves.length > 0 ? waves : null;
}

export default function BalanceLabPage({ onBack, onStartTest }: BalanceLabPageProps) {
  const [config, setConfig] = useState<BalanceLabConfig>(() => loadStoredConfig() ?? createConfigFromLevel(0));
  const [exportOpen, setExportOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const selectedLevelIndex = getLevelIndexById(config.sourceLevelId);
  const draftRating = getDraftRating(config);
  const selectedMap = MAPS.find(map => map.id === config.mapId);
  const selectedMapPathCount = Math.max(1, countMapPaths(selectedMap));
  const exportSource = useMemo(() => buildExportSource(config), [config]);
  const isAtEditing = config.targetDifficulty === 'AT';
  const atModeConfig = isAtEditing ? normalizeAtModeConfig(config.atModeConfig) : createDefaultAtModeConfig('normal');
  const atModeType = atModeConfig.type;
  const cardSelectLocksMonsterLevel = isAtEditing && atModeType === 'cardSelect';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const updateConfig = (patch: Partial<BalanceLabConfig>) => {
    setConfig(current => ({ ...current, ...patch }));
  };

  const updateRating = (value: number) => {
    setConfig(current => ({
      ...current,
      difficultyRatings: {
        ...current.difficultyRatings,
        [current.targetDifficulty]: value,
      },
    }));
  };

  const selectLevel = (levelIndex: number) => {
    setConfig(createConfigFromLevel(levelIndex, config.targetDifficulty));
  };

  const selectDifficulty = (difficulty: DifficultyCode) => {
    if (difficulty !== 'AT' && typeof config.difficultyRatings[difficulty] !== 'number') return;
    setConfig(current => ({
      ...createConfigFromLevel(getLevelIndexById(current.sourceLevelId), difficulty),
      levelName: current.levelName,
      towerLevels: current.towerLevels,
    }));
  };

  const updateTowerLevel = (key: PlantType | `element:${ElementType}`, value: number) => {
    setConfig(current => ({
      ...current,
      towerLevels: {
        ...current.towerLevels,
        [key]: Math.max(1, Math.floor(value || 1)),
      },
    }));
  };

  const toggleUnlockReward = (itemId: string) => {
    setConfig(current => {
      const currentRewards = normalizeUnlockRewards(current.unlockRewards);
      const next = currentRewards.includes(itemId)
        ? currentRewards.filter(item => item !== itemId)
        : [...currentRewards, itemId];
      return { ...current, unlockRewards: normalizeUnlockRewards(next) };
    });
  };

  const setAtMode = (type: AtModeType) => {
    setConfig(current => ({
      ...current,
      atModeConfig: createDefaultAtModeConfig(type),
      autoStartFirstWave: type === 'lastStand' ? false : current.autoStartFirstWave,
    }));
  };

  const updateAtModeConfig = (next: AtModeConfig) => {
    setConfig(current => ({
      ...current,
      atModeConfig: normalizeAtModeConfig(next),
    }));
  };

  const updateConveyorConfig = (patch: Partial<NonNullable<AtModeConfig['conveyor']>>) => {
    const currentMode = normalizeAtModeConfig(config.atModeConfig);
    const base = currentMode.type === 'conveyor' ? currentMode : createDefaultAtModeConfig('conveyor');
    updateAtModeConfig({
      type: 'conveyor',
      conveyor: {
        ...base.conveyor!,
        ...patch,
      },
    });
  };

  const toggleConveyorItem = (item: ConveyorItem) => {
    const currentMode = normalizeAtModeConfig(config.atModeConfig);
    const base = currentMode.type === 'conveyor' ? currentMode : createDefaultAtModeConfig('conveyor');
    const key = getConveyorItemKey(item);
    const exists = base.conveyor!.pool.some(poolItem => getConveyorItemKey(poolItem) === key);
    const pool = exists
      ? base.conveyor!.pool.filter(poolItem => getConveyorItemKey(poolItem) !== key)
      : [...base.conveyor!.pool, { ...item, weight: 100 }];
    updateConveyorConfig({ pool });
  };

  const updateConveyorItemWeight = (item: ConveyorItem, weight: number) => {
    const currentMode = normalizeAtModeConfig(config.atModeConfig);
    const base = currentMode.type === 'conveyor' ? currentMode : createDefaultAtModeConfig('conveyor');
    const key = getConveyorItemKey(item);
    const pool = base.conveyor!.pool.map(poolItem => (
      getConveyorItemKey(poolItem) === key
        ? { ...poolItem, weight: normalizeConveyorWeight(weight) }
        : poolItem
    ));
    updateConveyorConfig({ pool });
  };

  const updateLastStandConfig = (patch: Partial<NonNullable<AtModeConfig['lastStand']>>) => {
    const currentMode = normalizeAtModeConfig(config.atModeConfig);
    const base = currentMode.type === 'lastStand' ? currentMode : createDefaultAtModeConfig('lastStand');
    updateAtModeConfig({
      type: 'lastStand',
      lastStand: {
        ...base.lastStand!,
        ...patch,
      },
    });
  };

  const updateCardSelectConfig = (patch: Partial<NonNullable<AtModeConfig['cardSelect']>>) => {
    const currentMode = normalizeAtModeConfig(config.atModeConfig);
    const base = currentMode.type === 'cardSelect' ? currentMode : createDefaultAtModeConfig('cardSelect');
    updateAtModeConfig({
      type: 'cardSelect',
      cardSelect: {
        ...base.cardSelect!,
        ...patch,
      },
    });
  };

  const updateWaveGroup = (waveIndex: number, groupIndex: number, patch: Partial<WaveGroup>) => {
    setConfig(current => ({
      ...current,
      waves: current.waves.map((wave, wIndex) => {
        if (wIndex !== waveIndex) return wave;
        return {
          groups: wave.groups.map((group, gIndex) => (
            gIndex === groupIndex ? { ...group, ...patch } : group
          )),
        };
      }),
    }));
  };

  const addGroup = (waveIndex: number) => {
    setConfig(current => ({
      ...current,
      waves: current.waves.map((wave, index) => (
        index === waveIndex ? { groups: [...wave.groups, createDefaultGroup()] } : wave
      )),
    }));
  };

  const removeGroup = (waveIndex: number, groupIndex: number) => {
    setConfig(current => ({
      ...current,
      waves: current.waves.map((wave, index) => {
        if (index !== waveIndex) return wave;
        const groups = wave.groups.filter((_, gIndex) => gIndex !== groupIndex);
        return { groups: groups.length > 0 ? groups : [createDefaultGroup()] };
      }),
    }));
  };

  const addWave = () => {
    setConfig(current => ({
      ...current,
      waves: [...current.waves, { groups: [createDefaultGroup()] }],
    }));
  };

  const duplicateWave = (waveIndex: number) => {
    setConfig(current => {
      const source = current.waves[waveIndex] ?? { groups: [createDefaultGroup()] };
      const waves = [...current.waves];
      waves.splice(waveIndex + 1, 0, { groups: source.groups.map(group => ({ ...group })) });
      return { ...current, waves };
    });
  };

  const removeWave = (waveIndex: number) => {
    setConfig(current => {
      const waves = current.waves.filter((_, index) => index !== waveIndex);
      return { ...current, waves: waves.length > 0 ? waves : [{ groups: [createDefaultGroup()] }] };
    });
  };

  const copyMonsterConfig = async () => {
    const payload = JSON.stringify({
      kind: 'td-wave-config-v1',
      waves: cloneWaves(config.waves),
    }, null, 2);

    try {
      await navigator.clipboard.writeText(payload);
      setSaveStatus(`已复制 ${config.waves.length} 波怪物配置`);
    } catch {
      window.prompt('复制失败，请手动复制以下怪物配置', payload);
      setSaveStatus('复制失败，已打开手动复制窗口');
    }
  };

  const pasteMonsterConfig = async () => {
    let text = '';
    try {
      text = await navigator.clipboard.readText();
    } catch {
      text = window.prompt('粘贴怪物配置 JSON') ?? '';
    }

    if (!text.trim()) {
      setSaveStatus('没有读取到可粘贴的怪物配置');
      return;
    }

    try {
      const parsed = JSON.parse(text) as unknown;
      const waves = normalizePastedWaves(parsed);
      if (!waves) {
        setSaveStatus('怪物配置格式不正确');
        return;
      }

      setConfig(current => ({
        ...current,
        waves,
      }));
      setSaveStatus(`已粘贴 ${waves.length} 波怪物配置`);
    } catch {
      setSaveStatus('怪物配置不是有效 JSON');
    }
  };

  const resetCurrentTarget = () => {
    setConfig(createConfigFromLevel(selectedLevelIndex, config.targetDifficulty));
  };

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportSource);
      setSaveStatus('已复制导出内容');
    } catch {
      setSaveStatus('复制失败，请手动复制文本框内容');
    }
  };

  const saveToLocalDraftFile = async () => {
    setSaveStatus('保存中...');
    try {
      const response = await fetch('/__td_lab_save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: buildLevelDraft(config) }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json() as { file?: string; key?: string; count?: number };
      const keyText = data.key ? ` ${data.key}` : '';
      const countText = typeof data.count === 'number' ? `，共 ${data.count} 份配置` : '';
      setSaveStatus(`已保存并应用${keyText}${countText}：${data.file ?? 'src/td/balanceDraft.generated.ts'}`);
    } catch {
      setSaveStatus('当前环境不能直接写文件，已生成导出内容');
      setExportOpen(true);
    }
  };

  const loadCurrentDraft = async () => {
    const key = getDraftKeyForConfig(config);
    setSaveStatus(`读取 ${key} 中...`);
    try {
      const response = await fetch('/__td_lab_save');
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json() as BalanceLabDraftReadResponse;
      const draft = data.draftByKey?.[key];
      if (!draft) {
        setSaveStatus(`当前没有已保存的 ${key}，共有 ${data.count ?? 0} 份配置`);
        return;
      }

      setConfig(current => createConfigFromDraft(draft, current));
      setSaveStatus(`已读取 ${key}`);
    } catch {
      setSaveStatus('当前环境不能读取本地配置，请确认 dev server 已重启');
    }
  };

  return (
    <main className="page-wrap balance-lab-page">
      <section className="glass-panel hero-panel card-enter" style={{ opacity: 0, animationDelay: '0s' }}>
        <div className="page-title-row">
          <div>
            <div className="eyebrow">Balance Lab</div>
            <h1>平衡实验室</h1>
          </div>
          <div className="button-row">
            <button onClick={() => onStartTest(config)} className="action-button primary">测试当前配置</button>
            <button onClick={saveToLocalDraftFile} className="action-button">保存并应用</button>
            <button onClick={loadCurrentDraft} className="action-button">读取已保存配置</button>
            <button onClick={() => setExportOpen(open => !open)} className="action-button">导出配置</button>
            <button onClick={onBack} className="action-button">返回</button>
          </div>
        </div>
        {saveStatus && <div className="muted lab-status">{saveStatus}</div>}
      </section>

      {exportOpen && (
        <section className="soft-card lab-panel card-enter" style={{ opacity: 0, animationDelay: '0.03s' }}>
          <div className="lab-panel-title">
            <span>导出代码</span>
            <button onClick={copyExport} className="lab-mini-button">复制</button>
          </div>
          <textarea className="lab-export-textarea" readOnly value={exportSource} />
        </section>
      )}

      <section className="soft-card lab-panel card-enter" style={{ opacity: 0, animationDelay: '0.06s' }}>
        <div className="lab-panel-title">
          <span>编辑目标</span>
          <button onClick={resetCurrentTarget} className="lab-mini-button">恢复当前目标默认数据</button>
        </div>
        <div className="lab-target-grid">
          <label className="lab-field">
            <span>关卡</span>
            <select className="lab-input" value={selectedLevelIndex} onChange={event => selectLevel(readNumber(event.target.value, 0))}>
              {LEVELS.map((level, index) => (
                <option key={level.id} value={index}>{`${index + 1}. ${level.name}`}</option>
              ))}
            </select>
          </label>
          <label className="lab-field">
            <span>关卡名</span>
            <input className="lab-input" value={config.levelName} onChange={event => updateConfig({ levelName: event.target.value })} />
          </label>
          <label className="lab-field">
            <span>当前定数</span>
            <input className="lab-input" type="number" value={draftRating} onChange={event => updateRating(readNumber(event.target.value, draftRating))} />
          </label>
        </div>
        <div className="lab-difficulty-picker">
          {CORE_DIFFICULTIES.map(item => {
            const rating = config.difficultyRatings[item.code];
            const available = item.code === 'AT' || typeof rating === 'number';
            const active = config.targetDifficulty === item.code;
            return (
              <button
                key={item.code}
                onClick={() => selectDifficulty(item.code)}
                disabled={!available}
                className={`lab-target-card rating-${item.code.toLowerCase()} ${active ? 'is-active' : ''}`}
              >
                <span>{item.label}</span>
                <strong>{available ? rating : '-'}</strong>
              </button>
            );
          })}
        </div>
        <div className="lab-draft-summary">
          当前编辑：第 {selectedLevelIndex + 1} 关 / {config.levelName} / {config.targetDifficulty}{draftRating}
        </div>
        <div className="lab-pool-title">通关解锁</div>
        <div className="lab-pool-grid">
          {UNLOCK_ITEM_OPTIONS.map(option => {
            const checked = config.unlockRewards.includes(option.id);
            return (
              <label key={`unlock-${option.id}`} className={`lab-pool-chip ${option.id.startsWith('element:') ? 'element' : ''} ${checked ? 'is-active' : ''}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleUnlockReward(option.id)} />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </section>

      {isAtEditing && (
        <section className="soft-card lab-panel card-enter" style={{ opacity: 0, animationDelay: '0.075s' }}>
          <div className="lab-panel-title">
            <span>AT 模式</span>
          </div>
          <div className="lab-mode-grid">
            {AT_MODE_OPTIONS.map(option => (
              <button
                key={option.type}
                onClick={() => setAtMode(option.type)}
                className={`lab-mode-card ${atModeType === option.type ? 'is-active' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {atModeType === 'conveyor' && (
            <div className="lab-at-panel">
              <div className="lab-form-grid">
                <label className="lab-field">
                  <span>出物间隔</span>
                  <input
                    className="lab-input"
                    type="number"
                    min="0.2"
                    step="0.1"
                    value={atModeConfig.conveyor?.intervalSec ?? 3}
                    onChange={event => updateConveyorConfig({ intervalSec: Math.max(0.2, readNumber(event.target.value, 3)) })}
                  />
                </label>
                <label className="lab-field">
                  <span>队列上限</span>
                  <input
                    className="lab-input"
                    type="number"
                    min="1"
                    value={atModeConfig.conveyor?.maxQueue ?? 8}
                    onChange={event => updateConveyorConfig({ maxQueue: Math.max(1, Math.floor(readNumber(event.target.value, 8))) })}
                  />
                </label>
              </div>
              <div className="lab-pool-title">传送带池</div>
              <div className="lab-pool-grid">
                {PLANT_TYPES.map(plant => {
                  const item: ConveyorItem = { kind: 'plant', id: plant };
                  const poolItem = atModeConfig.conveyor?.pool.find(entry => getConveyorItemKey(entry) === getConveyorItemKey(item));
                  const checked = Boolean(poolItem);
                  return (
                    <label key={`conveyor-${plant}`} className={`lab-pool-chip ${checked ? 'is-active' : ''}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleConveyorItem(item)} />
                      <span>{BASE_PLANTS_CONFIG[plant].name}</span>
                      {checked && (
                        <input
                          className="lab-pool-weight"
                          type="number"
                          min="1"
                          value={poolItem?.weight ?? 100}
                          aria-label={`${BASE_PLANTS_CONFIG[plant].name} 权重`}
                          onClick={event => event.stopPropagation()}
                          onChange={event => updateConveyorItemWeight(item, readNumber(event.target.value, 100))}
                        />
                      )}
                    </label>
                  );
                })}
                {ELEMENT_TYPES.map(element => {
                  const item: ConveyorItem = { kind: 'element', id: element };
                  const poolItem = atModeConfig.conveyor?.pool.find(entry => getConveyorItemKey(entry) === getConveyorItemKey(item));
                  const checked = Boolean(poolItem);
                  return (
                    <label key={`conveyor-element-${element}`} className={`lab-pool-chip element ${checked ? 'is-active' : ''}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleConveyorItem(item)} />
                      <span>{ELEMENT_PLANT_CONFIG[element].name}</span>
                      {checked && (
                        <input
                          className="lab-pool-weight"
                          type="number"
                          min="1"
                          value={poolItem?.weight ?? 100}
                          aria-label={`${ELEMENT_PLANT_CONFIG[element].name} 权重`}
                          onClick={event => event.stopPropagation()}
                          onChange={event => updateConveyorItemWeight(item, readNumber(event.target.value, 100))}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {atModeType === 'lastStand' && (
            <div className="lab-at-panel">
              <div className="lab-form-grid">
                <label className="lab-field">
                  <span>开局阳光</span>
                  <input
                    className="lab-input"
                    type="number"
                    min="0"
                    value={atModeConfig.lastStand?.startGold ?? 3000}
                    onChange={event => updateLastStandConfig({ startGold: Math.max(0, Math.floor(readNumber(event.target.value, 3000))) })}
                  />
                </label>
              </div>
              <label className="lab-check">
                <input type="checkbox" checked readOnly />
                <span>击杀不掉阳光</span>
              </label>
              <div className="lab-draft-summary">向日葵在该模式中固定禁用；进入后不会自动出怪，点击开始后再刷怪。</div>
            </div>
          )}

          {atModeType === 'cardSelect' && (
            <div className="lab-at-panel">
              <div className="lab-form-grid">
                <label className="lab-field">
                  <span>植物上限</span>
                  <input
                    className="lab-input"
                    type="number"
                    min="1"
                    value={atModeConfig.cardSelect?.maxPlants ?? 5}
                    onChange={event => updateCardSelectConfig({ maxPlants: Math.max(1, Math.floor(readNumber(event.target.value, 5))) })}
                  />
                </label>
                <label className="lab-field">
                  <span>元素上限</span>
                  <input
                    className="lab-input"
                    type="number"
                    min="0"
                    value={atModeConfig.cardSelect?.maxElements ?? 2}
                    onChange={event => updateCardSelectConfig({ maxElements: Math.max(0, Math.floor(readNumber(event.target.value, 2))) })}
                  />
                </label>
                <label className="lab-field">
                  <span>怪物等级倍率</span>
                  <input
                    className="lab-input"
                    type="number"
                    min="1"
                    step="0.1"
                    value={atModeConfig.cardSelect?.monsterLevelMultiplier ?? 10}
                    onChange={event => updateCardSelectConfig({ monsterLevelMultiplier: Math.max(1, readNumber(event.target.value, 10)) })}
                  />
                </label>
              </div>
              <div className="lab-draft-summary">该模式运行时会按所选植物最高等级重新写入怪物等级。</div>
            </div>
          )}
        </section>
      )}

      <section className="balance-lab-grid">
        <div className="soft-card lab-panel card-enter" style={{ opacity: 0, animationDelay: '0.09s' }}>
          <div className="lab-panel-title">
            <span>关卡选项</span>
          </div>
          <div className="lab-form-grid">
            <label className="lab-field">
              <span>地图</span>
              <select className="lab-input" value={config.mapId} onChange={event => updateConfig({ mapId: readNumber(event.target.value, config.mapId) })}>
                {MAPS.map(map => (
                  <option key={map.id} value={map.id}>{`${map.id}. ${map.name}`}</option>
                ))}
              </select>
            </label>
            <label className="lab-field">
              <span>初始阳光</span>
              <input className="lab-input" type="number" value={config.startGold} onChange={event => updateConfig({ startGold: readNumber(event.target.value, config.startGold) })} />
            </label>
            <label className="lab-field">
              <span>生命</span>
              <input className="lab-input" type="number" value={config.lives} onChange={event => updateConfig({ lives: readNumber(event.target.value, config.lives) })} />
            </label>
            <label className="lab-field">
              <span>首波延迟</span>
              <input className="lab-input" type="number" step="0.1" value={config.firstWaveDelaySec} onChange={event => updateConfig({ firstWaveDelaySec: readNumber(event.target.value, config.firstWaveDelaySec) })} />
            </label>
          </div>
          <label className="lab-check">
            <input
              type="checkbox"
              checked={config.autoStartFirstWave}
              onChange={event => updateConfig({ autoStartFirstWave: event.target.checked })}
            />
            <span>进入测试后自动出第一波</span>
          </label>
        </div>

        <div className="soft-card lab-panel card-enter" style={{ opacity: 0, animationDelay: '0.12s' }}>
          <div className="lab-panel-title">
            <span>测试等级</span>
          </div>
          <div className="lab-level-grid compact">
            {PLANT_TYPES.filter(plant => BASE_PLANTS_CONFIG[plant].upgradeable !== false).map(plant => (
              <label key={plant} className="lab-level-tile">
                <span>{BASE_PLANTS_CONFIG[plant].name}</span>
                <input
                  type="number"
                  min="1"
                  value={config.towerLevels[plant] ?? 1}
                  onChange={event => updateTowerLevel(plant, readNumber(event.target.value, 1))}
                />
              </label>
            ))}
            {ELEMENT_TYPES.map(element => {
              const key = `element:${element}` as const;
              return (
                <label key={key} className="lab-level-tile element">
                  <span>{ELEMENT_PLANT_CONFIG[element].name}</span>
                  <input
                    type="number"
                    min="1"
                    value={config.towerLevels[key] ?? 1}
                    onChange={event => updateTowerLevel(key, readNumber(event.target.value, 1))}
                  />
                </label>
              );
            })}
          </div>
        </div>
      </section>

      <section className="soft-card lab-panel card-enter" style={{ opacity: 0, animationDelay: '0.15s' }}>
        <div className="lab-panel-title">
          <span>波次编辑</span>
          <div className="button-row">
            <button onClick={copyMonsterConfig} className="lab-mini-button">复制怪物配置</button>
            <button onClick={pasteMonsterConfig} className="lab-mini-button">粘贴怪物配置</button>
            <button onClick={addWave} className="lab-mini-button">新增波次</button>
          </div>
        </div>
        <div className="lab-wave-list">
          {config.waves.map((wave, waveIndex) => (
            <article key={`wave-${waveIndex}`} className="lab-wave-card">
              <div className="lab-wave-head">
                <strong>{`Wave ${waveIndex + 1}`}</strong>
                <div className="button-row">
                  <button onClick={() => addGroup(waveIndex)} className="lab-mini-button">加怪组</button>
                  <button onClick={() => duplicateWave(waveIndex)} className="lab-mini-button">复制波次</button>
                  <button onClick={() => removeWave(waveIndex)} className="lab-mini-button danger">删除</button>
                </div>
              </div>
              <div className="lab-group-list">
                {wave.groups.map((group, groupIndex) => (
                  <div key={`wave-${waveIndex}-group-${groupIndex}`} className="lab-group-row">
                    <label>
                      <span>类型</span>
                      <select value={group.type} onChange={event => updateWaveGroup(waveIndex, groupIndex, { type: event.target.value as ShapeType })}>
                        {SHAPE_TYPES.map(shape => (
                          <option key={shape} value={shape}>{MONSTER_LABELS[shape] ?? shape}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>数量</span>
                      <input type="number" value={group.count} onChange={event => updateWaveGroup(waveIndex, groupIndex, { count: Math.max(1, Math.floor(readNumber(event.target.value, group.count))) })} />
                    </label>
                    <label>
                      <span>间隔</span>
                      <input type="number" min="0.1" step="0.1" value={group.interval} onChange={event => updateWaveGroup(waveIndex, groupIndex, { interval: Math.max(0.1, readNumber(event.target.value, group.interval)) })} />
                    </label>
                    <label>
                      <span>起始</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="顺序"
                        value={group.startDelay ?? ''}
                        onChange={event => updateWaveGroup(
                          waveIndex,
                          groupIndex,
                          event.target.value.trim() === ''
                            ? { startDelay: undefined }
                            : { startDelay: Math.max(0, readNumber(event.target.value, group.startDelay ?? 0)) },
                        )}
                      />
                    </label>
                    <label>
                      <span>等级</span>
                      <input
                        type="number"
                        value={group.level}
                        disabled={cardSelectLocksMonsterLevel}
                        title={cardSelectLocksMonsterLevel ? '选卡模式运行时统一按最高植物等级和倍率计算' : undefined}
                        onChange={event => updateWaveGroup(waveIndex, groupIndex, { level: Math.max(1, Math.floor(readNumber(event.target.value, group.level))) })}
                      />
                    </label>
                    <label>
                      <span>路径</span>
                      <select
                        value={group.pathId == null ? 'auto' : String(group.pathId)}
                        onChange={event => updateWaveGroup(
                          waveIndex,
                          groupIndex,
                          event.target.value === 'auto'
                            ? { pathId: undefined }
                            : { pathId: Math.max(0, Math.floor(readNumber(event.target.value, group.pathId ?? 0))) },
                        )}
                      >
                        <option value="auto">自动分流</option>
                        {Array.from({ length: selectedMapPathCount }, (_, pathIndex) => (
                          <option key={pathIndex} value={pathIndex}>{`路径 ${pathIndex + 1}`}</option>
                        ))}
                      </select>
                    </label>
                    <label className="lab-boss-check">
                      <span>Boss</span>
                      <input
                        type="checkbox"
                        checked={!!group.isBoss}
                        onChange={event => updateWaveGroup(waveIndex, groupIndex, { isBoss: event.target.checked })}
                      />
                    </label>
                    <button onClick={() => removeGroup(waveIndex, groupIndex)} className="lab-mini-button danger">删</button>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
