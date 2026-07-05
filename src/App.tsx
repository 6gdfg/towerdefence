import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import TDGame from './td/TDGame';
import LoadingScreen from './td/LoadingScreen';
import TransitionScreen from './td/TransitionScreen';
import AboutModal from './td/AboutModal';
import AuthBar from './td/AuthBar';
import AuthPage from './td/AuthPage';
import RankingPage from './td/RankingPage';
import BookPage from './td/BookPage';
import ChestRewardModal from './td/ChestRewardModal';
import FunModePage from './td/FunModePage';
import HubPage from './td/HubPage';
import LevelSelectPage from './td/LevelSelectPage';
import ResultModal from './td/ResultModal';
import { useTDStore } from './td/store';
import { LEVELS, DIFFICULTY_CONFIG, MONSTER_BASE_STATS } from './td/levels';
import { MAPS, getPlantGrid, SPIRAL_MAP_ID } from './td/maps';
import { fetchCloudProgress, getToken, clearAuth } from './td/authProgress';
import { getUnlocked, setUnlocked as setUnlockedPersist, setStarCleared, refreshCache, initCache, getUnlockedItems, updateUnlockedItems } from './td/progress';
import { BASE_PLANTS_CONFIG, ELEMENT_PLANT_CONFIG } from './td/plants';
import { ElementType, PlantType, TowerLevelMap } from './td/types';
import { openChestReward, skipChestUnlock, startChestUnlock, unlockLevelWithKey, upgradeCloudTower } from './td/cloudApi';
import { ELEMENT_TYPES, PLANT_TYPES, PLANT_UNLOCK_TARGETS } from './td/appConfig';
import { buildInitialFunWaves, buildRandomModeWaves, createFunModeWave, FUN_MODE_LABELS, getRandomInt, pickRandomUnique, RANDOM_MODE_ELEMENT_COUNT, RANDOM_MODE_LEVEL_RANGE, RANDOM_MODE_LIVES_RANGE, RANDOM_MODE_PLANT_COUNT, RANDOM_MODE_START_GOLD_RANGE, type FunModeType } from './td/funModes';
import type { ChestReward, HubData, WinReward } from './td/appTypes';
import { buildElementBookData, buildPlantBookData } from './td/bookData';
import { getErrorMessage } from './td/errors';
import { resolveChestTypeName } from './td/labels';
import { DEFAULT_UNLOCKED_ITEMS } from '../shared/unlocks';
type Stage = 'auth' | 'hub' | 'select' | 'playing' | 'won' | 'lost' | 'book' | 'ranking' | 'fun';
type NonBookStage = Exclude<Stage, 'book' | 'ranking'>;

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

  const [hub, setHub] = useState<HubData | null>(null);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [winReward, setWinReward] = useState<WinReward | null>(null);
  const unlockedItemsSet = useMemo(() => {
    const items = hub?.unlockedItems ?? getUnlockedItems();
    return new Set(items);
  }, [hub]);
  const plantBookData = useMemo(
    () => buildPlantBookData(unlockedItemsSet, hub?.towerLevels),
    [hub?.towerLevels, unlockedItemsSet],
  );

  const elementBookData = useMemo(
    () => buildElementBookData(unlockedItemsSet, hub?.towerLevels),
    [hub?.towerLevels, unlockedItemsSet],
  );

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
      setHub({
        coins: d.coins ?? 0,
        magicKeys: d.magicKeys ?? 0,
        shards: d.shards ?? {},
        plantShards: d.plantShards ?? {},
        elementShards: d.elementShards ?? {},
        towerLevels: d.towerLevels ?? {},
        chests: d.chests ?? [],
        unlockedItems,
      });
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

  const [chestReward, setChestReward] = useState<ChestReward | null>(null);
  const [openingChestId, setOpeningChestId] = useState<string | null>(null);

  async function startUnlock(chestId: string) {
    await startChestUnlock(chestId);
    await loadHub();
  }
  async function openChest(chestId: string) {
    if (openingChestId) return;
    setOpeningChestId(chestId);
    try {
      const data = await openChestReward(chestId);
      if (data) {
        setChestReward({
          shards: data.shards || {},
          plantShards: data.plantShards || {},
          elementShards: data.elementShards || {},
          coins: data.coins || 0,
          magicKeys: data.magicKeys || 0,
          chestType: data.chestType || 'common',
        });
      }
    } catch (err) {
      console.error('openChest failed', err);
    } finally {
      await loadHub();
      setOpeningChestId(null);
    }
  }
  async function skipChest(chestId: string) {
    await skipChestUnlock(chestId);
    await loadHub();
  }
  async function upgradeTower(towerType: string) {
    await upgradeCloudTower(towerType);
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



  const startLevel = (idx: number, starOverride?: 1 | 2 | 3) => {
    setActiveFunMode(null);
    const L = LEVELS[idx];
    const M = MAPS.find(m => m.id === L.mapId);
    if (!M) { console.warn('Map not found for level', L.mapId); return; }
    const chosenStar = starOverride ?? ((starSel[idx] ?? 1) as 1|2|3);
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
        towerLevels: hub?.towerLevels,
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
      const towerLevels: TowerLevelMap = {};
      allowedPlants.forEach(plant => {
        towerLevels[plant] = getRandomInt(RANDOM_MODE_LEVEL_RANGE.min, RANDOM_MODE_LEVEL_RANGE.max);
      });
      allowedElements.forEach(element => {
        const key = `element:${element}` as const;
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
          towerLevels,
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
    let towerLevels: TowerLevelMap = {};
    const startGold = mode === 'test' ? 6000 : 2000;

    if (mode === 'test') {
      allowedPlants = [...PLANT_TYPES];
      allowedElements = [...ELEMENT_TYPES];
      const configuredLevels: TowerLevelMap = {};
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
        const key = `element:${element}` as const;
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
        towerLevels,
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

  const handleGameWin = useCallback(async () => {
    if (levelIndex != null) {
      const L = LEVELS[levelIndex];
      const result = await setStarCleared(L.id, currentStar);
      const serverUnlocks = Array.isArray(result?.newUnlocks) ? (result.newUnlocks as string[]) : [];
      const levelNumber = levelIndex + 1;
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
          const base = prev ?? { coins: 0, magicKeys: 0, shards: {}, plantShards: {}, elementShards: {}, towerLevels: {}, chests: [], unlockedItems: [...DEFAULT_UNLOCKED_ITEMS] };
          const merged = new Set(base.unlockedItems ?? DEFAULT_UNLOCKED_ITEMS);
          totalUnlocks.forEach((item: string) => merged.add(item));
          return { ...base, unlockedItems: Array.from(merged) };
        });
      }
      if (result && result.rewardCoins > 0) {
        const chestTypeName = resolveChestTypeName(result.chestType || 'common');
        const rewardMsg = result.newRecord
          ? `🎉 新纪录！获得 ${result.rewardCoins} 金币和${chestTypeName}宝箱`
          : `✨ 重复通关！获得 ${result.rewardCoins} 金币和${chestTypeName}宝箱`;
        setWinReward({
          coins: result.rewardCoins,
          chestType: result.chestType || 'common',
          chestCoins: result.chestCoinReward || 0,
          message: rewardMsg,
        });
      }
      const prevUnlocked = getUnlocked();
      const nextUnlock = Math.min(LEVELS.length, levelIndex + 2);
      // 只有当玩家通关的关卡是当前解锁的最高关卡时，才解锁下一关
      if (levelIndex + 1 === prevUnlocked) {
        setUnlockedPersist(nextUnlock);
        setUnlockedState(nextUnlock);
      }
      await loadHub();
      setUnlockedState(getUnlocked());
    }
    setStage('won');
  }, [currentStar, levelIndex, loadHub, unlockedItemsSet]);

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
    <div className="app-shell">
      {isTransitioning && <TransitionScreen onTransitionComplete={() => { /* Logic is now handled in navigateWithTransition */ }} />}
      <div key={stage} className={isTransitioning ? '' : 'stage-container-fade-in'}>
        {stage === 'auth' && <AuthPage onAuthed={handleAuth} />}

        {stage !== 'auth' && (
          <>
            {/* 简易登录/注册栏 - 游戏进行时不显示 */}
            {stage !== 'playing' && (
              <AuthBar
                onShowAbout={() => setShowAbout(true)}
                onNavigateBook={stage === 'book' || stage === 'ranking' ? undefined : goToBook}
                onNavigateRanking={stage === 'ranking' || stage === 'book' ? undefined : goToRanking}
              />
            )}
            {stage === 'hub' && (
              <HubPage
                hub={hub}
                nowTick={nowTick}
                openingChestId={openingChestId}
                onLogout={() => { clearAuth(); navigateWithTransition('auth'); }}
                onRefresh={loadHub}
                onUpgradeTower={upgradeTower}
                onStartUnlock={startUnlock}
                onOpenChest={openChest}
                onSkipChest={skipChest}
                onStartGame={() => { setActiveFunMode(null); navigateWithTransition('select'); }}
                onOpenFunMode={() => navigateWithTransition('fun')}
              />
            )}

            {stage === 'fun' && (
              <FunModePage
                onBack={() => { setActiveFunMode(null); navigateWithTransition('hub'); }}
                onStartMode={startFunMode}
              />
            )}

            {stage === 'select' && (
              <LevelSelectPage
                unlocked={unlocked}
                magicKeys={hub?.magicKeys ?? 0}
                starSel={starSel}
                unlockedItemsSet={unlockedItemsSet}
                onBack={() => navigateWithTransition('hub')}
                onSelectStar={(levelIdx, star) => setStarSel(prev => ({ ...prev, [levelIdx]: star }))}
                onStartLevel={startLevel}
                onUnlockLevel={async (levelId, levelName) => {
                  if (!confirm(`使用1把神奇钥匙解锁${levelName}？`)) return;
                  try {
                    await unlockLevelWithKey(levelId);
                    await loadHub();
                    alert('解锁成功！');
                  } catch (e: unknown) {
                    alert('解锁失败：' + getErrorMessage(e, '网络错误'));
                  }
                }}
              />
            )}

            {stage === 'book' && (
              <BookPage
                onBack={exitBook}
                plantBookData={plantBookData}
                elementBookData={elementBookData}
                monsterEntries={monsterEntries}
              />
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
                onWin={handleGameWin}
                onLose={() => setStage('lost')}
              />
            )}

          {(stage === 'won' || stage === 'lost') && (
            <ResultModal
              result={stage}
              activeFunMode={activeFunMode}
              funModeLabel={funModeLabel}
              levelIndex={levelIndex}
              currentStar={currentStar}
              wavesCleared={wavesCleared}
              winReward={winReward}
              onChallengeHigherStar={() => {
                if (levelIndex != null) {
                  const nextStar = Math.min(3, currentStar + 1) as 1|2|3;
                  setStarSel(prev => ({ ...prev, [levelIndex]: nextStar }));
                  setWinReward(null);
                  startLevel(levelIndex, nextStar);
                }
              }}
              onNextLevel={() => { setWinReward(null); toNextLevel(); }}
              onRestartLevel={() => { setWinReward(null); restartLevel(); }}
              onBackToSelect={() => { setWinReward(null); navigateWithTransition('select'); setLevelIndex(null); }}
              onBackToHub={() => { setWinReward(null); setActiveFunMode(null); navigateWithTransition('hub'); setLevelIndex(null); }}
              onRestartFunMode={() => { if (activeFunMode) { setWinReward(null); startFunMode(activeFunMode); } }}
              onBackToFunMode={() => { setWinReward(null); navigateWithTransition('fun'); }}
            />
          )}

          {chestReward && (
            <ChestRewardModal reward={chestReward} onClose={() => setChestReward(null)} />
          )}
        </>
      )}
      </div>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

export default App;
