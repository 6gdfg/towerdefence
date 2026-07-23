import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import TDGame from './td/TDGame';
import LoadingScreen from './td/LoadingScreen';
import AboutModal from './td/AboutModal';
import AuthBar from './td/AuthBar';
import AuthPage from './td/AuthPage';
import RankingPage from './td/RankingPage';
import BookPage from './td/BookPage';
import ChestRewardModal from './td/ChestRewardModal';
import BalanceLabPage, { type BalanceLabConfig } from './td/BalanceLabPage';
import ChapterSelectPage from './td/ChapterSelectPage';
import CardSelectPage from './td/CardSelectPage';
import type { ChallengeId } from './td/ChallengeSelectPage';
import FunModePage from './td/FunModePage';
import HubPage from './td/HubPage';
import LevelSelectPage from './td/LevelSelectPage';
import ResultModal from './td/ResultModal';
import LevelStartModal from './td/LevelStartModal';
import ChallengeConfigModal from './td/ChallengeConfigModal';
import UpdateAnnouncementModal from './td/UpdateAnnouncementModal';
import { useTDStore } from './td/store';
import { getLevelSpecForDifficulty, hasLevelDifficultyDraft, INTRODUCTION_LEVEL, LEVELS, MONSTER_BASE_STATS } from './td/levels';
import { MAPS, getPlantGrid, SPIRAL_MAP_ID } from './td/maps';
import { fetchCloudProgress, getToken, clearAuth, markTutorialSeen, shouldShowTutorial } from './td/authProgress';
import { getUnlocked, setUnlocked as setUnlockedPersist, setStarCleared, refreshCache, initCache, getUnlockedItems } from './td/progress';
import { BASE_PLANTS_CONFIG, ELEMENT_PLANT_CONFIG } from './td/plants';
import { AtModeConfig, ElementType, PlantType, ShapeType, TowerLevelMap, WaveDef } from './td/types';
import { getAtBaseModeType } from './td/atMode';
import { acknowledgeReleaseAnnouncement, craftLegendaryChest, hasReadReleaseAnnouncement, openChestReward, skipChestUnlock, startChestUnlock, unlockLevelWithKey, upgradeCloudTower } from './td/cloudApi';
import { ELEMENT_TYPES, PLANT_TYPES } from './td/appConfig';
import { buildInitialFunWaves, buildRandomModeWaves, createFunModeWave, FUN_MODE_LABELS, getRandomInt, pickRandomUnique, RANDOM_MODE_ELEMENT_COUNT, RANDOM_MODE_LEVEL_RANGE, RANDOM_MODE_LIVES_RANGE, RANDOM_MODE_PLANT_COUNT, RANDOM_MODE_START_GOLD_RANGE, type FunModeType } from './td/funModes';
import type { ChestReward, HubData, WinReward } from './td/appTypes';
import { buildElementBookData, buildPlantBookData } from './td/bookData';
import { getErrorMessage } from './td/errors';
import { resolveChestTypeName } from './td/labels';
import { DEFAULT_UNLOCKED_ITEMS } from '../shared/unlocks';
import { CURRENT_RELEASE } from '../shared/releaseNotes';
import { getChapterForLevelIndex } from './td/chapters';
import { getLevelDifficultyRatings, type DifficultyCode } from './td/levelRatings';
import { getPlayableDifficulty } from './td/levelUnlockLogic';
import StudyPage from './study/StudyPage';
import TasksPage from './tasks/TasksPage';
import GardenPage from './garden/GardenPage';
import AdminPage from './td/AdminPage';
type Stage = 'auth' | 'tutorial' | 'hub' | 'chapters' | 'select' | 'cardSelect' | 'playing' | 'won' | 'lost' | 'book' | 'ranking' | 'fun' | 'lab';
type NonBookStage = Exclude<Stage, 'book' | 'ranking'>;
type PageTransitionState = 'idle' | 'leaving' | 'entering';
const DIFFICULTY_BY_STAR = { 1: 'EZ', 2: 'HD', 3: 'IN' } as const;
const STAR_BY_DIFFICULTY: Record<DifficultyCode, 1 | 2 | 3> = { EZ: 1, HD: 2, IN: 3, AT: 3 };

type PendingCardSelect = {
  title: string;
  plantOptions: PlantType[];
  elementOptions: ElementType[];
  maxPlants: number;
  maxElements: number;
  towerLevels: TowerLevelMap;
  returnStage: Stage;
  onConfirm: (plants: PlantType[], elements: ElementType[]) => void;
};

type PendingLevelStart = {
  levelIndex: number;
  difficulty: DifficultyCode;
  challenges: ChallengeId[];
};

type AtUnlockNotice = {
  levelName: string;
};

type ActiveChallengeRun = {
  selected: ChallengeId[];
  startLives: number;
};

function cloneWavesWithMonsterLevel(waves: WaveDef[], level: number): WaveDef[] {
  const fixedLevel = Math.max(1, Math.floor(level || 1));
  return waves.map(wave => ({
    groups: wave.groups.map(group => ({ ...group, level: fixedLevel })),
  }));
}

