import { useEffect, useMemo, useState } from 'react';
import { ELEMENT_TYPES, MONSTER_LABELS, PLANT_TYPES } from './appConfig';
import { LEVELS } from './levels';
import { getLevelDifficultyRatings, type DifficultyCode, type LevelDifficultyRatings } from './levelRatings';
import { MAPS } from './maps';
import { countMapPaths } from './mapPath';
import { BASE_PLANTS_CONFIG, ELEMENT_PLANT_CONFIG } from './plants';
import type { ElementType, PlantType, ShapeType, TowerLevelMap, WaveDef, WaveGroup } from './types';

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
};

type BalanceLabPageProps = {
  onBack: () => void;
  onStartTest: (config: BalanceLabConfig) => void;
};

const LAB_STORAGE_KEY = 'td-balance-lab-config-v2';
const SHAPE_TYPES: ShapeType[] = ['circle', 'triangle', 'square', 'healer', 'evilSniper', 'rager', 'summoner', 'igniter', 'armored', 'iceShell', 'purifier'];
const CORE_DIFFICULTIES: Array<{ code: DifficultyCode; label: string }> = [
  { code: 'EZ', label: 'EZ' },
  { code: 'HD', label: 'HD' },
  { code: 'IN', label: 'IN' },
  { code: 'AT', label: 'AT' },
];

function cloneWaves(waves: WaveDef[]): WaveDef[] {
  return waves.map(wave => ({
    groups: wave.groups.map(group => ({ ...group })),
  }));
}

function readNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createTowerLevels(): TowerLevelMap {
  const levels: TowerLevelMap = {};
  PLANT_TYPES.forEach(plant => {
    levels[plant] = 5;
  });
  ELEMENT_TYPES.forEach(element => {
    levels[`element:${element}`] = 3;
  });
  return levels;
}

function getLevelIndexById(levelId: string) {
  const index = LEVELS.findIndex(level => level.id === levelId);
  return index >= 0 ? index : 0;
}

function getAvailableDifficulties(ratings: LevelDifficultyRatings) {
  return CORE_DIFFICULTIES.filter(item => typeof ratings[item.code] === 'number');
}

function createConfigFromLevel(levelIndex: number, difficulty?: DifficultyCode): BalanceLabConfig {
  const level = LEVELS[levelIndex] ?? LEVELS[0];
  const levelNumber = Math.max(1, levelIndex + 1);
  const ratings = getLevelDifficultyRatings(level.id, levelNumber);
  const available = getAvailableDifficulties(ratings);
  const targetDifficulty = difficulty && typeof ratings[difficulty] === 'number'
    ? difficulty
    : available[0]?.code ?? 'EZ';

  return {
    sourceLevelId: level.id,
    levelName: level.name,
    targetDifficulty,
    mapId: level.mapId,
    startGold: level.startGold,
    lives: level.lives,
    autoStartFirstWave: level.autoStartFirstWave ?? false,
    firstWaveDelaySec: level.firstWaveDelaySec ?? 0.8,
    difficultyRatings: ratings,
    towerLevels: createTowerLevels(),
    waves: cloneWaves(level.waves),
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
    waves: Array.isArray(config.waves) && config.waves.length > 0 ? config.waves : base.waves,
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
  return config.difficultyRatings.IN;
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
    waves: config.waves,
  };
}

function buildExportSource(config: BalanceLabConfig) {
  return `import type { BalanceLabLevelDraft } from './BalanceLabPage';\n\nexport const BALANCE_LAB_LEVEL_DRAFT: BalanceLabLevelDraft = ${JSON.stringify(buildLevelDraft(config), null, 2)};\n`;
}

function createDefaultGroup(): WaveGroup {
  return { type: 'circle', count: 10, interval: 0.4, level: 1, reward: 5 };
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
    if (typeof config.difficultyRatings[difficulty] !== 'number') return;
    setConfig(current => ({
      ...createConfigFromLevel(getLevelIndexById(current.sourceLevelId), difficulty),
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
      const data = await response.json() as { file?: string };
      setSaveStatus(`已写入 ${data.file ?? 'src/td/balanceDraft.generated.ts'}`);
    } catch {
      setSaveStatus('当前环境不能直接写文件，已生成导出内容');
      setExportOpen(true);
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
            <button onClick={saveToLocalDraftFile} className="action-button">保存本地草稿</button>
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
            const available = typeof rating === 'number';
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
      </section>

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
              <span>初始金币</span>
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
            {PLANT_TYPES.map(plant => (
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
          <button onClick={addWave} className="lab-mini-button">新增波次</button>
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
                      <input type="number" step="0.01" value={group.interval} onChange={event => updateWaveGroup(waveIndex, groupIndex, { interval: Math.max(0.01, readNumber(event.target.value, group.interval)) })} />
                    </label>
                    <label>
                      <span>等级</span>
                      <input type="number" value={group.level} onChange={event => updateWaveGroup(waveIndex, groupIndex, { level: Math.max(1, Math.floor(readNumber(event.target.value, group.level))) })} />
                    </label>
                    <label>
                      <span>奖励</span>
                      <input type="number" value={group.reward} onChange={event => updateWaveGroup(waveIndex, groupIndex, { reward: Math.max(0, Math.floor(readNumber(event.target.value, group.reward))) })} />
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
