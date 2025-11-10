import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import TDGame from './td/TDGame';
import LoadingScreen from './td/LoadingScreen';
import TransitionScreen from './td/TransitionScreen';
import { useTDStore } from './td/store';
import { LEVELS, DIFFICULTY_CONFIG, MONSTER_BASE_STATS } from './td/levels';
import { MAPS, getPlantGrid, SPIRAL_MAP_ID } from './td/maps';
import type { MapSpec } from './td/maps';
import { getUsername, loginUser, registerUser, fetchCloudProgress, getPlayerId, getToken, clearAuth } from './td/authProgress';
import { getUnlocked, setUnlocked as setUnlockedPersist, getMaxStarSync, setStarCleared, refreshCache, initCache, getUnlockedItems, DEFAULT_UNLOCKED_ITEMS, updateUnlockedItems, getAllStars } from './td/progress';
import { BASE_PLANTS_CONFIG, ELEMENT_PLANT_CONFIG, getPlantStatsForLevel, BasePlantConfig } from './td/plants';
import { ElementType, PlantType, WaveDef, ShapeType, WaveGroup } from './td/types';

// 统一按钮样式（hover 效果在 index.css 中定义）
const btnStyle = (disabled = false): React.CSSProperties => ({
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: disabled ? '#f3f4f6' : '#fff',
  color: disabled ? '#9ca3af' : '#111827',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.15s ease',
});