function getHighestPlantLevel(plants: PlantType[], towerLevels?: TowerLevelMap) {
  const upgradeablePlants = plants.filter(plant => BASE_PLANTS_CONFIG[plant]?.upgradeable !== false);
  return Math.max(1, ...upgradeablePlants.map(plant => Math.max(1, Math.floor(towerLevels?.[plant] || 1))));
}

function hasChallenge(challenges: ChallengeId[], id: ChallengeId) {
  return challenges.includes(id);
}

function getLevelMonsterTypes(waves: WaveDef[]) {
  const seen = new Set<ShapeType>();
  waves.forEach(wave => {
    wave.groups.forEach(group => seen.add(group.type));
  });
  return Array.from(seen);
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [pageTransition, setPageTransition] = useState<PageTransitionState>('idle');
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
    return getToken() ? (shouldShowTutorial() ? 'tutorial' : 'hub') : 'auth';
  });
  const lastNonBookStageRef = useRef<NonBookStage>(
    (() => {
      const initial = typeof window !== 'undefined' && (window.location.pathname === '/book' || window.location.pathname === '/ranking')
        ? (getToken() ? (shouldShowTutorial() ? 'tutorial' : 'hub') : 'auth')
        : stage;
      return (initial === 'book' || initial === 'ranking') ? (getToken() ? (shouldShowTutorial() ? 'tutorial' : 'hub') : 'auth') : initial;
    })()
  );
  const transitionTimersRef = useRef<number[]>([]);
  const clearTransitionTimers = useCallback(() => {
    transitionTimersRef.current.forEach(timer => window.clearTimeout(timer));
    transitionTimersRef.current = [];
  }, []);
  const navigateWithTransition = useCallback((targetStage: Stage) => {
    clearTransitionTimers();
    setPageTransition('leaving');
    const leaveTimer = window.setTimeout(() => {
      setStage(targetStage);
      setPageTransition('entering');
      const enterTimer = window.setTimeout(() => {
        setPageTransition('idle');
        transitionTimersRef.current = [];
      }, 260);
      transitionTimersRef.current = [enterTimer];
    }, 160);
    transitionTimersRef.current = [leaveTimer];
  }, [clearTransitionTimers]);

  useEffect(() => () => clearTransitionTimers(), [clearTransitionTimers]);

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
    const fallback = lastNonBookStageRef.current ?? (getToken() ? (shouldShowTutorial() ? 'tutorial' : 'hub') : 'auth');
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
        const fallback = lastNonBookStageRef.current ?? (getToken() ? (shouldShowTutorial() ? 'tutorial' : 'hub') : 'auth');
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
  const [activeLabConfig, setActiveLabConfig] = useState<BalanceLabConfig | null>(null);
  const [pendingCardSelect, setPendingCardSelect] = useState<PendingCardSelect | null>(null);
  const [pendingLevelStart, setPendingLevelStart] = useState<PendingLevelStart | null>(null);
  const [challengeConfigLevelIndex, setChallengeConfigLevelIndex] = useState<number | null>(null);
  const [activeChallengeRun, setActiveChallengeRun] = useState<ActiveChallengeRun | null>(null);
  const [atUnlockNotice, setAtUnlockNotice] = useState<AtUnlockNotice | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState(1);

  const [starSel, setStarSel] = useState<Record<number, DifficultyCode>>({});
  const [challengeSel, setChallengeSel] = useState<Record<number, ChallengeId[]>>({});
  const [currentStar, setCurrentStar] = useState<1|2|3>(1);
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyCode>('EZ');

  useEffect(() => {
    if (stage !== 'select') {
      setChallengeConfigLevelIndex(null);
    }
  }, [stage]);

  const [hub, setHub] = useState<HubData | null>(null);
  const [showUpdateAnnouncement, setShowUpdateAnnouncement] = useState(false);
  const [confirmingUpdateAnnouncement, setConfirmingUpdateAnnouncement] = useState(false);
  const [updateAnnouncementError, setUpdateAnnouncementError] = useState<string | null>(null);
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
  const introductionLoadedRef = useRef(false);
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
        diamonds: d.diamonds ?? 0,
        experience: d.experience ?? 0,
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

  useEffect(() => {
    if (!dataFinished || !getToken()) {
      setShowUpdateAnnouncement(false);
      return;
    }

    let cancelled = false;
    void hasReadReleaseAnnouncement(CURRENT_RELEASE.version).then(seen => {
      if (!cancelled && seen === false) {
        setUpdateAnnouncementError(null);
        setShowUpdateAnnouncement(true);
      }
    });
    return () => { cancelled = true; };
  }, [dataFinished]);

  const confirmUpdateAnnouncement = useCallback(async () => {
    setConfirmingUpdateAnnouncement(true);
    setUpdateAnnouncementError(null);
    try {
      const saved = await acknowledgeReleaseAnnouncement(CURRENT_RELEASE.version);
      if (!saved) throw new Error('更新公告状态保存失败，请检查网络后重试。');
      setShowUpdateAnnouncement(false);
    } catch (error) {
      setUpdateAnnouncementError(getErrorMessage(error, '更新公告状态保存失败，请重试。'));
    } finally {
      setConfirmingUpdateAnnouncement(false);
    }
  }, []);

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
          plantSeeds: data.plantSeeds || 0,
          chestSeeds: data.chestSeeds || 0,
          chestType: data.chestType || 'common',
          newUnlocks: data.newUnlocks || [],
        });
      }
    } catch (err) {
      console.error('openChest failed', err);
    } finally {
      await loadHub();
      setOpeningChestId(null);
    }
  }
  async function skipChest(chestId: string, currency: 'diamonds' | 'coins' = 'diamonds') {
    try {
      await skipChestUnlock(chestId, currency);
      await loadHub();
    } catch (err) {
      alert('跳过失败：' + getErrorMessage(err, currency === 'coins' ? '金币不足或网络错误' : '钻石不足或网络错误'));
    }
  }
  async function craftLegendary() {
    try {
      await craftLegendaryChest();
      await loadHub();
    } catch (err) {
      alert('合成失败：' + getErrorMessage(err, '宝箱数量不足或网络错误'));
    }
  }
  async function upgradeTower(towerType: string) {
    await upgradeCloudTower(towerType);
    await loadHub();
  }

  const startIntroductionLevel = useCallback(() => {
    const M = MAPS.find(m => m.id === INTRODUCTION_LEVEL.mapId);
    if (!M) {
      console.warn('Introduction map not found', INTRODUCTION_LEVEL.mapId);
      return;
    }
    const plantGrid = getPlantGrid(M);
    const allowedPlants = DEFAULT_UNLOCKED_ITEMS
      .filter(item => Object.prototype.hasOwnProperty.call(BASE_PLANTS_CONFIG, item))
      .map(item => item as PlantType);

    setActiveFunMode(null);
    setWinReward(null);
    setActiveChallengeRun(null);
    setCurrentStar(1);
    setCurrentDifficulty('EZ');
    setLevelIndex(null);
    loadLevel(
      { startGold: INTRODUCTION_LEVEL.startGold, lives: INTRODUCTION_LEVEL.lives, waves: INTRODUCTION_LEVEL.waves },
      { path: M.path, size: M.size, roadWidthCells: M.roadWidthCells, plantGrid },
      {
        autoStartFirstWave: INTRODUCTION_LEVEL.autoStartFirstWave,
        firstWaveDelaySec: INTRODUCTION_LEVEL.firstWaveDelaySec,
        allowedPlants,
        allowedElements: [],
        mode: 'campaign',
      },
    );
  }, [loadLevel]);

  useEffect(() => {
    if (stage !== 'tutorial') {
      introductionLoadedRef.current = false;
      return;
    }
    if (introductionLoadedRef.current) return;
    startIntroductionLevel();
    introductionLoadedRef.current = true;
  }, [stage, startIntroductionLevel]);



  const beginLevelWithChallenges = (idx: number, difficulty: DifficultyCode, challenges: ChallengeId[] = []) => {
    setActiveFunMode(null);
    setActiveLabConfig(null);
    setPendingCardSelect(null);
    setPendingLevelStart(null);
    setWinReward(null);
    setActiveChallengeRun(null);
    const L = LEVELS[idx];
    if (!L) return;
    if (!hasLevelDifficultyDraft(L, difficulty)) return;
    const chosenStar = STAR_BY_DIFFICULTY[difficulty];
    const selectedLevel = getLevelSpecForDifficulty(L, difficulty);
    const M = MAPS.find(m => m.id === selectedLevel.mapId);
    if (!M) { console.warn('Map not found for level', selectedLevel.mapId); return; }
    const plantGrid = getPlantGrid(M); // 获取可种植格子点
    const unlockedItems = getUnlockedItems();
    const allowedPlantsRaw = unlockedItems.filter((item): item is PlantType => Object.prototype.hasOwnProperty.call(BASE_PLANTS_CONFIG, item));
    let allowedPlants = Array.from(new Set(allowedPlantsRaw.length > 0 ? allowedPlantsRaw : [...DEFAULT_UNLOCKED_ITEMS])) as PlantType[];
    let allowedElements = Array.from(new Set(unlockedItems
      .filter(item => item.startsWith('element:'))
      .map(item => item.split(':')[1])
      .filter((el): el is ElementType => Object.prototype.hasOwnProperty.call(ELEMENT_PLANT_CONFIG, el)))) as ElementType[];
    let startGold = selectedLevel.startGold;
    let autoStartFirstWave = selectedLevel.autoStartFirstWave;
    let firstWaveDelaySec = selectedLevel.firstWaveDelaySec;
    let waves = selectedLevel.waves;
    let disableKillRewards = false;
    const towerLevels: TowerLevelMap = hub?.towerLevels ? { ...hub.towerLevels } : {};
    const atModeConfig: AtModeConfig | null = difficulty === 'AT' ? (selectedLevel.atModeConfig ?? { type: 'normal' }) : null;
    const atBaseModeType = getAtBaseModeType(atModeConfig);
    const challengeStartLives = hasChallenge(challenges, 'halfHealth')
      ? Math.max(1, Math.ceil(selectedLevel.lives / 2))
      : selectedLevel.lives;

    const finalizeLevelStart = (plants: PlantType[], elements: ElementType[], finalWaves = waves, finalTowerLevels = towerLevels) => {
      loadLevel(
        { startGold, lives: challengeStartLives, waves: finalWaves },
        { path: M.path, size: M.size, roadWidthCells: M.roadWidthCells, plantGrid },
        {
          autoStartFirstWave,
          firstWaveDelaySec,
          towerLevels: finalTowerLevels,
          allowedPlants: plants,
          allowedElements: elements,
          mode: atModeConfig ? 'at' : 'campaign',
          atModeConfig,
          specialEnemyConfig: selectedLevel.specialEnemyConfig,
          maxLives: selectedLevel.lives,
          disableKillRewards,
        }
      );

      setCurrentStar(chosenStar);
      setCurrentDifficulty(difficulty);
      setLevelIndex(idx);
      setActiveChallengeRun({ selected: challenges, startLives: challengeStartLives });
      navigateWithTransition('playing');
    };

    if (atModeConfig && atBaseModeType === 'conveyor') {
      const pool = atModeConfig.conveyor?.pool ?? [];
      const poolPlants = pool.filter((item): item is { kind: 'plant'; id: PlantType } => item.kind === 'plant').map(item => item.id);
      const poolElements = pool.filter((item): item is { kind: 'element'; id: ElementType } => item.kind === 'element').map(item => item.id);
      if (pool.length > 0) {
        allowedPlants = Array.from(new Set(poolPlants));
        allowedElements = Array.from(new Set(poolElements));
      }
      allowedPlants.forEach(plant => {
        if (BASE_PLANTS_CONFIG[plant]?.upgradeable === false) return;
        towerLevels[plant] = Math.max(1, Math.floor(towerLevels[plant] || 1));
      });
      allowedElements.forEach(element => {
        const key = `element:${element}` as const;
        towerLevels[key] = Math.max(1, Math.floor(towerLevels[key] || 1));
      });
    } else if (atModeConfig && atBaseModeType === 'lastStand') {
      const bannedPlants = new Set<PlantType>([...(atModeConfig.lastStand?.bannedPlants ?? []), 'sunflower']);
      allowedPlants = allowedPlants.filter(plant => !bannedPlants.has(plant));
      startGold = atModeConfig.lastStand?.startGold ?? startGold;
      autoStartFirstWave = false;
      firstWaveDelaySec = selectedLevel.firstWaveDelaySec;
      disableKillRewards = true;
    } else if (atModeConfig && atBaseModeType === 'cardSelect') {
      const cardSelect = atModeConfig.cardSelect ?? { maxPlants: 5, maxElements: 2, monsterLevelMultiplier: 10 };
      setPendingCardSelect({
        title: `${selectedLevel.name} / AT Lv.${getLevelDifficultyRatings(L.id, idx + 1).AT ?? '-'}`,
        plantOptions: allowedPlants,
        elementOptions: allowedElements,
        maxPlants: Math.max(1, cardSelect.maxPlants),
        maxElements: Math.max(0, cardSelect.maxElements),
        towerLevels,
        returnStage: 'select',
        onConfirm: (plants, elements) => {
          const highestPlantLevel = getHighestPlantLevel(plants, towerLevels);
          const fixedLevel = Math.max(1, Math.round(highestPlantLevel * Math.max(1, cardSelect.monsterLevelMultiplier)));
          setPendingCardSelect(null);
          finalizeLevelStart(plants, elements, cloneWavesWithMonsterLevel(waves, fixedLevel), towerLevels);
        },
      });
      navigateWithTransition('cardSelect');
      return;
    }

    finalizeLevelStart(allowedPlants, allowedElements);
  };

  const startLevel = (idx: number, difficultyOverride?: DifficultyCode | 1 | 2 | 3) => {
    const L = LEVELS[idx];
    if (!L) return;
    const requestedDifficulty = typeof difficultyOverride === 'number'
      ? DIFFICULTY_BY_STAR[difficultyOverride]
      : difficultyOverride ?? starSel[idx] ?? 'EZ';
    const difficulty = getPlayableDifficulty(LEVELS, idx, requestedDifficulty);
    if (!hasLevelDifficultyDraft(L, difficulty)) return;
    setPendingLevelStart({ levelIndex: idx, difficulty, challenges: challengeSel[idx] ?? [] });
  };

  const confirmPendingLevelStart = () => {
    if (!pendingLevelStart) return;
    const pending = pendingLevelStart;
    setPendingLevelStart(null);
    beginLevelWithChallenges(pending.levelIndex, pending.difficulty, pending.challenges);
  };

  const openBookFromLevelStart = () => {
    setPendingLevelStart(null);
    goToBook();
  };

  const toggleLevelChallenge = (idx: number, challenge: ChallengeId) => {
    setChallengeSel(prev => {
      const current = prev[idx] ?? [];
      const next = current.includes(challenge)
        ? current.filter(item => item !== challenge)
        : [...current, challenge];
      return { ...prev, [idx]: next };
    });
  };

  const toNextLevel = () => {
    if (levelIndex==null) return;
    const next = levelIndex + 1;
    if (next < LEVELS.length) {
      setSelectedChapterId(getChapterForLevelIndex(next).id);
      startLevel(next);
    } else {
      // 全部通关，回到章节选择
      navigateWithTransition('chapters');
      setLevelIndex(null);
    }
  };

  const restartLevel = () => {
    if (levelIndex==null) return;
    startLevel(levelIndex);
  };

  const startFunMode = useCallback((mode: FunModeType) => {
    setActiveLabConfig(null);
    setActiveChallengeRun(null);
    const finalizeStart = () => {
      setActiveFunMode(mode);
      setWinReward(null);
      setCurrentStar(1);
      setCurrentDifficulty('EZ');
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
        if (BASE_PLANTS_CONFIG[plant]?.upgradeable === false) return;
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
        if (BASE_PLANTS_CONFIG[plant]?.upgradeable === false) continue;
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

  const startLabTest = useCallback((config: BalanceLabConfig) => {
    const labMap = MAPS.find(m => m.id === config.mapId);
    if (!labMap) {
      alert('Lab map missing, cannot start');
      return;
    }
    const plantGrid = getPlantGrid(labMap);
    setActiveFunMode(null);
    setActiveLabConfig(config);
    setWinReward(null);
    setActiveChallengeRun(null);
    setCurrentStar(1);
    setCurrentDifficulty(config.targetDifficulty);
    setLevelIndex(null);
    setPendingCardSelect(null);

    const atModeConfig = config.targetDifficulty === 'AT' ? (config.atModeConfig ?? { type: 'normal' }) : null;
    const atBaseModeType = getAtBaseModeType(atModeConfig);
    let allowedPlants: PlantType[] = [...PLANT_TYPES];
    let allowedElements: ElementType[] = [...ELEMENT_TYPES];
    let startGold = config.startGold;
    let autoStartFirstWave = config.autoStartFirstWave;
    let firstWaveDelaySec = config.firstWaveDelaySec;
    let disableKillRewards = false;
    const towerLevels: TowerLevelMap = { ...config.towerLevels };

    const finalizeLabStart = (plants: PlantType[], elements: ElementType[], waves: WaveDef[] = config.waves) => {
      loadLevel(
        { startGold, lives: config.lives, waves },
        { path: labMap.path, size: labMap.size, roadWidthCells: labMap.roadWidthCells, plantGrid },
        {
          autoStartFirstWave,
          firstWaveDelaySec,
          towerLevels,
          allowedPlants: plants,
          allowedElements: elements,
          mode: 'lab',
          atModeConfig,
          specialEnemyConfig: config.specialEnemyConfig,
          maxLives: config.lives,
          disableKillRewards,
        },
      );
      navigateWithTransition('playing');
    };

    if (atModeConfig && atBaseModeType === 'conveyor') {
      const pool = atModeConfig.conveyor?.pool ?? [];
      if (pool.length > 0) {
        allowedPlants = Array.from(new Set(pool.filter((item): item is { kind: 'plant'; id: PlantType } => item.kind === 'plant').map(item => item.id)));
        allowedElements = Array.from(new Set(pool.filter((item): item is { kind: 'element'; id: ElementType } => item.kind === 'element').map(item => item.id)));
      }
      allowedPlants.forEach(plant => {
        if (BASE_PLANTS_CONFIG[plant]?.upgradeable === false) return;
        towerLevels[plant] = Math.max(1, Math.floor(towerLevels[plant] || 1));
      });
      allowedElements.forEach(element => {
        const key = `element:${element}` as const;
        towerLevels[key] = Math.max(1, Math.floor(towerLevels[key] || 1));
      });
    } else if (atModeConfig && atBaseModeType === 'lastStand') {
      const bannedPlants = new Set<PlantType>([...(atModeConfig.lastStand?.bannedPlants ?? []), 'sunflower']);
      allowedPlants = allowedPlants.filter(plant => !bannedPlants.has(plant));
      startGold = atModeConfig.lastStand?.startGold ?? startGold;
      autoStartFirstWave = false;
      firstWaveDelaySec = config.firstWaveDelaySec;
      disableKillRewards = true;
    } else if (atModeConfig && atBaseModeType === 'cardSelect') {
      const cardSelect = atModeConfig.cardSelect ?? { maxPlants: 5, maxElements: 2, monsterLevelMultiplier: 10 };
      setPendingCardSelect({
        title: `${config.levelName} / AT Lv.${config.difficultyRatings.AT ?? '-'}`,
        plantOptions: allowedPlants,
        elementOptions: allowedElements,
        maxPlants: Math.max(1, cardSelect.maxPlants),
        maxElements: Math.max(0, cardSelect.maxElements),
        towerLevels,
        returnStage: 'lab',
        onConfirm: (plants, elements) => {
          const highestPlantLevel = getHighestPlantLevel(plants, towerLevels);
          const fixedLevel = Math.max(1, Math.round(highestPlantLevel * Math.max(1, cardSelect.monsterLevelMultiplier)));
          setPendingCardSelect(null);
          finalizeLabStart(plants, elements, cloneWavesWithMonsterLevel(config.waves, fixedLevel));
        },
      });
      navigateWithTransition('cardSelect');
      return;
    }

    finalizeLabStart(allowedPlants, allowedElements);
  }, [loadLevel, navigateWithTransition]);

  const funModeLabel = activeFunMode ? FUN_MODE_LABELS[activeFunMode] : '';
  const currentDifficultyLabel = useMemo(() => {
    if (levelIndex == null) return null;
    const level = LEVELS[levelIndex];
    const rating = getLevelDifficultyRatings(level.id, levelIndex + 1)[currentDifficulty];
    return `${currentDifficulty} Lv.${rating ?? '-'}`;
  }, [currentDifficulty, levelIndex]);

  const pendingLevelPreview = useMemo(() => {
    if (!pendingLevelStart) return null;
    const level = LEVELS[pendingLevelStart.levelIndex];
    if (!level) return null;
    const selectedLevel = getLevelSpecForDifficulty(level, pendingLevelStart.difficulty);
    if (!hasLevelDifficultyDraft(level, pendingLevelStart.difficulty)) return null;
    const ratings = getLevelDifficultyRatings(level.id, pendingLevelStart.levelIndex + 1);
    return {
      levelName: selectedLevel.name,
      difficultyLabel: `${pendingLevelStart.difficulty} Lv.${ratings[pendingLevelStart.difficulty] ?? '-'}`,
      monsters: getLevelMonsterTypes(selectedLevel.waves),
    };
  }, [pendingLevelStart]);

  const challengeConfigPreview = useMemo(() => {
    if (challengeConfigLevelIndex == null) return null;
    const level = LEVELS[challengeConfigLevelIndex];
    if (!level) return null;
    const requestedDifficulty = starSel[challengeConfigLevelIndex] ?? 'EZ';
    const difficulty = getPlayableDifficulty(LEVELS, challengeConfigLevelIndex, requestedDifficulty);
    if (!hasLevelDifficultyDraft(level, difficulty)) return null;
    const selectedLevel = getLevelSpecForDifficulty(level, difficulty);
    const ratings = getLevelDifficultyRatings(level.id, challengeConfigLevelIndex + 1);
    return {
      levelIndex: challengeConfigLevelIndex,
      levelName: selectedLevel.name,
      difficultyLabel: `${difficulty} Lv.${ratings[difficulty] ?? '-'}`,
      selected: challengeSel[challengeConfigLevelIndex] ?? [],
    };
  }, [challengeConfigLevelIndex, challengeSel, starSel]);

  const handleGameWin = useCallback(async () => {
    if (levelIndex != null) {
      const L = LEVELS[levelIndex];
      const selectedLevel = getLevelSpecForDifficulty(L, currentDifficulty);
      const endLives = useTDStore.getState().lives;
      const startLivesForRun = activeChallengeRun?.startLives ?? selectedLevel.lives;
      const fullHealthClear = currentDifficulty === 'IN' && endLives >= startLivesForRun;
      const challengeDiamondReward = activeChallengeRun
        ? (hasChallenge(activeChallengeRun.selected, 'fullHealth') && endLives >= startLivesForRun ? 1 : 0)
          + (hasChallenge(activeChallengeRun.selected, 'halfHealth') ? 1 : 0)
        : 0;
      const result = await setStarCleared(L.id, currentStar, {
        fullHealth: fullHealthClear,
        difficulty: currentDifficulty,
        challengeDiamonds: challengeDiamondReward,
      });
      const ratings = getLevelDifficultyRatings(L.id, levelIndex + 1);
      const hasAtDifficulty = Boolean(hasLevelDifficultyDraft(L, 'AT') && typeof ratings.AT === 'number');
      if (hasAtDifficulty && result?.newFullHealthClear) {
        setAtUnlockNotice({ levelName: L.name });
      }
      const serverUnlocks = Array.isArray(result?.newUnlocks) ? (result.newUnlocks as string[]) : [];
      const totalUnlocks = Array.from(new Set(serverUnlocks));
      if (totalUnlocks.length > 0) {
        setHub(prev => {
          const base = prev ?? { coins: 0, magicKeys: 0, diamonds: 0, shards: {}, plantShards: {}, elementShards: {}, towerLevels: {}, chests: [], unlockedItems: [...DEFAULT_UNLOCKED_ITEMS] };
          const merged = new Set(base.unlockedItems ?? DEFAULT_UNLOCKED_ITEMS);
          totalUnlocks.forEach((item: string) => merged.add(item));
          return { ...base, unlockedItems: Array.from(merged) };
        });
      }
      if (result && (result.rewardCoins > 0 || (result.diamondReward ?? 0) > 0 || (result.chestTypes?.length ?? 0) > 0 || result.chestType)) {
        const chestTypes = Array.isArray(result.chestTypes)
          ? result.chestTypes
          : result.chestType
            ? [result.chestType]
            : [];
        const chestTypeName = chestTypes.length > 0
          ? chestTypes.map(type => resolveChestTypeName(type)).join('、')
          : '';
        const chanceText = typeof result.repeatChestChance === 'number'
          ? `（掉率 ${Math.round(result.repeatChestChance * 100)}%）`
          : '';
        const diamondText = result.diamondReward ? `，钻石 +${result.diamondReward}` : '';
        const chestText = chestTypeName ? `，${chestTypeName}宝箱` : '';
        const rewardMsg = result.atFirstClear
          ? `AT首通奖励：金币 +${result.rewardCoins}${chestText}${diamondText}`
          : result.newRecord
            ? `通关奖励：金币 +${result.rewardCoins}${chestText}${diamondText}`
            : chestTypeName
              ? `重复通关：金币 +${result.rewardCoins}，掉落${chestTypeName}宝箱${chanceText}${diamondText}`
              : `重复通关：金币 +${result.rewardCoins}，宝箱未掉落${chanceText}${diamondText}`;
        const finalRewardMsg = result.chestInventoryFull
          ? `${rewardMsg}（宝箱库存已满，超出部分未发放）`
          : rewardMsg;
        setWinReward({
          coins: result.rewardCoins,
          chestType: result.chestType ?? null,
          chestTypes,
          chestAwarded: Boolean(result.chestAwarded),
          repeatChestChance: result.repeatChestChance,
          newRecord: Boolean(result.newRecord),
          diamonds: result.diamondReward ?? 0,
          message: finalRewardMsg,
        });
      }
      const prevUnlocked = getUnlocked();
      const nextUnlock = Math.min(LEVELS.length, levelIndex + 2);
      // 只有当玩家通关的关卡是当前解锁的最高关卡时，才解锁下一关
      if (levelIndex + 1 === prevUnlocked) {
        setUnlockedPersist(nextUnlock);
        setUnlockedState(nextUnlock);
        const unlockedChapter = Math.ceil(nextUnlock / 10);
        if (unlockedChapter > selectedChapterId) {
          setSelectedChapterId(unlockedChapter);
        }
      }
      await loadHub();
      setUnlockedState(getUnlocked());
    }
    setActiveChallengeRun(null);
    navigateWithTransition('won');
  }, [activeChallengeRun, currentDifficulty, currentStar, levelIndex, loadHub, navigateWithTransition, selectedChapterId]);

  const handleAuth = useCallback(() => {
    setIsLoading(true);
    setAnimationFinished(false);
    setDataFinished(false);
    loadHub().then(() => {
      navigateWithTransition(shouldShowTutorial() ? 'tutorial' : 'hub');
    });
  }, [loadHub, navigateWithTransition]);

  const handleTutorialComplete = useCallback(() => {
    markTutorialSeen();
    navigateWithTransition('hub');
  }, [navigateWithTransition]);

  if (isLoading) {
    return <LoadingScreen onAnimationComplete={() => setAnimationFinished(true)} />;
  }

  return (
    <div className="app-shell">
      <div key={stage} className={`stage-container stage-container-${pageTransition}`}>
        {stage === 'auth' && (
          <AuthPage
            onAuthed={handleAuth}
            onEnterLab={() => {
              setActiveFunMode(null);
              setActiveLabConfig(null);
              navigateWithTransition('lab');
            }}
          />
        )}

        {stage !== 'auth' && (
          <>
            {/* 简易登录/注册栏 - 游戏进行时不显示 */}
            {stage !== 'playing' && stage !== 'tutorial' && (
              <AuthBar
                wallet={hub ?? undefined}
                onShowAbout={() => setShowAbout(true)}
                onNavigateBook={stage === 'book' || stage === 'ranking' ? undefined : goToBook}
                onNavigateRanking={stage === 'ranking' || stage === 'book' ? undefined : goToRanking}
                onNavigateTasks={stage === 'hub' ? () => {
                  window.history.pushState({}, '', '/tasks');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                } : undefined}
                onNavigateGarden={stage === 'hub' ? () => {
                  window.history.pushState({}, '', '/garden');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                } : undefined}
                onNavigateStudy={stage === 'hub' ? () => {
                  window.history.pushState({}, '', '/study');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                } : undefined}
              />
            )}
            {stage === 'tutorial' && (
              <TDGame
                tutorialMode
                onTutorialSkip={handleTutorialComplete}
                onWin={handleTutorialComplete}
                onLose={startIntroductionLevel}
                onExit={handleTutorialComplete}
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
                onCraftLegendary={craftLegendary}
                onStartGame={() => { setActiveFunMode(null); navigateWithTransition('chapters'); }}
                onOpenFunMode={() => navigateWithTransition('fun')}
              />
            )}

            {stage === 'fun' && (
              <FunModePage
                onBack={() => { setActiveFunMode(null); navigateWithTransition('hub'); }}
                onStartMode={startFunMode}
                onOpenLab={() => navigateWithTransition('lab')}
              />
            )}

            {stage === 'lab' && (
              <BalanceLabPage
                onBack={() => { setActiveLabConfig(null); navigateWithTransition(getToken() ? 'fun' : 'auth'); }}
                onStartTest={startLabTest}
              />
            )}

            {stage === 'chapters' && (
              <ChapterSelectPage
                unlocked={unlocked}
                onBack={() => navigateWithTransition('hub')}
                onSelectChapter={(chapterId) => {
                  setSelectedChapterId(chapterId);
                  navigateWithTransition('select');
                }}
              />
            )}

            {stage === 'select' && (
              <LevelSelectPage
                unlocked={unlocked}
                magicKeys={hub?.magicKeys ?? 0}
                starSel={starSel}
                challengeSel={challengeSel}
                unlockedItemsSet={unlockedItemsSet}
                chapterId={selectedChapterId}
                onBack={() => navigateWithTransition('chapters')}
                onSelectDifficulty={(levelIdx, difficulty) => setStarSel(prev => ({ ...prev, [levelIdx]: difficulty }))}
                onOpenChallengeConfig={(levelIdx) => setChallengeConfigLevelIndex(levelIdx)}
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

            {stage === 'cardSelect' && pendingCardSelect && (
              <CardSelectPage
                title={pendingCardSelect.title}
                plantOptions={pendingCardSelect.plantOptions}
                elementOptions={pendingCardSelect.elementOptions}
                maxPlants={pendingCardSelect.maxPlants}
                maxElements={pendingCardSelect.maxElements}
                towerLevels={pendingCardSelect.towerLevels}
                onBack={() => {
                  const returnStage = pendingCardSelect.returnStage;
                  setPendingCardSelect(null);
                  navigateWithTransition(returnStage);
                }}
                onConfirm={pendingCardSelect.onConfirm}
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
                difficultyLabel={activeLabConfig ? `${activeLabConfig.targetDifficulty} Lv.${activeLabConfig.difficultyRatings[activeLabConfig.targetDifficulty] ?? ''}` : currentDifficultyLabel}
                onWin={activeLabConfig ? () => navigateWithTransition('lab') : handleGameWin}
                onLose={activeLabConfig ? () => navigateWithTransition('lab') : () => {
                  setActiveChallengeRun(null);
                  navigateWithTransition('lost');
                }}
                onExit={() => {
                  setWinReward(null);
                  setActiveChallengeRun(null);
                  setLevelIndex(null);
                  navigateWithTransition(activeLabConfig ? 'lab' : activeFunMode ? 'fun' : 'select');
                }}
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
                  setStarSel(prev => ({ ...prev, [levelIndex]: DIFFICULTY_BY_STAR[nextStar] }));
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

      {pendingLevelPreview && (
        <LevelStartModal
          levelName={pendingLevelPreview.levelName}
          difficultyLabel={pendingLevelPreview.difficultyLabel}
          monsters={pendingLevelPreview.monsters}
          onStart={confirmPendingLevelStart}
          onOpenBook={openBookFromLevelStart}
        />
      )}

      {challengeConfigPreview && (
        <ChallengeConfigModal
          levelName={challengeConfigPreview.levelName}
          difficultyLabel={challengeConfigPreview.difficultyLabel}
          selected={challengeConfigPreview.selected}
          onToggle={(challenge) => toggleLevelChallenge(challengeConfigPreview.levelIndex, challenge)}
          onClose={() => setChallengeConfigLevelIndex(null)}
        />
      )}

      {atUnlockNotice && (
        <div className="modal-backdrop" style={{ zIndex: 1200 }}>
          <div className="glass-panel modal-panel">
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
              恭喜！你已解锁本关的AT难度！
            </div>
            <p style={{ color: '#475569', lineHeight: 1.55, marginBottom: 16 }}>
              AT难度解锁条件为：IN难度满血通关。
            </p>
            <button onClick={() => setAtUnlockNotice(null)} className="action-button primary" style={{ width: '100%' }}>
              知道了
            </button>
          </div>
        </div>
      )}

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showUpdateAnnouncement && stage !== 'auth' && (
        <UpdateAnnouncementModal
          confirming={confirmingUpdateAnnouncement}
          error={updateAnnouncementError}
          onConfirm={confirmUpdateAnnouncement}
        />
      )}
    </div>
  );
}

function RootApp() {
  const readPath = () => typeof window === 'undefined' ? '/' : window.location.pathname.replace(/\/+$/, '') || '/';
  const [pathname, setPathname] = useState(readPath);

  useEffect(() => {
    const handlePopState = () => setPathname(readPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (pathname === '/study') {
    return (
      <StudyPage
        onExit={() => {
          window.history.pushState({}, '', '/');
          setPathname('/');
        }}
      />
    );
  }

  if (pathname === '/tasks') {
    return (
      <TasksPage
        onBack={() => {
          window.history.pushState({}, '', '/');
          setPathname('/');
        }}
      />
    );
  }

  if (pathname === '/garden') {
    return (
      <GardenPage
        onBack={() => {
          window.history.pushState({}, '', '/');
          setPathname('/');
        }}
      />
    );
  }

  if (pathname === '/admin') {
    return (
      <AdminPage
        onExit={() => {
          window.history.pushState({}, '', '/');
          setPathname('/');
        }}
      />
    );
  }

  return <App />;
}

export default RootApp;
