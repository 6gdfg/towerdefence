import { fetchCloudProgress, getToken } from './authProgress';
import { DEFAULT_UNLOCKED_ITEMS } from '../../shared/unlocks';
import { readApiJson } from './apiClient';
import type { DifficultyCode } from './levelRatings';

type CloudDataCache = {
  stars: Record<string, number>;
  fullHealthClears: Record<string, boolean>;
  unlocked: number;
  unlockedItems: string[];
};

export type SetStarResult = {
  ok: boolean;
  star: number;
  rewardCoins: number;
  chestId?: string | null;
  chestType?: string | null;
  chestTypes?: string[];
  chestAwarded?: boolean;
  repeatChestChance?: number;
  newRecord?: boolean;
  newUnlocks?: string[];
  fullHealthClear?: boolean;
  newFullHealthClear?: boolean;
  diamondReward?: number;
  atFirstClear?: boolean;
};

let cloudDataCache: CloudDataCache | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000;

async function fetchCloudData() {
  const now = Date.now();
  if (cloudDataCache && now - cacheTimestamp < CACHE_DURATION) {
    return cloudDataCache;
  }

  try {
    const d = await fetchCloudProgress();
    cloudDataCache = {
      stars: d.stars ?? {},
      fullHealthClears: d.fullHealthClears ?? {},
      unlocked: typeof d.unlocked === 'number' && d.unlocked >= 1 ? d.unlocked : 1,
      unlockedItems: Array.isArray(d.unlockedItems) && d.unlockedItems.length > 0 ? d.unlockedItems : [...DEFAULT_UNLOCKED_ITEMS],
    };
    cacheTimestamp = now;
    return cloudDataCache;
  } catch {
    return { stars: {}, fullHealthClears: {}, unlocked: 1, unlockedItems: [...DEFAULT_UNLOCKED_ITEMS] };
  }
}

export function getUnlocked(): number {
  const cache = cloudDataCache;
  return cache ? cache.unlocked : 1;
}

export function setUnlocked(n: number) {
  if (cloudDataCache) {
    cloudDataCache.unlocked = Math.max(1, n);
  }
}

export function getUnlockedItems(): string[] {
  const cache = cloudDataCache;
  return cache ? [...cache.unlockedItems] : [...DEFAULT_UNLOCKED_ITEMS];
}

export function updateUnlockedItems(newItems: string[]) {
  if (!newItems || newItems.length === 0) return;
  if (!cloudDataCache) {
    cloudDataCache = { stars: {}, fullHealthClears: {}, unlocked: 1, unlockedItems: [...DEFAULT_UNLOCKED_ITEMS, ...newItems] };
    return;
  }
  const set = new Set(cloudDataCache.unlockedItems);
  newItems.forEach(item => set.add(item));
  cloudDataCache.unlockedItems = Array.from(set);
}

export async function getMaxStar(levelId: string): Promise<0 | 1 | 2 | 3> {
  const data = await fetchCloudData();
  const v = data.stars[levelId] ?? 0;
  return (v === 1 || v === 2 || v === 3) ? v : 0;
}

export function getMaxStarSync(levelId: string): 0 | 1 | 2 | 3 {
  const cache = cloudDataCache;
  if (!cache) return 0;
  const v = cache.stars[levelId] ?? 0;
  return (v === 1 || v === 2 || v === 3) ? v : 0;
}

export function getInFullHealthClearSync(levelId: string): boolean {
  const cache = cloudDataCache;
  return Boolean(cache?.fullHealthClears[levelId]);
}

export async function setStarCleared(
  levelId: string,
  star: 1 | 2 | 3,
  opts?: { fullHealth?: boolean; difficulty?: DifficultyCode; challengeDiamonds?: number },
): Promise<SetStarResult | null> {
  try {
    const token = getToken();
    const resp = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        action: 'setStar',
        levelId,
        star,
        fullHealth: Boolean(opts?.fullHealth),
        difficulty: opts?.difficulty,
        challengeDiamonds: Math.max(0, Math.floor(Number(opts?.challengeDiamonds) || 0)),
      }),
    });
    if (resp.ok) {
      const data = await readApiJson<SetStarResult>(resp, 'Failed to save progress');

      if (cloudDataCache) {
        const currentStar = cloudDataCache.stars[levelId] ?? 0;
        if (data.star > currentStar) {
          cloudDataCache.stars[levelId] = data.star;
        }
        if (data.fullHealthClear) {
          cloudDataCache.fullHealthClears[levelId] = true;
        }
      }
      if (Array.isArray(data.newUnlocks) && data.newUnlocks.length > 0) {
        updateUnlockedItems(data.newUnlocks);
      }

      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function getAllStars(): Record<string, number> {
  const cache = cloudDataCache;
  return cache ? cache.stars : {};
}

export async function refreshCache(): Promise<void> {
  cloudDataCache = null;
  cacheTimestamp = 0;
  await fetchCloudData();
}

export async function initCache(): Promise<void> {
  if (!cloudDataCache) {
    await fetchCloudData();
  }
}