const PLANT_TYPES: PlantType[] = ['sunflower','bottleGrass','fourLeafClover','machineGun','sniper','rocket','sunlightFlower'];
const ELEMENT_TYPES: ElementType[] = ['fire','wind','ice','electric','gold','light'];
const LEVEL_UNLOCK_REQUIREMENTS: Array<{ level: number; star: 1|2|3; itemId: string }> = [
  { level: 1, star: 1, itemId: 'element:fire' },
  { level: 3, star: 3, itemId: 'fourLeafClover' },
  { level: 4, star: 3, itemId: 'rocket' },
  { level: 6, star: 3, itemId: 'element:wind' },
  { level: 11, star: 3, itemId: 'sunlightFlower' },
  { level: 15, star: 3, itemId: 'machineGun' },
  { level: 20, star: 3, itemId: 'element:ice' },
  { level: 23, star: 3, itemId: 'sniper' },
  { level: 27, star: 3, itemId: 'element:electric' },
  { level: 30, star: 3, itemId: 'element:gold' },
  { level: 33, star: 3, itemId: 'element:light' },
];
const PLANT_UNLOCK_TARGETS: Record<number, PlantType> = {
  4: 'rocket',
  11: 'sunlightFlower',
};
const STAR_LABELS: Record<1|2|3, string> = { 1: '一星', 2: '二星', 3: '三星' };
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
const RANDOM_MODE_PLANT_COUNT = { min: 3, max: 7 };
const RANDOM_MODE_ELEMENT_COUNT = { min: 3, max: 5 };
const RANDOM_MODE_LEVEL_RANGE = { min: 3, max: 10 };
const RANDOM_MODE_START_GOLD_RANGE = { min: 1000, max: 3000 };
const RANDOM_MODE_LIVES_RANGE = { min: 18, max: 30 };
const RANDOM_MODE_WAVE_COUNT = { min: 4, max: 10 };

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandomUnique = <T,>(source: readonly T[], count: number): T[] => {
  const pool = [...source];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
};
function getMapPathCount(map: MapSpec): number {
  const rawPath = map.path as MapSpec['path'];
  const first = (rawPath as any)[0];
  if (Array.isArray(first) && first.length > 0 && typeof first[0] === 'object' && first[0] !== null && 'x' in first[0]) {
    return (rawPath as any[]).length;
  }
  return 1;
}
function buildRandomModeWaves(map: MapSpec): WaveDef[] {
  const totalWaves = getRandomInt(RANDOM_MODE_WAVE_COUNT.min, RANDOM_MODE_WAVE_COUNT.max);
  const pathCount = Math.max(1, getMapPathCount(map));
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

type FunModeType = 'test' | 'endless' | 'random';
const FUN_MODE_LABELS: Record<FunModeType, string> = {
  test: '测试模式',
  endless: '无尽模式',
  random: '随机模式',
};

function createFunModeWave(waveNumber: number): WaveDef {
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

function buildInitialFunWaves(): WaveDef[] {
  return Array.from({ length: FUN_MODE_INITIAL_WAVES }, (_, idx) => createFunModeWave(idx + 1));
}
const MONSTER_LABELS: Record<keyof typeof MONSTER_BASE_STATS, string> = {
  circle: '圆怪',
  triangle: '三角怪',
  square: '方块怪',
  healer: '治疗者',
  evilSniper: '邪恶狙击手',
  rager: '狂暴者',
  summoner: '召唤者',
};

type Stage = 'auth' | 'hub' | 'select' | 'playing' | 'won' | 'lost' | 'book' | 'ranking' | 'fun';
type NonBookStage = Exclude<Stage, 'book' | 'ranking'>;
type PlantBookEntry = { type: PlantType; level: number; stats: NonNullable<ReturnType<typeof getPlantStatsForLevel>>; config: BasePlantConfig };
type ElementBookEntry = {
  id: ElementType;
  level: number;
  damageMultiplier: number;
  fireRateMultiplier: number | null;
  fireRatePenalty: number | null;
  breakArmor: { multiplier: number; duration: number } | null;
  burn: { dps: number; duration: number } | null;
  splash: { radius: number; percent: number } | null;
  slow: { pct: number; duration: number } | null;
  aura: { dps: number } | null;
  knockback: number | null;
  bounce: { maxBounces: number } | null;
  cfg: (typeof ELEMENT_PLANT_CONFIG)[ElementType];
};

function resolveShardLabel(key: string): string {
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

function resolveUnlockItemLabel(itemId: string): string {
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

const RainbowText = ({ text }: { text: string }) => {
  const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
  return (
    <p>
      {text.split('').map((char, index) => (
        <span key={index} style={{ color: colors[index % colors.length], fontWeight: 'bold' }}>
          {char}
        </span>
      ))}
    </p>
  );
};

function AuthBar({ onAuthed, variant = 'bar', onShowAbout, onNavigateBook, onNavigateRanking }: { onAuthed?: () => void; variant?: 'bar' | 'card', onShowAbout?: () => void; onNavigateBook?: () => void; onNavigateRanking?: () => void }) {
  const [username, setUsername] = useState<string>(() => getUsername() || '');
  const [password, setPassword] = useState<string>('');
  const [me, setMe] = useState<{ username?: string|null; coins?: number|null; magicKeys?: number|null }>({ username: getUsername(), coins: null, magicKeys: null });
  const authed = !!getToken();

  async function refresh() {
    try {
      const token = getToken();
      if (!token) return;
      const data = await fetchCloudProgress();
      setMe({ username: getUsername(), coins: data.coins, magicKeys: data.magicKeys });
    } catch {}
  }

  const handleRegister = async () => {
    try { await registerUser(username, password); setMe({ username, coins: null }); await refresh(); onAuthed && onAuthed(); }
    catch (e: any) { alert('注册失败：' + (e?.message || '网络或服务不可用')); }
  };
  const handleLogin = async () => {
    try { await loginUser(username, password); setMe({ username, coins: null }); await refresh(); onAuthed && onAuthed(); }
    catch (e: any) { alert('登录失败：' + (e?.message || '网络或服务不可用')); }
  };

  if (variant === 'card') {
    return (
      <div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="用户名" style={{ padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6 }} />
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="密码" type="password" style={{ padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:6 }} />
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <button onClick={handleRegister} className="btn-hover" style={{ flex:1, ...btnStyle() }}>注册</button>
            <button onClick={handleLogin} className="btn-hover" style={{ flex:1, ...btnStyle() }}>登录</button>
          </div>
          <div style={{ fontSize:12, color:'#9ca3af', marginTop:6 }}>ID: {getPlayerId()}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb' }}>
      <div style={{ maxWidth: 900, margin:'0 auto', padding:'8px 12px', display:'flex', alignItems:'center', gap:8 }}>
        {authed && me.username ? (
          <>
            <span style={{ fontSize:13, color:'#6b7280' }}>已登录：{me.username}</span>
            <span style={{ fontSize:13, color:'#6b7280' }}>金币：{me.coins ?? '-'}</span>
            <span style={{ fontSize:13, color:'#6b7280' }}>🔑：{me.magicKeys ?? 0}</span>
            <button onClick={refresh} className="btn-hover" style={{ marginLeft:8, padding:'4px 8px', borderRadius:6, border:'1px solid #d1d5db', background:'#fff' }}>刷新</button>
            {onNavigateBook && (
              <button onClick={onNavigateBook} className="btn-hover" style={{ marginLeft:8, padding:'4px 8px', borderRadius:6, border:'1px solid #d1d5db', background:'#fff' }}>图鉴</button>
            )}
            {onNavigateRanking && (
              <button onClick={onNavigateRanking} className="btn-hover" style={{ marginLeft:8, padding:'4px 8px', borderRadius:6, border:'1px solid #d1d5db', background:'#fff' }}>排行榜</button>
            )}
          </>
        ) : (
          <>
            <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="用户名" style={{ padding:'4px 8px', border:'1px solid #d1d5db', borderRadius:6 }} />
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="密码" type="password" style={{ padding:'4px 8px', border:'1px solid #d1d5db', borderRadius:6 }} />
            <button onClick={handleRegister} className="btn-hover" style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #d1d5db', background:'#fff' }}>注册</button>
            <button onClick={handleLogin} className="btn-hover" style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #d1d5db', background:'#fff' }}>登录</button>
          </>
        )}
        <div style={{ marginLeft:'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="https://github.com/6gdfg/towerdefence" target="_blank" rel="noopener noreferrer" title="GitHub" style={{ color: '#111827', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </a>
          <button onClick={onShowAbout} className="btn-hover" style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #d1d5db', background:'#fff' }}>关于</button>
          <div style={{ fontSize:12, color:'#9ca3af' }}>ID: {getPlayerId()}</div>
        </div>
      </div>
    </div>
  );
}

function RankingPage({ onBack }: { onBack: () => void }) {
  const [ranking, setRanking] = useState<Array<{ rank: number; username: string; clearedLevels: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRanking() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/ranking');
        if (!response.ok) {
          throw new Error('Failed to fetch ranking');
        }
        const data = await response.json();
        setRanking(data.ranking || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load ranking');
      } finally {
        setLoading(false);
      }
    }
    fetchRanking();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>通关排行榜</h2>
        <button onClick={onBack} className="btn-hover" style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>返回</button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>加载中...</div>
      )}

      {error && (
        <div style={{ padding: '20px', background: '#fee', border: '1px solid #fcc', borderRadius: 8, color: '#c33' }}>
          错误: {error}
        </div>
      )}

      {!loading && !error && ranking.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>暂无排行数据</div>
      )}

      {!loading && !error && ranking.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>排名</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>玩家</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: 14 }}>通关数</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((entry) => (
                <tr key={entry.username} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14 }}>
                    {entry.rank <= 3 ? (
                      <span style={{ fontWeight: 600, color: entry.rank === 1 ? '#f59e0b' : entry.rank === 2 ? '#94a3b8' : '#cd7f32' }}>
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'} {entry.rank}
                      </span>
                    ) : (
                      <span style={{ color: '#6b7280' }}>{entry.rank}</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{entry.username}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, textAlign: 'right', color: '#059669', fontWeight: 600 }}>{entry.clearedLevels}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [dataFinished, setDataFinished] = useState(false);
  const loadLevel = useTDStore(s => s.loadLevel);
  const wavesCleared = useTDStore(s => s.wavesCleared ?? 0);
  const [stage, setStage] = useState<Stage>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/book') {
        return getToken() ? 'book' : 'auth';
      }
      if (window.location.pathname === '/ranking') {
        return getToken() ? 'ranking' : 'auth';
      }
    }
    return getToken() ? 'hub' : 'auth';
  });
  const lastNonBookStageRef = useRef<NonBookStage>(
    (() => {
      const initial = typeof window !== 'undefined' && (window.location.pathname === '/book' || window.location.pathname === '/ranking')
        ? (getToken() ? 'hub' : 'auth')
        : stage;
      return (initial === 'book' || initial === 'ranking') ? (getToken() ? 'hub' : 'auth') : initial;
    })()
  );
  const navigateWithTransition = useCallback((targetStage: Stage) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStage(targetStage);
      // Keep transitioning for a bit longer to allow for fade-in of the new stage
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, 1000); // Shorten the transition screen time
  }, []);

  const goToBook = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/book') {
      window.history.pushState({}, '', '/book');
    }
    navigateWithTransition('book');
  }, [navigateWithTransition]);

  const goToRanking = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/ranking') {
      window.history.pushState({}, '', '/ranking');
    }
    navigateWithTransition('ranking');
  }, [navigateWithTransition]);

  const exitBook = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    const fallback = lastNonBookStageRef.current ?? (getToken() ? 'hub' : 'auth');
    navigateWithTransition(fallback);
  }, [navigateWithTransition]);

  useEffect(() => {
    if (stage !== 'book' && stage !== 'ranking') {
      lastNonBookStageRef.current = stage;
    }
  }, [stage]);

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      if (window.location.pathname === '/book') {
        setStage('book');
      } else if (window.location.pathname === '/ranking') {
        setStage('ranking');
      } else {
        const fallback = lastNonBookStageRef.current ?? (getToken() ? 'hub' : 'auth');
        setStage(fallback);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [levelIndex, setLevelIndex] = useState<number | null>(null);
  const [unlocked, setUnlockedState] = useState<number>(() => getUnlocked());
  const [showAbout, setShowAbout] = useState(false);
  const [activeFunMode, setActiveFunMode] = useState<FunModeType | null>(null);

  const [starSel, setStarSel] = useState<Record<number, 1|2|3>>({});
  const [currentStar, setCurrentStar] = useState<1|2|3>(1);

  type HubData = { coins: number; magicKeys: number; shards: Record<string, number>; towerLevels: Record<string, number>; chests: any[]; unlockedItems: string[] } | null;
  const [hub, setHub] = useState<HubData>(null);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [winReward, setWinReward] = useState<{ coins: number; chestType: string; message?: string } | null>(null);
  const unlockedItemsSet = useMemo(() => {
    const items = hub?.unlockedItems ?? getUnlockedItems();
    return new Set(items);
  }, [hub]);
  const plantBookData = useMemo<PlantBookEntry[]>(() => {
    return PLANT_TYPES
      .filter(type => unlockedItemsSet.has(type))
      .map<PlantBookEntry | null>(type => {
        const config = BASE_PLANTS_CONFIG[type];
        if (!config) return null;
        const level = hub?.towerLevels?.[type] ?? 1;
        const stats = getPlantStatsForLevel(type, level);
        if (!stats) return null;
        return { type, level, stats, config };
      })
      .filter((item): item is PlantBookEntry => item !== null);
  }, [hub, unlockedItemsSet]);

  const elementBookData = useMemo<ElementBookEntry[]>(() => {
    return ELEMENT_TYPES
      .filter(el => unlockedItemsSet.has(`element:${el}`))
      .map<ElementBookEntry>(el => {
        const cfg = ELEMENT_PLANT_CONFIG[el];
        const key = `element:${el}` as const;
        const level = hub?.towerLevels?.[key] ?? 1;
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
  }, [hub, unlockedItemsSet]);

  const monsterEntries = useMemo(() => Object.entries(MONSTER_BASE_STATS) as [keyof typeof MONSTER_BASE_STATS, typeof MONSTER_BASE_STATS[keyof typeof MONSTER_BASE_STATS]][], []);
  const funMap = useMemo(() => MAPS.find(m => m.id === SPIRAL_MAP_ID), []);
  useEffect(() => { const t = setInterval(()=>setNowTick(Date.now()), 1000); return ()=>clearInterval(t); }, []);
  const loadHub = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        return;
      }
      const d = await fetchCloudProgress();
      const unlockedItems = Array.isArray(d.unlockedItems) && d.unlockedItems.length > 0 ? d.unlockedItems : [...DEFAULT_UNLOCKED_ITEMS];
      setHub({ coins: d.coins ?? 0, magicKeys: d.magicKeys ?? 0, shards: d.shards ?? {}, towerLevels: d.towerLevels ?? {}, chests: d.chests ?? [], unlockedItems });
      // 刷新缓存
      await refreshCache();
      setHub(prev => prev ? { ...prev, unlockedItems: getUnlockedItems() } : prev);
      // 同步云端的 unlocked 状态
      if (typeof d.unlocked === 'number' && d.unlocked >= 1) {
        setUnlockedState(d.unlocked);
      } else {
        // 新用户确保至少解锁第一关
        setUnlockedState(1);
      }
    } catch (e) {
      console.error('Failed to load hub data', e);
    } finally {
      setDataFinished(true);
    }
  }, []);

  // 初始化缓存
  useEffect(() => {
    if (animationFinished && dataFinished) {
      setIsLoading(false);
    }
  }, [animationFinished, dataFinished]);

  useEffect(() => {
    const init = async () => {
      await initCache();
      await loadHub();
    };
    init();
  }, [loadHub]);

  useEffect(() => {
    if (stage === 'book' && !hub) {
      loadHub();
    }
  }, [stage, hub]);

  type ChestReward = { shards: Record<string, number>; coins: number; chestType: string } | null;
  const [chestReward, setChestReward] = useState<ChestReward>(null);
  const [openingChestId, setOpeningChestId] = useState<string | null>(null);

  async function startUnlock(chestId: string) {
    const token = getToken(); if (!token) return;
    await fetch('/api/chest', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ action:'startUnlock', chestId })});
    await loadHub();
  }
  async function openChest(chestId: string) {
    const token = getToken(); if (!token) return;
    if (openingChestId) return;
    setOpeningChestId(chestId);
    try {
      const resp = await fetch('/api/chest', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ action:'open', chestId })});
      if (resp.ok) {
        const data = await resp.json();
        setChestReward({ shards: data.shards || {}, coins: data.coins || 0, chestType: data.chestType || 'common' });
      }
    } catch (err) {
      console.error('openChest failed', err);
    } finally {
      await loadHub();
      setOpeningChestId(null);
    }
  }
  async function skipChest(chestId: string) {
    const token = getToken(); if (!token) return;
    await fetch('/api/chest', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ action:'skip', chestId })});
    await loadHub();
  }
  function upgradeCost(level:number){ return { frag: 5 + 3 * (Math.max(1, level)-1), coins: 100 * Math.max(1, level) }; }
  async function upgradeTower(towerType: string) {
    const token = getToken(); if (!token) return;
    await fetch('/api/upgrade', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ action:'upgrade', towerType })});
    await loadHub();
  }

  // 根据怪物等级和星级计算实际数值
  function scaleWaves(waves: import('./td/types').WaveDef[], star: 1|2|3): import('./td/types').WaveDef[] {
    return waves.map((w) => {
      return {
        groups: w.groups.map(g => {
          const baseStats = MONSTER_BASE_STATS[g.type];
          const finalLevel = g.level + DIFFICULTY_CONFIG.STAR_LEVEL_ADD[star];
          const mul = 1 + DIFFICULTY_CONFIG.LEVEL_MULTIPLIER * finalLevel;
          return {
            ...g,
            hp: Math.round(baseStats.hp * mul),
            speed: baseStats.speed,
            leakDamage: g.leakDamage ?? baseStats.leakDamage,
            level: finalLevel,
          };
        }),
      };
    });
  }



  const startLevel = (idx: number) => {
    setActiveFunMode(null);
    const L = LEVELS[idx];
    const M = MAPS.find(m => m.id === L.mapId);
    if (!M) { console.warn('Map not found for level', L.mapId); return; }
    const clearedMax = getMaxStarSync(L.id);
    const chosenStar = clearedMax > 0 ? ((starSel[idx] ?? 1) as 1|2|3) : 1;
    const wavesScaled = scaleWaves(L.waves, chosenStar);
    const plantGrid = getPlantGrid(M); // 获取可种植格子点
    const unlockedItems = getUnlockedItems();
    const allowedPlantsRaw = unlockedItems.filter((item): item is PlantType => Object.prototype.hasOwnProperty.call(BASE_PLANTS_CONFIG, item));
    const allowedPlants = Array.from(new Set(allowedPlantsRaw.length > 0 ? allowedPlantsRaw : [...DEFAULT_UNLOCKED_ITEMS])) as PlantType[];
    const allowedElements = Array.from(new Set(unlockedItems
      .filter(item => item.startsWith('element:'))
      .map(item => item.split(':')[1])
      .filter((el): el is ElementType => Object.prototype.hasOwnProperty.call(ELEMENT_PLANT_CONFIG, el)))) as ElementType[];
    loadLevel(
      { startGold: L.startGold, lives: L.lives, waves: wavesScaled },
      { path: M.path, size: M.size, roadWidthCells: M.roadWidthCells, plantGrid },
      {
        autoStartFirstWave: L.autoStartFirstWave,
        firstWaveDelaySec: L.firstWaveDelaySec,
        towerLevels: hub?.towerLevels as any,
        allowedPlants,
        allowedElements,
      }
    );

    setCurrentStar(chosenStar);
    setLevelIndex(idx);
    navigateWithTransition('playing');
  };

  const toNextLevel = () => {
    if (levelIndex==null) return;
    const next = levelIndex + 1;
    if (next < LEVELS.length) {
      startLevel(next);
    } else {
      // 全部通关，回到关卡选择
      navigateWithTransition('select');
      setLevelIndex(null);
    }
  };

  const restartLevel = () => {
    if (levelIndex==null) return;
    startLevel(levelIndex);
  };

  const startFunMode = useCallback((mode: FunModeType) => {
    const finalizeStart = () => {
      setActiveFunMode(mode);
      setWinReward(null);
      setCurrentStar(1);
      setLevelIndex(null);
      navigateWithTransition('playing');
    };

    if (mode === 'random') {
      if (MAPS.length === 0) {
        alert('No map available for random mode');
        return;
      }
      const randomMap = MAPS[Math.floor(Math.random() * MAPS.length)];
      if (!randomMap) {
        alert('Failed to pick a random map, please try again');
        return;
      }
      const plantGrid = getPlantGrid(randomMap);
      const allowedPlants = pickRandomUnique(
        PLANT_TYPES,
        getRandomInt(RANDOM_MODE_PLANT_COUNT.min, RANDOM_MODE_PLANT_COUNT.max),
      );
      const allowedElements = pickRandomUnique(
        ELEMENT_TYPES,
        getRandomInt(RANDOM_MODE_ELEMENT_COUNT.min, RANDOM_MODE_ELEMENT_COUNT.max),
      );
      const towerLevels: Record<string, number> = {};
      allowedPlants.forEach(plant => {
        towerLevels[plant] = getRandomInt(RANDOM_MODE_LEVEL_RANGE.min, RANDOM_MODE_LEVEL_RANGE.max);
      });
      allowedElements.forEach(element => {
        const key = `element:${element}`;
        towerLevels[key] = getRandomInt(RANDOM_MODE_LEVEL_RANGE.min, RANDOM_MODE_LEVEL_RANGE.max);
      });
      const startGold = getRandomInt(RANDOM_MODE_START_GOLD_RANGE.min, RANDOM_MODE_START_GOLD_RANGE.max);
      const lives = getRandomInt(RANDOM_MODE_LIVES_RANGE.min, RANDOM_MODE_LIVES_RANGE.max);
      const waves = buildRandomModeWaves(randomMap);
      loadLevel(
        { startGold, lives, waves },
        { path: randomMap.path, size: randomMap.size, roadWidthCells: randomMap.roadWidthCells, plantGrid },
        {
          autoStartFirstWave: false,
          towerLevels: towerLevels as any,
          allowedPlants,
          allowedElements,
          mode: 'random',
        },
      );
      finalizeStart();
      return;
    }

    if (!funMap) {
      alert('Fun mode map missing, cannot start');
      return;
    }

    const plantGrid = getPlantGrid(funMap);
    let allowedPlants: PlantType[] = [];
    let allowedElements: ElementType[] = [];
    let towerLevels: Record<string, number> = {};
    const startGold = mode === 'test' ? 6000 : 2000;

    if (mode === 'test') {
      allowedPlants = [...PLANT_TYPES];
      allowedElements = [...ELEMENT_TYPES];
      const configuredLevels: Record<string, number> = {};
      for (const plant of PLANT_TYPES) {
        const label = BASE_PLANTS_CONFIG[plant]?.name ?? plant;
        const defaultLv = hub?.towerLevels?.[plant] ?? 5;
        const input = window.prompt(`Set ${label} level (>=1)`, String(defaultLv));
        if (input === null) return;
        const parsed = Number(input);
        const level = Number.isFinite(parsed) ? Math.max(1, Math.min(99, Math.floor(parsed))) : defaultLv;
        configuredLevels[plant] = level;
      }
      for (const element of ELEMENT_TYPES) {
        const label = ELEMENT_PLANT_CONFIG[element]?.name ?? element;
        const key = `element:${element}`;
        const defaultLv = hub?.towerLevels?.[key] ?? 3;
        const input = window.prompt(`Set ${label} level (>=1)`, String(defaultLv));
        if (input === null) return;
        const parsed = Number(input);
        const level = Number.isFinite(parsed) ? Math.max(1, Math.min(99, Math.floor(parsed))) : defaultLv;
        configuredLevels[key] = level;
      }
      towerLevels = configuredLevels;
    } else {
      const unlockedItems = getUnlockedItems();
      const allowedPlantsRaw = unlockedItems.filter((item): item is PlantType =>
        Object.prototype.hasOwnProperty.call(BASE_PLANTS_CONFIG, item),
      );
      allowedPlants = Array.from(new Set(allowedPlantsRaw.length > 0 ? allowedPlantsRaw : [...DEFAULT_UNLOCKED_ITEMS])) as PlantType[];
      const allowedElementsRaw = unlockedItems
        .filter(item => item.startsWith('element:'))
        .map(item => item.split(':')[1])
        .filter((el): el is ElementType => Object.prototype.hasOwnProperty.call(ELEMENT_PLANT_CONFIG, el));
      allowedElements = Array.from(new Set(allowedElementsRaw)) as ElementType[];
      towerLevels = hub?.towerLevels ? { ...hub.towerLevels } : {};
    }

    const initialWaves = buildInitialFunWaves();
    loadLevel(
      { startGold, lives: 100, waves: initialWaves },
      { path: funMap.path, size: funMap.size, roadWidthCells: funMap.roadWidthCells, plantGrid },
      {
        autoStartFirstWave: false,
        towerLevels: towerLevels as any,
        allowedPlants,
        allowedElements,
        mode: mode === 'test' ? 'endlessTest' : 'endless',
        lifeBonusPerWave: 50,
        endlessWaveFactory: (waveNumber: number) => createFunModeWave(waveNumber),
      },
    );

    finalizeStart();
  }, [funMap, hub, loadLevel, navigateWithTransition, setCurrentStar, setLevelIndex, setWinReward]);

  const funModeLabel = activeFunMode ? FUN_MODE_LABELS[activeFunMode] : '';

  const handleAuth = useCallback(() => {
    setIsLoading(true);
    setAnimationFinished(false);
    setDataFinished(false);
    loadHub().then(() => {
      navigateWithTransition('hub');
    });
  }, [loadHub, navigateWithTransition]);

  if (isLoading) {
    return <LoadingScreen onAnimationComplete={() => setAnimationFinished(true)} />;
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', color:'#111827', fontFamily:'Arial, sans-serif' }}>
      {isTransitioning && <TransitionScreen onTransitionComplete={() => { /* Logic is now handled in navigateWithTransition */ }} />}
      <div key={stage} className={isTransitioning ? '' : 'stage-container-fade-in'}>
        {stage === 'auth' && (
          <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width: 400, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:20, boxShadow:'0 10px 30px rgba(0,0,0,0.08)' }}>
              <div style={{ fontWeight:700, marginBottom:16, fontSize:18 }}>登录 / 注册</div>
              <AuthBar variant="card" onAuthed={handleAuth} />
            </div>
          </div>
        )}

        {stage !== 'auth' && (
          <>
            {/* 简易登录/注册栏 - 游戏进行时不显示 */}
            {stage !== 'playing' && <AuthBar onShowAbout={() => setShowAbout(true)} onNavigateBook={stage === 'book' || stage === 'ranking' ? undefined : goToBook} onNavigateRanking={stage === 'ranking' || stage === 'book' ? undefined : goToRanking} />}
            {stage === 'hub' && (
              <div style={{ maxWidth: 900, margin:'0 auto', padding:24 }}>
                <div className="card-enter" style={{ opacity: 0, animationDelay: '0s', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <h2 style={{ fontSize:20, margin:0 }}>主界面</h2>
                <button onClick={() => { clearAuth(); navigateWithTransition('auth'); }} className="btn-hover" style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #dc2626', background:'#fff', color:'#dc2626' }}>退出账号</button>
              </div>
              <div className="card-enter" style={{ opacity: 0, animationDelay: '0.05s', display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ padding:'6px 10px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:8 }}>金币：{hub?.coins ?? '-'}</div>
                <div style={{ padding:'6px 10px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:8 }}>🔑神奇钥匙：{hub?.magicKeys ?? 0}</div>
                <button onClick={loadHub} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff' }}>刷新云端</button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {/* 升级面板 */}
                <div className="card-enter" style={{ opacity: 0, animationDelay: '0.1s', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
                  <div style={{ fontWeight:700, marginBottom:8 }}>植物升级</div>
                  {(() => {
                    const unlockedSet = new Set(hub?.unlockedItems ?? DEFAULT_UNLOCKED_ITEMS);
                    return (
                      <>
                        {PLANT_TYPES.map(t => {
                          const lv = hub?.towerLevels?.[t] ?? 1;
                          const shards = hub?.shards?.[t] ?? 0;
                          const cost = upgradeCost(lv);
                          const isUnlocked = unlockedSet.has(t);
                          const can = isUnlocked && (hub?.coins ?? 0) >= cost.coins && shards >= cost.frag;
                          const label = BASE_PLANTS_CONFIG[t]?.name ?? t;
                          return (
                            <div key={t} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderTop:'1px dashed #e5e7eb' }}>
                              <div>
                                <div style={{ fontSize:14 }}>{label}</div>
                                <div style={{ fontSize:12, color:'#6b7280' }}>
                                  {isUnlocked ? (
                                    <>lv.{lv} 碎片：{shards} / 需求 {cost.frag}；金币需求 {cost.coins}</>
                                  ) : (
                                    <span style={{ color:'#f97316' }}>未解锁</span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={()=>upgradeTower(t)}
                                disabled={!can}
                                style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background: can?'#fff':'#f3f4f6', color: can?'#111827':'#9ca3af' }}
                              >
                                升级
                              </button>
                            </div>
                          );
                        })}
                        <div style={{ fontSize:12, color:'#6b7280', marginTop:12 }}>元素增幅</div>
                        {ELEMENT_TYPES.map(el => {
                          const key = `element:${el}`;
                          const lv = hub?.towerLevels?.[key] ?? 1;
                          const shards = hub?.shards?.[key] ?? 0;
                          const cost = upgradeCost(lv);
                          const cfg = ELEMENT_PLANT_CONFIG[el];
                          const isUnlocked = unlockedSet.has(key);
                          const can = isUnlocked && (hub?.coins ?? 0) >= cost.coins && shards >= cost.frag;
                          return (
                            <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderTop:'1px dashed #e5e7eb' }}>
                              <div>
                                <div style={{ fontSize:14 }}>{cfg?.name ?? key}</div>
                                <div style={{ fontSize:12, color:'#6b7280' }}>
                                  {isUnlocked ? (
                                    <>lv.{lv} 碎片：{shards} / 需求 {cost.frag}；金币需求 {cost.coins}</>
                                  ) : (
                                    <span style={{ color:'#f97316' }}>未解锁</span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={()=>upgradeTower(key)}
                                disabled={!can}
                                style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${cfg?.color ?? '#d1d5db'}`, background: can?'#fff':'#f3f4f6', color: can?'#111827':'#9ca3af' }}
                              >
                                升级
                              </button>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>

                {/* 宝箱仓库 */}
                <div className="card-enter" style={{ opacity: 0, animationDelay: '0.15s', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
                  <div style={{ fontWeight:700, marginBottom:8 }}>宝箱仓库</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8 }}>
                    {(hub?.chests ?? []).map((c:any) => {
                      const status = c.status as string;
                      const isOpening = openingChestId === c.chest_id;
                      const disableOpen = openingChestId !== null;
                      let action = null as any;
                      if (status==='locked') action = <button onClick={()=>startUnlock(c.chest_id)} style={{ padding:'6px 8px', borderRadius:6, border:'1px solid #d1d5db', background:'#fff' }}>开始解锁</button>;
                      let extraAction = null as any;
                      if (status==='unlocking') {
                        const readyAt = c.unlock_ready_at ? new Date(c.unlock_ready_at).getTime() : 0;
                        const left = Math.max(0, Math.floor((readyAt - nowTick)/1000));
                        const minutes = Math.max(1, Math.ceil(left / 60));
                        const skipCost = minutes * 20;
                        if (left <= 0) {
                          action = (
                            <button
                              onClick={()=>openChest(c.chest_id)}
                              disabled={disableOpen}
                              style={{
                                padding:'6px 8px',
                                borderRadius:6,
                                border:'1px solid #d1d5db',
                                background: disableOpen ? '#f3f4f6' : '#fff',
                                color: disableOpen ? '#9ca3af' : '#111827',
                                cursor: disableOpen ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {isOpening ? '开启中…' : '开箱'}
                            </button>
                          );
                        } else {
                          const mm = Math.floor(left/60).toString().padStart(2,'0');
                          const ss = (left%60).toString().padStart(2,'0');
                          action = <div style={{ fontSize:12, color:'#6b7280' }}>解锁中 {mm}:{ss}</div>;
                          const canSkip = (hub?.coins ?? 0) >= skipCost;
                          extraAction = (
                            <button onClick={()=>skipChest(c.chest_id)} disabled={!canSkip} style={{ marginTop:6, padding:'4px 8px', borderRadius:6, border:'1px solid #f59e0b', background: canSkip ? '#fff7ed' : '#fef2f2', color: canSkip ? '#b45309' : '#9ca3af' }}>
                              金币跳过（{skipCost}）
                            </button>
                          );
                        }
                      }
                      if (status==='ready') action = (
                        <button
                          onClick={()=>openChest(c.chest_id)}
                          disabled={disableOpen}
                          style={{
                            padding:'6px 8px',
                            borderRadius:6,
                            border:'1px solid #d1d5db',
                            background: disableOpen ? '#f3f4f6' : '#fff',
                            color: disableOpen ? '#9ca3af' : '#111827',
                            cursor: disableOpen ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {isOpening ? '开启中…' : '开箱'}
                        </button>
                      );
                      if (status==='opened') action = <div style={{ fontSize:12, color:'#6b7280' }}>已打开</div>;
                      return (
                        <div key={c.chest_id} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10 }}>
                          <div style={{ fontWeight:600 }}>宝箱</div>
                          <div style={{ fontSize:12, color:'#6b7280' }}>状态：{status}</div>
                          <div style={{ marginTop:6, display:'flex', flexDirection:'column', gap:4 }}>
                            {action}
                            {extraAction}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 中间开始按钮 */}
              <div className="card-enter" style={{ opacity: 0, animationDelay: '0.2s', display:'flex', justifyContent:'center', gap:12, marginTop:20 }}>
                <button onClick={()=>{ setActiveFunMode(null); navigateWithTransition('select'); }} style={{ padding:'10px 16px', borderRadius:10, border:'1px solid #111827', background:'#fff', fontWeight:700 }}>开始游戏</button>
                <button onClick={()=>navigateWithTransition('fun')} style={{ padding:'10px 16px', borderRadius:10, border:'1px solid #0f172a', background:'#f8fafc', fontWeight:700 }}>趣味模式</button>
              </div>
            </div>
          )}

          {stage === 'fun' && (
            <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 20, margin: 0 }}>趣味模式</h2>
                <button onClick={() => { setActiveFunMode(null); navigateWithTransition('hub'); }} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>返回主界面</button>
              </div>
              <p style={{ fontSize: 14, color: '#475569', marginBottom: 16 }}>在究极回环地图上体验自由挑战：测试模式可自定义全部植物/元素等级，无尽模式沿用当前账号配置，新增的随机模式会把地图、金币、植物、元素与波次统统洗牌。</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18 }}>测试模式</h3>
                    <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>所有植物与元素全部解锁，开始前可逐一设定等级，适合验证数值与组合。</p>
                  </div>
                  <button onClick={() => startFunMode('test')} className="btn-hover" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 600 }}>配置并开始</button>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18 }}>无尽模式</h3>
                    <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>沿用当前账号的解锁与等级配置，逐波强化敌人，每 10 波迎战 Boss。</p>
                  </div>
                  <button onClick={() => startFunMode('endless')} className="btn-hover" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #0f172a', background: '#fff', color: '#0f172a', fontWeight: 600 }}>直接开始</button>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18 }}>随机模式</h3>
                    <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>地图从全部地图池抽取，初始金币 1000-3000 随机；随机获得 3-7 种植物与 3-5 种元素，并赋予 3-10 级等级，波数 4-10 波、怪物组合完全随机。</p>
                  </div>
                  <button onClick={() => startFunMode('random')} className="btn-hover" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 600 }}>立即开局</button>
                </div>
              </div>
            </div>
          )}

          {stage === 'select' && (
            <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <h2 style={{ fontSize: 20, margin:0 }}>选择关卡</h2>
                <button onClick={()=>navigateWithTransition('hub')} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff' }}>返回主界面</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {LEVELS.map((L, i) => {
                  const clearedMax = getMaxStarSync(L.id);
                  const allStars = getAllStars();
                  const hasStarRecord = L.id in allStars;
                  const isLocked = (i + 1 > unlocked) && !hasStarRecord;
                  const M = MAPS.find(m => m.id === L.mapId);
                  const selectedStar = (starSel[i] ?? 1) as 1|2|3;
                  const levelNumber = i + 1;
                  const unlockInfos = LEVEL_UNLOCK_REQUIREMENTS.filter(rule => rule.level === levelNumber);
                  return (
                    <div
                      key={L.id}
                      className="card-enter"
                      style={{
                        border:'1px solid #e5e7eb',
                        borderRadius:12,
                        padding:12,
                        background:'#fff',
                        boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
                        animationDelay: `${i * 0.05}s`,
                        opacity: 0,
                      }}
                    >
                      <div style={{ fontWeight:700, marginBottom:8 }}>{`第${i+1}关 ${L.name}`}</div>
                      <div style={{ display:'flex', gap:8, fontSize:12, color:'#6b7280' }}>
                        <span>地图: {M ? `#${M.id} ${M.name}` : `#${L.mapId}`}</span>
                        <span>起始金币: {L.startGold}</span>
                        <span>生命: {L.lives}</span>
                        <span>波数: {L.waves.length}</span>
                      </div>
                      {unlockInfos.length > 0 && (
                        <div style={{ marginTop:6, fontSize:12, color:'#f97316', display:'flex', flexDirection:'column', gap:2 }}>
                          {unlockInfos.map(info => {
                            const unlocked = unlockedItemsSet.has(info.itemId);
                            const itemLabel = resolveUnlockItemLabel(info.itemId);
                            const starLabel = STAR_LABELS[info.star];
                            return (
                              <span key={`${info.level}-${info.itemId}`}>
                                {starLabel}通关可解锁{itemLabel}{unlocked ? '（已获得）' : ''}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <div style={{ marginTop: 8, display:'flex', alignItems:'center', gap:6 }}>
                        {[1,2,3].map((s) => {
                          const disabled = isLocked || (clearedMax === 0 && s > 1);
                          const cleared = clearedMax >= (s as number);
                          const active = selectedStar === (s as 1|2|3);
                          return (
                            <button key={s}
                              onClick={() => setStarSel(prev => ({ ...prev, [i]: s as 1|2|3 }))}
                              disabled={disabled}
                              title={`选择${s}星`}
                              style={{
                                width: 30, height: 28, borderRadius: 6,
                                border: active ? '2px solid #111827' : '1px solid #d1d5db',
                                background: disabled ? '#f3f4f6' : '#fff',
                                color: cleared ? '#f59e0b' : '#9ca3af',
                                cursor: disabled ? 'not-allowed' : 'pointer'
                              }}>★</button>
                          );
                        })}
                        <span style={{ fontSize:12, color:'#6b7280' }}>星级</span>
                      </div>
                      <div style={{ display:'flex', gap:6, marginTop:10 }}>
                        <button onClick={() => startLevel(i)} disabled={isLocked} style={{ flex:1, padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:isLocked?'#f3f4f6':'#fff', color:isLocked?'#9ca3af':'#111827', cursor:isLocked?'not-allowed':'pointer' }}>
                          {isLocked ? '未解锁' : `开始（★${selectedStar}）` }
                        </button>
                        {isLocked && (hub?.magicKeys ?? 0) > 0 && (
                          <button onClick={async () => {
                            const token = getToken();
                            if (!token) return;
                            if (!confirm(`使用1把神奇钥匙解锁${L.name}？`)) return;
                            try {
                              const resp = await fetch('/api/progress', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ action: 'unlockWithKey', levelId: L.id })
                              });
                              if (resp.ok) {
                                await loadHub();
                                alert('解锁成功！');
                              } else {
                                const err = await resp.json();
                                alert('解锁失败：' + (err.error || '未知错误'));
                              }
                            } catch (e: any) {
                              alert('解锁失败：' + (e?.message || '网络错误'));
                            }
                          }} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #f59e0b', background:'#fff', color:'#f59e0b', cursor:'pointer', whiteSpace:'nowrap' }}>
                            🔑解锁
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stage === 'book' && (
            <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 20, margin: 0 }}>图鉴</h2>
                <button onClick={exitBook} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>返回</button>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, margin: '12px 0 8px 0' }}>已解锁植物</h3>
                {plantBookData.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>暂无解锁植物。</div>
                ) : (
                  <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                    {plantBookData.map((entry, i) => (
                      <div
                        key={entry.type}
                        className="card-enter"
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 12,
                          padding: 12,
                          background: '#fff',
                          animationDelay: `${i * 0.05}s`,
                          opacity: 0,
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{entry.config.name}（lv.{entry.level}）</div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>
                          射程 {entry.stats.range} ｜ 伤害 {entry.stats.damage} ｜ 攻速 {entry.stats.fireRate > 0 ? entry.stats.fireRate : '0（手动）'} ｜ 子弹速度 {entry.stats.projectileSpeed}
                        </div>
                        {entry.stats.pierceLimit ? (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                            穿透上限 {entry.stats.pierceLimit}
                            {entry.stats.damageDecayFactor ? `，每次伤害×${entry.stats.damageDecayFactor}` : ''}
                          </div>
                        ) : null}
                        {entry.stats.activeAbilityCost ? (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                            主动消耗 {entry.stats.activeAbilityCost} 金币发动攻击
                          </div>
                        ) : null}
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{entry.config.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, margin: '12px 0 8px 0' }}>已解锁元素</h3>
                {elementBookData.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>暂无解锁元素。</div>
                ) : (
                  <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                    {elementBookData.map((entry, i) => (
                      <div
                        key={entry.id}
                        className="card-enter"
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 12,
                          padding: 12,
                          background: '#fff',
                          animationDelay: `${i * 0.05}s`,
                          opacity: 0,
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{entry.cfg.name}（lv.{entry.level}）</div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>费用 {entry.cfg.cost} ｜ 伤害倍率 ×{entry.damageMultiplier}</div>
                        {entry.fireRateMultiplier !== null && (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>攻速倍率 ×{entry.fireRateMultiplier}</div>
                        )}
                        {entry.fireRatePenalty !== null && (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>攻速惩罚 -{entry.fireRatePenalty}</div>
                        )}
                        {entry.breakArmor && (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>破甲倍率 ×{entry.breakArmor.multiplier}（{entry.breakArmor.duration}s）</div>
                        )}
                        {entry.burn && (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>灼烧 {entry.burn.dps}/s（{entry.burn.duration}s）</div>
                        )}
                        {entry.splash && (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>溅射 {entry.splash.percent}% ｜ 半径 {entry.splash.radius}</div>
                        )}
                        {entry.slow && (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>减速 {entry.slow.pct}%（{entry.slow.duration}s）</div>
                        )}
                        {entry.knockback && (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>击退 {entry.knockback}</div>
                        )}
                        {entry.aura && (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>光环伤害 {entry.aura.dps}/s</div>
                        )}
                        {entry.bounce && (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>反弹上限 {entry.bounce.maxBounces}</div>
                        )}
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{entry.cfg.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: 16, margin: '12px 0 8px 0' }}>怪物图鉴</h3>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                  {monsterEntries.map(([id, stats], i) => (
                    <div
                      key={id}
                      className="card-enter"
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 12,
                        padding: 12,
                        background: '#fff',
                        animationDelay: `${i * 0.05}s`,
                        opacity: 0,
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{MONSTER_LABELS[id]}（{id}）</div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>基础生命 {stats.hp} ｜ 基础速度 {stats.speed.toFixed(2)} ｜ 泄漏伤害 {stats.leakDamage}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>实际数值会随关卡等级提升。</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stage === 'ranking' && (
            <RankingPage onBack={() => {
              if (typeof window !== 'undefined' && window.location.pathname !== '/') {
                window.history.pushState({}, '', '/');
              }
              navigateWithTransition('hub');
            }} />
          )}

          {stage === 'playing' && (
            <TDGame
              onWin={async () => {
                if (levelIndex != null) {
                  const L = LEVELS[levelIndex];
                  const result = await setStarCleared(L.id, currentStar);
                  const serverUnlocks = Array.isArray(result?.newUnlocks) ? (result.newUnlocks as string[]) : [];
                  const levelNumber = (levelIndex ?? 0) + 1;
                  const unlockTarget = PLANT_UNLOCK_TARGETS[levelNumber];
                  const bestStar = Math.max(result?.star ?? 0, currentStar);
                  const extraUnlocks: string[] = [];
                  if (unlockTarget && bestStar >= 3 && !unlockedItemsSet.has(unlockTarget)) {
                    extraUnlocks.push(unlockTarget);
                  }
                  if (extraUnlocks.length > 0) {
                    updateUnlockedItems(extraUnlocks);
                  }
                  const totalUnlocks = Array.from(new Set([...serverUnlocks, ...extraUnlocks]));
                  if (totalUnlocks.length > 0) {
                    setHub(prev => {
                      const base = prev ?? { coins: 0, magicKeys: 0, shards: {}, towerLevels: {}, chests: [], unlockedItems: [...DEFAULT_UNLOCKED_ITEMS] };
                      const merged = new Set(base.unlockedItems ?? DEFAULT_UNLOCKED_ITEMS);
                      totalUnlocks.forEach((item: string) => merged.add(item));
                      return { ...base, unlockedItems: Array.from(merged) };
                    });
                  }
                  if (result && result.rewardCoins > 0) {
                    const rewardMsg = result.newRecord
                      ? `🎉 新纪录！获得 ${result.rewardCoins} 金币和${result.chestType === 'common' ? '普通' : result.chestType === 'rare' ? '稀有' : '史诗'}宝箱`
                      : `✨ 重复通关！获得 ${result.rewardCoins} 金币和${result.chestType === 'common' ? '普通' : result.chestType === 'rare' ? '稀有' : '史诗'}宝箱`;
                    setWinReward({
                      coins: result.rewardCoins,
                      chestType: result.chestType || 'common',
                      message: rewardMsg
                    });
                  }
                  const prevUnlocked = getUnlocked();
                  const nextUnlock = Math.min(LEVELS.length, levelIndex + 2);
                  // 只有当玩家通关的关卡是当前解锁的最高关卡时，才解锁下一关
                  if (levelIndex != null && levelIndex + 1 === prevUnlocked) {
                    setUnlockedPersist(nextUnlock);
                    setUnlockedState(nextUnlock);
                  }
                  // 刷新数据以更新星级显示
                  await loadHub();
                  // 强制更新解锁状态（确保UI刷新）
                  setUnlockedState(getUnlocked());
                }
                setStage('won');
              }}
              onLose={() => setStage('lost')}
            />
          )}

          {(stage === 'won' || stage === 'lost') && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}>
              <div style={{ width: 360, borderRadius: 12, background:'#ffffff', border:'1px solid #e5e7eb', padding:16, boxShadow:'0 10px 30px rgba(0,0,0,0.15)' }}>
                <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>
                  {stage === 'won' ? '关卡完成 🎉' : (activeFunMode ? `挑战结束 · ${funModeLabel}` : '挑战失败 💥')}
                </div>
                <div style={{ color:'#6b7280', fontSize:13, marginBottom:10 }}>
                  {stage === 'won'
                    ? (levelIndex != null ? `第${levelIndex + 1}关 ${LEVELS[levelIndex].name}` : activeFunMode ? `趣味模式 · ${funModeLabel}` : '')
                    : (activeFunMode ? `趣味模式 · ${funModeLabel}` : levelIndex != null ? `第${levelIndex + 1}关 ${LEVELS[levelIndex].name}` : '')}
                </div>
                {stage === 'lost' && activeFunMode && (
                  <div style={{ color:'#475569', fontSize:13, marginBottom:10 }}>本轮击退波数：{wavesCleared}</div>
                )}
                {stage === 'won' && winReward && winReward.coins > 0 && (
                  <div style={{ background:'#f9fafb', borderRadius:8, padding:12, marginBottom:12 }}>
                    <div style={{ fontWeight:600, marginBottom:6, color:'#059669' }}>🎁 通关奖励</div>
                    {winReward.message && (
                      <div style={{ fontSize:14, color:'#6b7280', marginBottom:6 }}>{winReward.message}</div>
                    )}
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                      <span>金币</span>
                      <span style={{ fontWeight:600, color:'#f59e0b' }}>+{winReward.coins}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginTop:4 }}>
                      <span>宝箱</span>
                      <span style={{ fontWeight:600, color:'#8b5cf6' }}>
                        {winReward.chestType === 'common' && '普通宝箱'}
                        {winReward.chestType === 'rare' && '稀有宝箱'}
                        {winReward.chestType === 'epic' && '史诗宝箱'}
                      </span>
                    </div>
                  </div>
                )}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {stage === 'won' ? (
                    <>
                      {levelIndex != null && currentStar < 3 && (
                        <button onClick={() => { if (levelIndex != null) { const nextStar = (Math.min(3, (currentStar + 1)) as 1|2|3); setStarSel(prev => ({ ...prev, [levelIndex]: nextStar })); setWinReward(null); startLevel(levelIndex); } }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }}>挑战更高星级</button>
                      )}
                      <button onClick={() => { setWinReward(null); toNextLevel(); }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }}>下一关</button>
                      <button onClick={() => { setWinReward(null); restartLevel(); }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }}>重玩</button>
                      <button onClick={() => { setWinReward(null); navigateWithTransition('select'); setLevelIndex(null); }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }}>返回关卡</button>
                      <button onClick={() => { setWinReward(null); navigateWithTransition('hub'); setLevelIndex(null); }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }}>返回主界面</button>
                    </>
                  ) : activeFunMode ? (
                    <>
                      <button onClick={() => { setWinReward(null); startFunMode(activeFunMode); }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #0f172a', background:'#0f172a', color:'#fff', cursor:'pointer' }}>重新开始{funModeLabel}</button>
                      <button onClick={() => { setWinReward(null); navigateWithTransition('fun'); }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }}>返回趣味模式</button>
                      <button onClick={() => { setWinReward(null); setActiveFunMode(null); navigateWithTransition('hub'); setLevelIndex(null); }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }}>返回主界面</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setWinReward(null); restartLevel(); }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }}>重玩</button>
                      <button onClick={() => { setWinReward(null); navigateWithTransition('select'); setLevelIndex(null); }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }}>返回关卡</button>
                      <button onClick={() => { setWinReward(null); navigateWithTransition('hub'); setLevelIndex(null); }} className="btn-hover" style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }}>返回主界面</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 开箱奖励弹窗 */}
          {chestReward && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
              <div style={{ width: 400, borderRadius: 12, background:'#ffffff', border:'1px solid #e5e7eb', padding:20, boxShadow:'0 10px 30px rgba(0,0,0,0.15)' }}>
                <div style={{ fontWeight:700, fontSize:20, marginBottom:12, textAlign:'center' }}>🎁 宝箱开启成功！</div>
                <div style={{ fontSize:14, color:'#6b7280', marginBottom:16, textAlign:'center' }}>
                  {chestReward.chestType === 'common' && '普通宝箱'}
                  {chestReward.chestType === 'rare' && '稀有宝箱'}
                  {chestReward.chestType === 'epic' && '史诗宝箱'}
                </div>
                <div style={{ background:'#f9fafb', borderRadius:8, padding:12, marginBottom:16 }}>
                  <div style={{ fontWeight:600, marginBottom:8 }}>获得碎片：</div>
                  {Object.entries(chestReward.shards).map(([tower, count]) => {
                    const plantLabel = resolveShardLabel(tower);
                    return (
                      <div key={tower} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:14 }}>
                        <span>{plantLabel}</span>
                        <span style={{ fontWeight:600, color:'#10b981' }}>+{count}</span>
                      </div>
                    );
                  })}
                  {chestReward.coins > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:14, borderTop:'1px dashed #e5e7eb', marginTop:8, paddingTop:8 }}>
                      <span>金币</span>
                      <span style={{ fontWeight:600, color:'#f59e0b' }}>+{chestReward.coins}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setChestReward(null)} style={{ width:'100%', padding:'10px', borderRadius:8, border:'1px solid #111827', background:'#fff', fontWeight:600, cursor:'pointer' }}>确定</button>
              </div>
            </div>
          )}
        </>
      )}
      </div>

      {showAbout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2>关于</h2>
            <RainbowText text="Tower Defence Version 0.0.5" />
            <h2>鸣谢</h2>
            <p>总策划:hebscyf</p>
            <p>代码:6gdfg</p>
            <p>测试员&贡献者:hebscyf,windymu,mountain,even zao</p>
            <button onClick={() => setShowAbout(false)} className="btn-hover" style={{ alignSelf: 'flex-end', padding:'6px 12px', borderRadius:8, border:'1px solid #d1d5db', background:'#ffffff', color:'#111827', cursor:'pointer' }}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
